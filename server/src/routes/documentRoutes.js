const express = require('express');
const documentController = require('../controllers/documentController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const uploadMiddleware = require('../middleware/uploadMiddleware');

const router = express.Router();

// All document routes are admin only
router.use(authMiddleware, adminMiddleware);

router.post('/upload', uploadMiddleware.single('file'), documentController.upload);
router.get('/', documentController.getAll);
router.delete('/:id', documentController.deleteDocument);

module.exports = router;
