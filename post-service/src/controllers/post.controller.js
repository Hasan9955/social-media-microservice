const logger = require('../utils/logger')


const createPost = async (req, res) => {
    try {
        const { user, content, mediaIds } = req.body;

        const newPost = new Post({
            user,
            content,
            mediaIds
        });

        const savedPost = await newPost.save();
        logger.info('Post created successfully:', savedPost);
        res.status(201).json({
            success: true,
            message: 'Post created successfully',
            data: savedPost
        });
    } catch (error) {
        logger.error('Error creating post:', error);
        res.status(500).json({
            success: false,
            message: 'Error in post controller'
        });
    }

}

const getAllPost = async (req, res) => {
    try {

    } catch (error) {
        logger.error('Error creating post:', error);
        res.status(500).json({
            success: false,
            message: 'Error in post controller'
        });
    }

}

const getPostById = async (req, res) => {
    try {

    } catch (error) {
        logger.error('Error creating post:', error);
        res.status(500).json({
            success: false,
            message: 'Error in post controller'
        });
    }

}

const updatePost = async (req, res) => {
    try {

    } catch (error) {
        logger.error('Error creating post:', error);
        res.status(500).json({
            success: false,
            message: 'Error in post controller'
        });
    }

}

const deletePost = async (req, res) => {
    try {

    } catch (error) {
        logger.error('Error creating post:', error);
        res.status(500).json({
            success: false,
            message: 'Error in post controller'
        });
    }

}


module.exports = {
    createPost,
    getAllPost,
    getPostById,
    updatePost,
    deletePost
};