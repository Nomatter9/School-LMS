const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: 465,
    secure: true,
  auth: {
    user: process.env.MAIL_USERNAME,
    pass: process.env.MAIL_PASSWORD,
  },
});

// ─── Registration Email (credentials + verify button) ─────────
exports.sendRegistrationEmail = async (email, token, password) => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

  await transporter.sendMail({
    from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM_ADDRESS}>`,
    to: email,
    subject: 'Welcome to School LMS — Verify Your Account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; background: #ffffff;">
        <h2 style="color: #6366F1; margin-bottom: 8px;">Welcome to School LMS! 🎉</h2>
        <p style="color: #555555; margin-bottom: 24px;">Your school has been registered. Save your login credentials below, then verify your email to activate your account.</p>

        <div style="background: #f4f6ff; border: 1px solid #e0e3ff; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
          <p style="margin: 0 0 12px; color: #6366F1; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: bold;">Your Login Credentials</p>
          <p style="margin: 0 0 4px; color: #555555; font-size: 13px;">Email</p>
          <p style="margin: 0 0 16px; color: #111111; font-family: monospace; font-size: 15px; background: #ffffff; padding: 10px 14px; border-radius: 8px; border: 1px solid #e0e3ff;">${email}</p>
          <p style="margin: 0 0 4px; color: #555555; font-size: 13px;">Password</p>
          <p style="margin: 0; color: #111111; font-family: monospace; font-size: 22px; font-weight: bold; background: #ffffff; padding: 10px 14px; border-radius: 8px; border: 2px solid #6366F1; letter-spacing: 4px;">${password}</p>
        </div>

        <p style="color: #d97706; font-size: 13px; margin-bottom: 24px;">⚠ Save this password — it will not be shown again.</p>

        <a href="${verificationUrl}"
           style="display: inline-block; padding: 14px 32px; background: #6366F1; color: white; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 15px; margin-bottom: 24px;">
          Verify Your Email →
        </a>

        <p style="color: #999999; font-size: 12px; margin-top: 24px; border-top: 1px solid #eeeeee; padding-top: 16px;">
          This link expires in 24 hours.<br/>
          We recommend changing your password after your first login.<br/>
          If you did not register this account, please ignore this email.
        </p>
      </div>
    `,
  });
};

// ─── Set Password Email (new users — no plain-text password) ──
exports.sendSetPasswordEmail = async (email, firstName, token) => {
  const url = `${process.env.FRONTEND_URL}/set-password?token=${token}`;

  await transporter.sendMail({
    from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM_ADDRESS}>`,
    to: email,
    subject: 'Activate Your School LMS Account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; background: #ffffff;">
        <h2 style="color: #6366F1; margin-bottom: 8px;">Welcome, ${firstName}!</h2>
        <p style="color: #555555; margin-bottom: 24px;">Your account has been created on School LMS. Click the button below to set your password and activate your account.</p>

        <a href="${url}"
           style="display: inline-block; padding: 14px 32px; background: #6366F1; color: white; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 15px; margin-bottom: 24px;">
          Set Your Password →
        </a>

        <p style="color: #d97706; font-size: 13px; margin-bottom: 24px;">⚠ This link expires in 24 hours.</p>

        <p style="color: #999999; font-size: 12px; margin-top: 24px; border-top: 1px solid #eeeeee; padding-top: 16px;">
          If you did not expect this email, please ignore it.
        </p>
      </div>
    `,
  });
};

// ─── Password Reset Email ─────────────────────────────────────
exports.sendPasswordResetEmail = async (email, token) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

  await transporter.sendMail({
    from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM_ADDRESS}>`,
    to: email,
    subject: 'Reset Your School LMS Password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; background: #ffffff;">
        <h2 style="color: #6366F1; margin-bottom: 8px;">Password Reset Request</h2>
        <p style="color: #555555; margin-bottom: 24px;">You requested a password reset. Click the button below to reset your password:</p>
        <a href="${resetUrl}"
           style="display: inline-block; padding: 14px 32px; background: #6366F1; color: white; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 15px; margin-bottom: 24px;">
          Reset Password →
        </a>
        <p style="color: #999999; font-size: 12px; margin-top: 24px; border-top: 1px solid #eeeeee; padding-top: 16px;">
          This link expires in 1 hour.<br/>
          If you did not request this, please ignore this email.
        </p>
      </div>
    `,
  });
};