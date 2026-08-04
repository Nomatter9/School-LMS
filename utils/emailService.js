const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM_ADDRESS}>`;

exports.sendRegistrationEmail = async (email, token, password) => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Welcome to School LMS — Verify Your Account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px;">
        <h2 style="color: #6366F1;">Welcome to School LMS! 🎉</h2>
        <p>Your school has been registered. Save your login credentials below.</p>
        <div style="background: #f4f6ff; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Password:</strong> <span style="font-size: 22px; font-family: monospace; letter-spacing: 4px;">${password}</span></p>
        </div>
        <p style="color: #d97706;">⚠ Save this password — it will not be shown again.</p>
        <a href="${verificationUrl}" style="display: inline-block; padding: 14px 32px; background: #6366F1; color: white; text-decoration: none; border-radius: 10px; font-weight: bold;">
          Verify Your Email →
        </a>
        <p style="color: #999; font-size: 12px; margin-top: 24px;">This link expires in 24 hours.</p>
      </div>
    `,
  });
};

exports.sendSetPasswordEmail = async (email, firstName, token) => {
  const url = `${process.env.FRONTEND_URL}/set-password?token=${token}`;
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Activate Your School LMS Account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px;">
        <h2 style="color: #6366F1;">Welcome, ${firstName}!</h2>
        <p>Your account has been created. Click below to set your password.</p>
        <a href="${url}" style="display: inline-block; padding: 14px 32px; background: #6366F1; color: white; text-decoration: none; border-radius: 10px; font-weight: bold;">
          Set Your Password →
        </a>
        <p style="color: #d97706; font-size: 13px;">⚠ This link expires in 24 hours.</p>
      </div>
    `,
  });
};

exports.sendPasswordResetEmail = async (email, token) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Reset Your School LMS Password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px;">
        <h2 style="color: #6366F1;">Password Reset Request</h2>
        <p>Click the button below to reset your password:</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 14px 32px; background: #6366F1; color: white; text-decoration: none; border-radius: 10px; font-weight: bold;">
          Reset Password →
        </a>
        <p style="color: #999; font-size: 12px; margin-top: 24px;">This link expires in 1 hour. If you did not request this, ignore this email.</p>
      </div>
    `,
  });
};