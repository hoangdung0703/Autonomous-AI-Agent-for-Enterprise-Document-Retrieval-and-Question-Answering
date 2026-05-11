const express = require('express');
const router = express.Router();
const joinRequestController = require('../controllers/joinRequestController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const orgMiddleware = require('../middleware/orgMiddleware');
const validate = require('../middleware/validate');
const { submit } = require('../validators/joinRequestValidators');

// Route-level middleware — first two routes have NO orgMiddleware (user has no org yet)

// User routes — auth only
router.post('/', authMiddleware, validate(submit), joinRequestController.submit.bind(joinRequestController));
router.get('/me', authMiddleware, joinRequestController.getMe.bind(joinRequestController));

// Admin routes — auth + admin + org
router.get('/', authMiddleware, adminMiddleware, orgMiddleware, joinRequestController.list.bind(joinRequestController));
router.patch('/:id/approve', authMiddleware, adminMiddleware, orgMiddleware, joinRequestController.approve.bind(joinRequestController));
router.patch('/:id/reject', authMiddleware, adminMiddleware, orgMiddleware, joinRequestController.reject.bind(joinRequestController));

module.exports = router;
