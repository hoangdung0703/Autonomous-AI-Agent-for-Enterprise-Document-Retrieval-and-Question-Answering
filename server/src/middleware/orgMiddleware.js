const User = require('../models/User');

const orgMiddleware = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user?.organizationId) {
      return res.status(403).json({ error: 'You must join an organization first.' });
    }
    req.organizationId = user.organizationId;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = orgMiddleware;
