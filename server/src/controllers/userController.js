const User = require('../models/User');
const authService = require('../services/AuthService');

const MAX_AVATAR_BYTES = 2 * 1024 * 1024; // 2MB

class UserController {
  async getProfile(req, res, next) {
    try {
      const user = await User.findById(req.user.id)
        .populate('organizationId', 'name')
        .select('-password');

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.status(200).json({
        name: user.name,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId?._id || null,
        organizationName: user.organizationId?.name || null,
        avatar: user.avatar,
        createdAt: user.createdAt,
      });
    } catch (err) {
      next(err);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const { name, avatar } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Name cannot be empty' });
      }

      // Validate avatar size — strip data URL prefix to measure raw bytes
      if (avatar) {
        const base64Data = avatar.includes(',') ? avatar.split(',')[1] : avatar;
        const bytes = Math.ceil((base64Data.length * 3) / 4);
        if (bytes > MAX_AVATAR_BYTES) {
          return res.status(400).json({ error: 'Avatar exceeds 2MB limit' });
        }
      }

      const updates = { name: name.trim() };
      if (avatar !== undefined) updates.avatar = avatar;

      const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true })
        .populate('organizationId', 'name');

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const orgName = user.organizationId?.name || null;
      const token = authService.generateToken(user, orgName);

      res.status(200).json({ token, user: { name: user.name, email: user.email, avatar: user.avatar, role: user.role } });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new UserController();
