const crypto = require('crypto');
const InviteCode = require('../models/InviteCode');

class InviteCodeService {
  async generateCode({ adminId, organizationId, expiryHours, maxUsage }) {
    const validExpiry = [1, 6, 24, 168, 720];
    if (!validExpiry.includes(Number(expiryHours))) {
      const err = new Error('Invalid expiry time');
      err.statusCode = 400;
      throw err;
    }

    if (!maxUsage || maxUsage < 1 || maxUsage > 100) {
      const err = new Error('Max usage must be between 1 and 100');
      err.statusCode = 400;
      throw err;
    }

    let code;
    let isUnique = false;
    while (!isUnique) {
      code = crypto.randomBytes(3).toString('hex').toUpperCase();
      const existing = await InviteCode.findOne({ code });
      if (!existing) isUnique = true;
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + Number(expiryHours));

    const inviteCode = new InviteCode({
      code,
      organizationId,
      createdBy: adminId,
      expiresAt,
      maxUsage: Number(maxUsage)
    });

    await inviteCode.save();
    return inviteCode;
  }

  async listCodes(organizationId) {
    const codes = await InviteCode.find({ organizationId })
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name');

    const now = new Date();
    return codes.map(c => {
      const codeObj = c.toObject();
      const isExpired = codeObj.expiresAt < now;
      const isExhausted = codeObj.usageCount >= codeObj.maxUsage;
      return {
        ...codeObj,
        isExpired,
        isExhausted,
        isValid: codeObj.isActive && !isExpired && !isExhausted
      };
    });
  }

  async deactivateCode({ codeId, organizationId }) {
    const code = await InviteCode.findOne({ _id: codeId, organizationId });
    if (!code) {
      const err = new Error('Invite code not found');
      err.statusCode = 404;
      throw err;
    }

    code.isActive = false;
    await code.save();
    return code;
  }

  async deleteCode({ codeId, organizationId }) {
    const code = await InviteCode.findOneAndDelete({ _id: codeId, organizationId });
    if (!code) {
      const err = new Error('Invite code not found');
      err.statusCode = 404;
      throw err;
    }
    return code;
  }
}

module.exports = new InviteCodeService();
