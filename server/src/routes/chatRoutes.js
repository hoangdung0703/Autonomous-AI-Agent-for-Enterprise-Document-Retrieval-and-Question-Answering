const express = require('express');
const chatController = require('../controllers/chatController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Any authenticated user can chat
router.post('/query', authMiddleware, chatController.query);

module.exports = router;
