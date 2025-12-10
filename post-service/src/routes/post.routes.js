const { authenticateRequest } = require('../middleware/auth.middleware');
const express = require('express');
const { createPost, getPostById } = require('../controllers/post.controller');

const router = express.Router();

router.post('/create-post', 
    // authenticateRequest(),
    createPost);

router.get('/:id', getPostById);

module.exports = router;