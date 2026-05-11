const express = require('express');
const router = express.Router();
const inviteCodeController = require('../controllers/inviteCodeController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const orgMiddleware = require('../middleware/orgMiddleware');

// All routes require authentication, admin role, and organization membership
router.use(authMiddleware);
router.use(adminMiddleware);
router.use(orgMiddleware);

router.post('/', inviteCodeController.generate.bind(inviteCodeController));
router.get('/', inviteCodeController.list.bind(inviteCodeController));
router.patch('/:id/deactivate', inviteCodeController.deactivate.bind(inviteCodeController));
router.delete('/:id', inviteCodeController.remove.bind(inviteCodeController));

module.exports = router;
