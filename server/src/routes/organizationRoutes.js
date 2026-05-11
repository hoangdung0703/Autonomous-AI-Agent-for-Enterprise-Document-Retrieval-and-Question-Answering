const express = require('express');
const router = express.Router();
const organizationController = require('../controllers/organizationController');
const authMiddleware = require('../middleware/authMiddleware');

// No orgMiddleware here — these routes exist specifically for users without an org
router.use(authMiddleware);

router.post('/', organizationController.create.bind(organizationController));
router.get('/me', organizationController.getMe.bind(organizationController));

module.exports = router;
