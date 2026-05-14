const { Resend } = require('resend');
const env = require('../config/env');
const logger = require('../utils/logger');

class EmailService {
  constructor() {
    this.resend = new Resend(env.RESEND_API_KEY);
  }

  async sendPasswordResetEmail(toEmail, resetLink) {
    try {
      await this.resend.emails.send({
        from: 'Archon <onboarding@resend.dev>',
        to: toEmail,
        subject: 'Reset your Archon password',
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <h2 style="color: #6366f1;">Reset your password</h2>
            <p>You requested a password reset for your Archon account.</p>
            <a href="${resetLink}" style="
              display: inline-block;
              background: #6366f1;
              color: white;
              padding: 12px 24px;
              border-radius: 8px;
              text-decoration: none;
              font-weight: 600;
              margin: 16px 0;
            ">Reset Password</a>
            <p style="color: #666; font-size: 14px;">This link expires in 1 hour.</p>
            <p style="color: #666; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
          </div>
        `
      });
      logger.info(`[EmailService] Password reset email sent to ${toEmail}`);
    } catch (err) {
      // Log but do not rethrow — email failure must not block the API response
      logger.error(`[EmailService] Failed to send reset email to ${toEmail}: ${err.message}`);
    }
  }
}

module.exports = new EmailService();
