const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { validationResult } = require('express-validator');
const db = require('../models');
const { sendSetPasswordEmail, sendPasswordResetEmail } = require('../utils/emailService');
const { formatSchool, formatUser } = require('../utils/formatters');
const School = db.School;
const { User } = db;
const seedGrades = require('../seeders/gradeSeeder');
const seedSubjects = require('../seeders/subjectSeeder');
const seedCurrentYear = require('../seeders/currentYearSeeder');
const seedTerms = require('../seeders/termSeeder');

const generateToken = (userId, role, schoolId) => {
  return jwt.sign(
    { id: userId, role, schoolId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

exports.registerSchool = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { schoolName, address, province, schoolPhone, schoolEmail, firstName, lastName } = req.body;

    const existingSchool = await School.findOne({ where: { email: schoolEmail } });
    if (existingSchool) {
      return res.status(409).json({ message: 'School email already registered' });
    }

    const salt = await bcrypt.genSalt(10);
    const placeholderPassword = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), salt);
    const setPasswordToken = crypto.randomBytes(32).toString('hex');

    let school, headmaster;

    await db.sequelize.transaction(async (t) => {
      school = await School.create({
        name: schoolName,
        address,
        province,
        phone: schoolPhone,
        email: schoolEmail,
        logoUrl: req.file ? `/uploads/logos/${req.file.filename}` : null,
      }, { transaction: t });

      headmaster = await User.create({
        schoolId: school.id,
        firstName,
        lastName,
        email: schoolEmail,
        password: placeholderPassword,
        phone: schoolPhone || null,
        role: 'headmaster',
        isVerified: true,
        resetPasswordToken: setPasswordToken,
        resetPasswordExpires: new Date(Date.now() + 24 * 3600000),
      }, { transaction: t });

      await User.create({
        schoolId: school.id,
        firstName: 'System',
        lastName: 'Admin',
        email: `admin.${school.id}@system.thuto.lms`,
        password: placeholderPassword,
        role: 'admin',
        isActive: true,
        isVerified: true,
      }, { transaction: t });
    });

    // Seed essential configuration (grades, subjects, year, terms)
    try {
      await seedGrades(school.id);
      await seedSubjects(school.id);
      await seedCurrentYear(school.id);
      await seedTerms(school.id);
    } catch (seederError) {
      console.error('Config seeder error (non-critical):', seederError);
    }

    try {
      await sendSetPasswordEmail(schoolEmail, firstName, setPasswordToken);
    } catch (emailError) {
      console.error('Registration email failed:', emailError);
    }

    res.status(201).json({
      message: 'School registered successfully. Check your email to set your password.',
      school: formatSchool(school),
      headmaster: formatUser(headmaster),
    });
  } catch (error) {
    console.error('Register school error:', error);
    res.status(500).json({ message: 'Registration failed' });
  }
};

exports.login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { email, password } = req.body;

    const user = await User.findOne({
      where: { email },
      include: [{ model: School, as: 'school' }],
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Your account has been deactivated' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user.id, user.role, user.schoolId);

    res.json({
      message: 'Login successful',
      user: {
        ...formatUser(user),
        school: user.school ? formatSchool(user.school) : null,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [{ model: School, as: 'school' }],
      attributes: { exclude: ['password', 'verificationToken', 'resetPasswordToken', 'resetPasswordExpires'] },
    });

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({
      user: {
        ...formatUser(user),
        school: user.school ? formatSchool(user.school) : null,
      },
    });
  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({ message: 'Failed to get profile' });
  }
};

exports.logout = (req, res) => {
  res.json({ message: 'Logout successful' });
};

exports.changePassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;

    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) return res.status(401).json({ message: 'Current password is incorrect' });

    const salt = await bcrypt.genSalt(10);
    await user.update({ password: await bcrypt.hash(newPassword, salt) });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Failed to change password' });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.json({ message: 'If an account exists, a reset link will be sent' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    await user.update({
      resetPasswordToken: resetToken,
      resetPasswordExpires: new Date(Date.now() + 3600000),
    });

    try {
      await sendPasswordResetEmail(user.email, resetToken);
    } catch (emailError) {
      console.error('Reset email failed:', emailError);
    }

    res.json({ message: 'If an account exists, a reset link will be sent' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Failed to process request' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }

    const user = await User.findOne({ where: { resetPasswordToken: token } });
    if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

    if (new Date() > user.resetPasswordExpires) {
      return res.status(400).json({ message: 'Reset token has expired' });
    }

    const salt = await bcrypt.genSalt(10);
    await user.update({
      password: await bcrypt.hash(newPassword, salt),
      resetPasswordToken: null,
      resetPasswordExpires: null,
    });

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Failed to reset password' });
  }
};

// New users (staff, parents, headmaster) click this link from their activation email
exports.setPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ message: 'Token and password are required' });
    }

    const user = await User.findOne({ where: { resetPasswordToken: token } });
    if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

    if (new Date() > user.resetPasswordExpires) {
      return res.status(400).json({ message: 'Activation link has expired' });
    }

    const salt = await bcrypt.genSalt(10);
    await user.update({
      password: await bcrypt.hash(password, salt),
      isVerified: true,
      resetPasswordToken: null,
      resetPasswordExpires: null,
    });

    res.json({ message: 'Password set successfully. You can now log in.' });
  } catch (error) {
    console.error('Set password error:', error);
    res.status(500).json({ message: 'Failed to set password' });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ message: 'Verification token is required' });

    const user = await User.findOne({ where: { verificationToken: token } });
    if (!user) return res.status(400).json({ message: 'Invalid or expired verification token' });

    await user.update({ isVerified: true, verificationToken: null });

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ message: 'Email verification failed' });
  }
};

exports.resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: 'No account found with this email' });

    if (user.isVerified) {
      return res.status(400).json({ message: 'This account is already verified.' });
    }

    const setPasswordToken = crypto.randomBytes(32).toString('hex');
    await user.update({
      resetPasswordToken: setPasswordToken,
      resetPasswordExpires: new Date(Date.now() + 24 * 3600000),
    });

    await sendSetPasswordEmail(email, user.firstName, setPasswordToken);

    res.json({ message: 'Activation email resent successfully.' });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ message: 'Failed to resend activation email' });
  }
};

exports.updateMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { firstName, lastName, phone } = req.body;
    const updates = {};
    if (firstName !== undefined) updates.firstName = firstName;
    if (lastName !== undefined) updates.lastName = lastName;
    if (phone !== undefined) updates.phone = phone || null;

    await user.update(updates);
    res.json(formatUser(user));
  } catch (err) {
    console.error('Update me error:', err);
    res.status(500).json({ message: 'Failed to update profile' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ message: 'Validation failed', errors: errors.array() });
    }

    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const school = await School.findByPk(user.schoolId);
    if (!school) return res.status(404).json({ message: 'School not found' });

    const { firstName, lastName, phone, schoolName, address, province, schoolPhone } = req.body;

    const userUpdate = {};
    if (firstName !== undefined) userUpdate.firstName = firstName;
    if (lastName !== undefined) userUpdate.lastName = lastName;
    if (phone !== undefined) userUpdate.phone = phone || null;

    const schoolUpdate = {};
    if (schoolName !== undefined) schoolUpdate.name = schoolName;
    if (address !== undefined) schoolUpdate.address = address;
    if (province !== undefined) schoolUpdate.province = province;
    if (schoolPhone !== undefined) schoolUpdate.phone = schoolPhone;

    if (req.file) {
      if (school.logoUrl) {
        const oldPath = path.join(__dirname, '../', school.logoUrl);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      schoolUpdate.logoUrl = `/uploads/logos/${req.file.filename}`;
    }

    await user.update(userUpdate);
    await school.update(schoolUpdate);

    const updated = await User.findByPk(req.user.id, {
      include: [{ model: School, as: 'school' }],
      attributes: { exclude: ['password', 'verificationToken', 'resetPasswordToken', 'resetPasswordExpires'] },
    });

    res.json({
      message: 'Profile updated successfully',
      user: {
        ...formatUser(updated),
        school: updated.school ? formatSchool(updated.school) : null,
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      where: { schoolId: req.user.schoolId },
      attributes: { exclude: ['password', 'verificationToken', 'resetPasswordToken', 'resetPasswordExpires'] },
      order: [['firstName', 'ASC']],
    });
    res.json({ users: users.map(formatUser) });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Failed to get users' });
  }
};

exports.updateMyAvatar = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.avatarUrl) {
      const oldPath = path.join(__dirname, '../', user.avatarUrl);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    await user.update({ avatarUrl });
    res.json({ avatarUrl });
  } catch (err) {
    console.error('Update avatar error:', err);
    res.status(500).json({ message: 'Failed to update avatar' });
  }
};
  