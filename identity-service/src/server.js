require('dotenv').config()

const mongoose = require('mongoose')
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const logger = require('./utils/logger')
const { RateLimiterRedis } = require('rate-limiter-flexible')
const Redis = require('ioredis')
const { rateLimit } = require('express-rate-limit')
const { RedisStore } = require('rate-limit-redis')
const routes = require('./routes/identity-route')
const errorHandler = require('./middleware/errorHandler')

const app = express();


// connect  to database
mongoose.connect(process.env.DATABASE_URL)
    .then(() => logger.info('Connected to mongodb'))
    .catch((err) => logger.error('Mongodb connection error', err))


const redisClient = new Redis(process.env.REDIS_URL)
const port = process.env.PORT || 8000;



//middleware
app.use(express.json())
app.use(cors())
app.use(helmet())


app.use((req, res, next) => {
    logger.info(`Received ${req.method} request to ${req.url}`)
    logger.info(`Request body: ${req.body}`)

    next();
});



//DDos protection and rate limiting
const rateLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'middleware',
    points: 10,
    duration: 1
})


app.use((req, res, next) => {
    rateLimiter.consume(req.ip).then(() => next()).catch(() => {
        logger.warn(`Rate limit exceeded for IP: ${req.ip}`)
        res.status(429).json({
            success: false,
            message: "Too many requests, please try again later"
        })
    })
})


//IP base rate limiting for sensitive endpoints
const sensitiveRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger.warn(`Sensitive endpoint rate limit exceeded for IP: ${req.ip}`)
        res.status(429).json({
            success: false,
            message: "Too many requests from this IP, please try again after 15 minutes"
        })
    },
    store: new RedisStore({
        sendCommand: (...args) => redisClient.call(...args)
    })
});



// apply sensitive rate limiter to auth routes
app.use('/api/auth/register', sensitiveRateLimiter);

//Routes
app.use('/api/auth', routes);


// Global error handler
app.use(errorHandler);

app.listen(port, () => {
    logger.info(`Identity service running on port ${port}`)
});


// unhandled promise rejection
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason)
});

// uncaught exception
process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception thrown:', err)
    process.exit(1)
});
