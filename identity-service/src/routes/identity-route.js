const { Router } = require('express');
const { registerUser } = require('../controllers/identity-controller');

const router = Router();


router.post('/register', registerUser);



module.exports = router;