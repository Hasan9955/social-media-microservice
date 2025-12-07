

const joi = require('joi')


const validateRegistration = (data) => {
    const schema = joi.object({
        username: joi.string().min(3).max(50).required(),
        email: joi.string().required().email(),
        password: joi.string().min(6).required()
    })

    return schema.validate(data)
}


module.exports = { validateRegistration }