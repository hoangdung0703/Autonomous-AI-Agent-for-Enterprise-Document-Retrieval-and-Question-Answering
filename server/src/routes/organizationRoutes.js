const express = require('express');
const router = express.Router();
const organizationController = require('../controllers/organizationController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const orgMiddleware = require('../middleware/orgMiddleware');
const validate = require('../middleware/validate');
const { create } = require('../validators/organizationValidators');

// No orgMiddleware on the router level — some routes exist for users without an org
router.use(authMiddleware);

router.post('/', validate(create), organizationController.create.bind(organizationController));
router.get('/me', organizationController.getMe.bind(organizationController));
router.get('/members', adminMiddleware, orgMiddleware, organizationController.getMembers.bind(organizationController));

module.exports = router;
