const express = require('express');
const documentController = require('../controllers/documentController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const orgMiddleware = require('../middleware/orgMiddleware');
const uploadMiddleware = require('../middleware/uploadMiddleware');
const validate = require('../middleware/validate');
const { upload } = require('../validators/documentValidators');

const router = express.Router();

// GET / — any org member can read documents (for NewConversationModal document picker)
router.get('/', authMiddleware, orgMiddleware, documentController.getAll);

// POST /upload — admin + org member only
router.post('/upload', authMiddleware, adminMiddleware, orgMiddleware, uploadMiddleware.single('file'), validate(upload), documentController.upload);

// DELETE /:id — admin + org member only
router.delete('/:id', authMiddleware, adminMiddleware, orgMiddleware, documentController.deleteDocument);

// POST /:id/reprocess — admin + org member only
router.post('/:id/reprocess', authMiddleware, adminMiddleware, orgMiddleware, documentController.reprocess);

module.exports = router;
