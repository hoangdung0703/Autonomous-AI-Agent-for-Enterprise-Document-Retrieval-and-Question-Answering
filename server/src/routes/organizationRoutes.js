const express = require('express');
const router = express.Router();
const organizationController = require('../controllers/organizationController');
const authMiddleware = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { create } = require('../validators/organizationValidators');

// No orgMiddleware here — these routes exist specifically for users without an org
router.use(authMiddleware);

router.post('/', validate(create), organizationController.create.bind(organizationController));
router.get('/me', organizationController.getMe.bind(organizationController));

module.exports = router;
