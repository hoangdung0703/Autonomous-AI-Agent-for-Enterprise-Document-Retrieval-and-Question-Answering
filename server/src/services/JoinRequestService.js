const JoinRequest = require('../models/JoinRequest');
const Organization = require('../models/Organization');
const User = require('../models/User');
const InviteCode = require('../models/InviteCode');

class JoinRequestService {

  async submitRequest({ userId, inviteCode }) {
    if (!inviteCode || !inviteCode.trim()) {
      const err = new Error('Invite code is required');
      err.statusCode = 400;
      throw err;
    }

    // 1. Find invite code
    const invite = await InviteCode.findOne({ code: inviteCode.trim().toUpperCase() });
    if (!invite) {
      const err = new Error('Invite code not found');
      err.statusCode = 404;
      throw err;
    }

    // 2. Validate
    const now = new Date();
    if (!invite.isActive || invite.expiresAt < now || invite.usageCount >= invite.maxUsage) {
      const err = new Error('Invite code has expired or reached its usage limit');
      err.statusCode = 400;
      throw err;
    }

    // 3. Check user has no org
    const user = await User.findById(userId);
    if (user.organizationId) {
      const err = new Error('You are already in an organization');
      err.statusCode = 400;
      throw err;
    }

    // 4. Prevent duplicate pending requests
    const existingPending = await JoinRequest.findOne({ userId, status: 'pending' });
    if (existingPending) {
      const err = new Error('You already have a pending request');
      err.statusCode = 400;
      throw err;
    }

    // 5. Increment usage
    invite.usageCount += 1;
    await invite.save();

    // 6. Create request
    const request = new JoinRequest({
      userId,
      organizationId: invite.organizationId,
      status: 'pending',
    });
    await request.save();

    const organization = await Organization.findById(invite.organizationId, 'name');

    return {
      request,
      organization: { name: organization.name },
    };
  }

  async getMyRequest(userId) {
    return JoinRequest.findOne({ userId })
      .sort({ createdAt: -1 })
      .populate('organizationId', 'name code');
  }

  async listPendingRequests(organizationId) {
    return JoinRequest.find({ organizationId, status: 'pending' })
      .populate('userId', 'name email createdAt')
      .sort({ createdAt: 1 }); // Oldest first
  }

  async approveRequest({ requestId, adminId, organizationId }) {
    const request = await JoinRequest.findOne({
      _id: requestId,
      organizationId,
      status: 'pending',
    });

    if (!request) {
      const err = new Error('Pending request not found');
      err.statusCode = 404;
      throw err;
    }

    // Update request status
    request.status = 'approved';
    request.reviewedAt = Date.now();
    request.reviewedBy = adminId;
    await request.save();

    // Grant org membership to the user
    await User.findByIdAndUpdate(request.userId, {
      organizationId: request.organizationId,
      role: 'user',
    });

    return { request };
  }

  async rejectRequest({ requestId, adminId, organizationId }) {
    const request = await JoinRequest.findOne({
      _id: requestId,
      organizationId,
      status: 'pending',
    });

    if (!request) {
      const err = new Error('Pending request not found');
      err.statusCode = 404;
      throw err;
    }

    request.status = 'rejected';
    request.reviewedAt = Date.now();
    request.reviewedBy = adminId;
    await request.save();

    return { request };
  }
}

module.exports = new JoinRequestService();
