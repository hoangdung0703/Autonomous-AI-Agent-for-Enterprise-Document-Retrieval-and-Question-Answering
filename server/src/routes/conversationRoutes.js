const express = require('express');
const router = express.Router();
const conversationController = require('../controllers/conversationController');
const authMiddleware = require('../middleware/authMiddleware');
const orgMiddleware = require('../middleware/orgMiddleware');

// All conversation routes require authentication AND org membership
router.use(authMiddleware, orgMiddleware);

router.post('/', conversationController.create.bind(conversationController));
router.get('/', conversationController.list.bind(conversationController));
router.get('/:id', conversationController.getOne.bind(conversationController));
router.patch('/:id/title', conversationController.rename.bind(conversationController));
router.delete('/:id', conversationController.remove.bind(conversationController));
router.post('/:id/query', conversationController.query.bind(conversationController));

module.exports = router;
