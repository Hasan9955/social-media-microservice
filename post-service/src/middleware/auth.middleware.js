

const logger = require('../utils/logger');


const verifyToken = (token, secret) => {
    return jwt.verify(token, secret);
};


const authenticateRequest = (req, res, next) => {
    const headersAuth = req?.headers.authorization;
    if (!headersAuth || !headersAuth.startsWith("Bearer ")) {
        throw new Error("Invalid authorization format!");
    }
    const token = headersAuth?.split(' ')[1]


    if (!token) {
        throw new Error("You are not authorized!");
    }

    const verifiedUser = verifyToken(
        token,
        process.env.JWT_SECRET
    );

    if (!verifiedUser?.hexCode) {
        throw new Error("You are not authorized!");
    }

    const { userId } = verifiedUser;
    req.userId = userId;
    next();

}


module.exports = {
    authenticateRequest
};