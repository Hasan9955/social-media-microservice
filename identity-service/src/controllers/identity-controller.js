
const RefreshToken = require('../models/RefreshToken')
const User = require('../models/user')
const generateToken = require('../utils/generateToken')
const logger = require('../utils/logger')
const { validateRegistration, validateLogin } = require('../utils/validation')

// user registration

const registerUser = async (req, res) => {

    logger.info('Registration endpoint hit....')
    try {

        //validate the schema 
        const { error } = validateRegistration(req.body)

        if (error) {
            logger.warn('Validation error', error.details[0].message)

            return res.status(400).json({
                success: false,
                message: error.details[0].message
            })

        }

        const { username, email, password } = req.body

        let user = await User.findOne({
            $or: [{ username }, { email }]
        })

        if (user) {
            logger.warn('User already exists')

            return res.status(400).json({
                success: false,
                message: 'User already exists'
            })
        }

        user = new User({
            username,
            email,
            password
        })
        await user.save();

        logger.warn('User created successfully', user._id)

        const { accessToken, refreshToken } = await generateToken(user)


        return res.status(201).json({
            success: true,
            message: 'User created successfully',
            accessToken,
            refreshToken
        })


    } catch (error) {
        logger.error('Registration error occurred', error)

        return res.status(500).json({
            success: false,
            message: 'Registration error occurred'
        })
    }
}


// user login 
const loginUser = async (req, res) => {
    logger.info('Login endpoint hit....')
    try {
        const { error } = validateLogin(req.body)

        if (error) {
            logger.warn('Validation error', error.details[0].message)

            return res.status(400).json({
                success: false,
                message: error.details[0].message

            })
        }

        const { email, password } = req.body
        const user = await User.findOne({ email })
        if (!user) {
            logger.warn('Invalid email or password')
            return res.status(400).json({
                success: false,
                message: 'Invalid email or password'
            })
        }

        // compare password
        const isMatch = await user.comparePassword(password)
        if (!isMatch) {
            logger.warn('Invalid email or password')
            return res.status(400).json({
                success: false,
                message: 'Invalid email or password'
            })
        }

        const { accessToken, refreshToken } = await generateToken(user)

        return res.status(200).json({
            success: true,
            message: 'Login successful',
            accessToken,
            refreshToken,
            userId: user._id
        })
    } catch (error) {
        logger.error('Login error occurred', error)

        return res.status(500).json({
            success: false,
            message: 'Login error occurred'
        })
    }
}


// refresh token
const refreshToken = async (req, res) => {
    logger.info('Refresh token endpoint hit....')
    try {

        const { refreshToken } = req.body
        console.log(refreshToken)
        if (!refreshToken) {
            logger.warn('Refresh token is required')
            return res.status(400).json({
                success: false,
                message: 'Refresh token is required'
            })
        }

        // verify refresh token
        const storedToken = await RefreshToken.findOne({ token: refreshToken })
        if (!storedToken || storedToken.expiryDate < new Date()) {
            logger.warn('Invalid or expired refresh token')
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired refresh token'
            })
        }
 
        const user = await User.findById(storedToken.user)
        
        if (!user) {
            logger.warn('User not found')
            return res.status(400).json({
                success: false,
                message: 'User not found'
            })
        }

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = await generateToken(user)



        // delete the old refresh token
        await RefreshToken.deleteOne({ _id: storedToken._id })

        return res.status(200).json({
            success: true,
            message: 'Token refreshed successfully',
            accessToken: newAccessToken,
            refreshToken: newRefreshToken
        })

    } catch (error) {
        logger.error('Refresh token error occurred', error)

        return res.status(500).json({
            success: false,
            message: 'Refresh token error occurred'
        })
    }
}

// logout
const logoutUser = async (req, res) => {
    logger.info('Logout endpoint hit....')
    try {
        const { refreshToken } = req.body
        if (!refreshToken) {
            logger.warn('Refresh token is required')
            return res.status(400).json({
                success: false,
                message: 'Refresh token is required'
            })
        }

        // delete the refresh token
        await RefreshToken.deleteOne({ _id: storedToken._id })

        logger.info('Logout successful')
        return res.status(200).json({
            success: true,
            message: 'Logout successful'
        })

    } catch (error) {
        logger.error('Logout error occurred', error)

        return res.status(500).json({
            success: false,
            message: 'Logout error occurred'
        })
    }
}



module.exports = {
    registerUser,
    loginUser,
    refreshToken,
    logoutUser
}