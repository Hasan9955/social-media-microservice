const { Router } = require('express');
const { registerUser, loginUser, logoutUser, refreshToken } = require('../controllers/identity-controller');

const router = Router();


router.post('/register', registerUser);

router.post('/login', loginUser);

router.post('/refresh-token', refreshToken);

router.post('/logout', logoutUser);


module.exports = router;