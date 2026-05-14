const express = require('express');
const router = express.Router();
const conversationController = require('../controllers/conversationController');
const authMiddleware = require('../middleware/authMiddleware');
const orgMiddleware = require('../middleware/orgMiddleware');
const validate = require('../middleware/validate');
const { create, query, rename } = require('../validators/conversationValidators');
const { queryLimiter } = require('../middleware/rateLimiter');

// All conversation routes require authentication AND org membership
router.use(authMiddleware, orgMiddleware);

router.post('/', validate(create), conversationController.create.bind(conversationController));
router.get('/', conversationController.list.bind(conversationController));
router.get('/:id', conversationController.getOne.bind(conversationController));
router.patch('/:id/title', validate(rename), conversationController.rename.bind(conversationController));
router.patch('/:id/documents', conversationController.updateDocuments.bind(conversationController));
router.delete('/:id', conversationController.remove.bind(conversationController));
router.post('/:id/query', queryLimiter, validate(query), conversationController.query.bind(conversationController));

module.exports = router;
