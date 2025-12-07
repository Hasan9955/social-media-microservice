require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const logger = require('./utils/logger');
const Redis = require('ioredis');
const { rateLimit } = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis')
const proxy = require('express-http-proxy');
const { error } = require('winston');
const errorHandler = require('./middleware/errorhandler');



const app = express();

const PORT = process.env.PORT || 3000;

const redisClient = new Redis(process.env.REDIS_URL);

app.use(helmet());
app.use(cors());
app.use(express.json());

//rate limiting
//IP base rate limiting for sensitive endpoints
const rateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
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

app.use(rateLimiter);


// app.use((req, res, next) => {
//     logger.info(`Received ${req.method} request to ${req.url}`)
//     logger.info(`Request body: ${req.body}`)

//     next();
// });

app.use((req, res, next) => {
    logger.info(`Received ${req.method} request to ${req.url}`);
    logger.info(`Request body: ${JSON.stringify(req.body)}`);
    next();
});



app.get('/', (req, res) => {
    res.status(200).json({ success: true, message: 'API Gateway is running' });
});

const proxyOptions = {
    
    proxyReqPathResolver: (req) => {
        return req.originalUrl.replace(/^\/v1/, '/api');
    },

    proxyErrorHandler: (err, res, next) => {
        logger.error(`Proxy error: ${err.message}`);
        res.status(500).json({ message: 'Internal Server Error', error: err.message });
    }
}


// setting up proxy for identity service
app.use('/v1/auth', proxy(process.env.IDENTITY_SERVICE_URL, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
        proxyReqOpts.headers["Content-Type"] = "application/json";
        return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
        logger.info(`Response received from Identity Service: ${proxyRes.statusCode}`);

        return proxyResData;
    }
}));
 
// Global error handler
app.use(errorHandler);


app.listen(PORT, () => {
    logger.info(`API Gateway is running on port ${PORT}`);
    logger.info(`Identity service is running on PORT ${process.env.IDENTITY_SERVICE_URL}`);
    logger.info(`Redis server is running on PORT ${process.env.REDIS_URL}`);
});