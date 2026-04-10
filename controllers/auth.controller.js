const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { validationResult } = require('express-validator');
const db = require('../models');
const { sendRegistrationEmail, sendPasswordResetEmail } = require('../utils/emailService');
const School = db.School;
const {User, Student,Class} = db;
const seedGrades = require('../seeders/gradeSeeder');      
const seedSubjects = require('../seeders/subjectSeeder');
const seedStaff = require('../seeders/StaffSeeder');
const seedCurrentYear = require('../seeders/currentYearSeeder'); 
const seedTerms = require('../seeders/termSeeder');
const seedStudents = require('../seeders/studentSeeder');

// ─── Generate Token ───────────────────────────────────────────
const generateToken = (userId, role, schoolId) => {
  return jwt.sign(
    { id: userId, role, schoolId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// ─── Format Responses ─────────────────────────────────────────
const formatSchool = (school) => ({
  id: school.id,
  name: school.name,
  address: school.address,
  province: school.province,
  phone: school.phone,
  email: school.email,
  logoUrl: school.logoUrl,
  createdAt: school.createdAt,
});

const formatUser = (user) => ({
  id: user.id,
    avatarUrl: user.avatarUrl || null,   
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  phone: user.phone,
  role: user.role,
  schoolId: user.schoolId,
  isActive: user.isActive,
  isVerified: user.isVerified,
  createdAt: user.createdAt,
});

/**
 * Register School
 * POST /api/auth/school/register
 */
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

    const generatedPassword = crypto.randomBytes(6).toString('hex');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(generatedPassword, salt);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // 1. Create School
    const school = await School.create({
      name: schoolName,
      address,
      province,
      phone: schoolPhone,
      email: schoolEmail,
      logoUrl: req.file ? `/uploads/logos/${req.file.filename}` : null,
    });

    // 2. Create Headmaster 
    const headmaster = await User.create({
      schoolId: school.id,
      firstName,
      lastName,
      email: schoolEmail,
      password: hashedPassword,
      phone: schoolPhone || null,
      role: 'headmaster',
      isVerified:true,
      verificationToken,
    });

    // 3. Create System Admin
    await User.create({
      schoolId: school.id,
      firstName: 'System',
      lastName: 'Admin',
      email: `admin.${school.id}@system.thuto.lms`,
      password: hashedPassword,
      role: 'admin',
      isActive: true,
      isVerified: true,
    });

    // 4. Run Seeders
    await seedGrades(school.id);
    await seedSubjects(school.id);
    await seedStaff(school.id);
    await seedCurrentYear(school.id);
    await seedTerms(school.id); 
    await seedStudents(school.id);

    // 5. Send Email
    try {
      await sendRegistrationEmail(schoolEmail, verificationToken, generatedPassword);
    } catch (emailError) {
      console.error('Registration email failed:', emailError);
    }

    // 6. Final Response (Now using headmaster and school)
    res.status(201).json({
      message: 'School registered successfully. Please verify your email.',
      school: formatSchool(school),
      headmaster: formatUser(headmaster) // This uses the variable so the warning disappears
    });
    
  } catch (error) {
    console.error('Register school error:', error);
    res.status(500).json({ message: 'Registration failed' });
  }
};

/**
 * Login
 * POST /api/auth/login
 */
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

/**
 * Get Me
 * GET /api/auth/me
 */
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

/**
 * Logout
 * POST /api/auth/logout
 */
exports.logout = (req, res) => {
  res.json({ message: 'Logout successful' });
};

/**
 * Change Password
 * PUT /api/auth/change-password
 */
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

/**
 * Forgot Password
 * POST /api/auth/forgot-password
 */
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

/**
 * Reset Password
 * POST /api/auth/reset-password
 */
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

/**
 * Update Profile
 * PUT /api/auth/update-profile
 */
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

/**
 * Verify Email
 * GET /api/auth/verify-email?token=xxxxx
 */
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ message: 'Verification token is required' });

    const user = await User.findOne({ where: { verificationToken: token } });
    if (!user) return res.status(400).json({ message: 'Invalid or expired verification token' });

    await user.update({
      isVerified: true,
      verificationToken: null,
    });

    await School.update({ isVerified: true }, { where: { id: user.schoolId } });

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ message: 'Email verification failed' });
  }
};
 // Resend Verification Email
 // POST /api/auth/resend-verification
exports.resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: 'No account found with this email' });

    if (user.isVerified) {
      return res.status(400).json({ message: 'This account is already verified. Please login or use forgot password.' });
    }

    // Generate new password and token on resend
    const newPassword = crypto.randomBytes(6).toString('hex');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    await user.update({ verificationToken, password: hashedPassword });

    await sendRegistrationEmail(email, verificationToken, newPassword);

    res.json({ message: 'Verification email resent successfully.' });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ message: 'Failed to resend verification email' });
  }
};
 //Get My School
 //GET /api/auth/school/me

exports.getMySchool = async (req, res) => {
  try {
    const school = await School.findOne({ where: { id: req.user.schoolId } });
    if (!school) return res.status(404).json({ message: 'School not found' });
    res.json(formatSchool(school));
  } catch (err) {
    console.error('Get school error:', err);
    res.status(500).json({ message: 'Failed to get school' });
  }
};

/**
 * Update My School
 * PUT /api/auth/school/me
 */
exports.updateMySchool = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ message: 'Validation failed', errors: errors.array() });
    }

    const school = await School.findOne({ where: { id: req.user.schoolId } });
    if (!school) return res.status(404).json({ message: 'School not found' });

    const { name, address, province, phone, email } = req.body;

    if (email && email !== school.email) {
      const existing = await School.findOne({ where: { email } });
      if (existing) return res.status(409).json({ message: 'Email already in use by another school' });
    }

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (address !== undefined) updates.address = address;
    if (province !== undefined) updates.province = province;
    if (phone !== undefined) updates.phone = phone;
    if (email !== undefined) updates.email = email;

    if (req.file) {
      // Delete old logo
      if (school.logoUrl) {
        const oldPath = path.join(__dirname, '../', school.logoUrl);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      updates.logoUrl = `/uploads/logos/${req.file.filename}`;
    }

    await school.update(updates);

    //  Reload from DB to get fresh data including new logoUrl
    await school.reload();

    res.json(formatSchool(school));
  } catch (err) {
    console.error('Update school error:', err);
    res.status(500).json({ message: 'Failed to update school' });
  }
};
// GET /api/auth/staff
exports.getStaff = async (req, res) => {
  try {
    const staff = await User.findAll({
      where: { schoolId: req.user.schoolId },
      attributes: { exclude: ['password', 'verificationToken', 'resetPasswordToken', 'resetPasswordExpires'] },
      order: [['firstName', 'ASC']],
    });
    res.json(staff);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch staff' });
  }
};

// POST /api/auth/staff
exports.createStaff = async (req, res) => {
  try {
    const { firstName, lastName, email, classId, phone, role } = req.body;

    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(409).json({ message: 'Email already in use' });
if (classId) {
  const classExists = await Class.findOne({
    where: { id: classId, schoolId: req.user.schoolId }
  });

  if (!classExists) {
    return res.status(404).json({ message: 'Class not found' });
  }
}
    const generatedPassword = crypto.randomBytes(6).toString('hex');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(generatedPassword, salt);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const user = await User.create({
      schoolId: req.user.schoolId,
      firstName,
      lastName,
      email,
      classId: classId || null,
      phone: phone || null,
      role: role || 'teacher',
      password: hashedPassword,
      isVerified: false,
      verificationToken,
    });

    try {
      await sendRegistrationEmail(email, verificationToken, generatedPassword);
    } catch (emailError) {
      console.error('Staff registration email failed:', emailError);
    }

    res.status(201).json(formatUser(user));
  } catch (err) {
    console.error('Create staff error:', err);
    res.status(500).json({ message: 'Failed to create staff member' });
  }
};

// PUT /api/auth/staff/:id
exports.updateStaff = async (req, res) => {
  try {
    const { firstName, lastName, phone, role, isActive } = req.body;

    const user = await User.findOne({ where: { id: req.params.id, schoolId: req.user.schoolId } });
    if (!user) return res.status(404).json({ message: 'Staff member not found' });

    const updates = {};
    if (firstName !== undefined) updates.firstName = firstName;
    if (lastName !== undefined) updates.lastName = lastName;
    if (phone !== undefined) updates.phone = phone || null;
    if (role !== undefined) updates.role = role;
    if (isActive !== undefined) updates.isActive = isActive;

    await user.update(updates);
    res.json(formatUser(user));
  } catch (err) {
    console.error('Update staff error:', err);
    res.status(500).json({ message: 'Failed to update staff member' });
  }
};

// DELETE /api/auth/staff/:id
exports.deleteStaff = async (req, res) => {
  try {
    const user = await User.findOne({ where: { id: req.params.id, schoolId: req.user.schoolId } });
    if (!user) return res.status(404).json({ message: 'Staff member not found' });

    // Prevent deleting yourself
    if (user.id === req.user.id) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }

    await user.destroy();
    res.json({ message: 'Staff member removed' });
  } catch (err) {
    console.error('Delete staff error:', err);
    res.status(500).json({ message: 'Failed to delete staff member' });
  }
};
// GET /api/auth/users
exports.getUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      where: { schoolId: req.user.schoolId },
      attributes: { exclude: ['password', 'verificationToken', 'resetPasswordToken', 'resetPasswordExpires'] },
      order: [['firstName', 'ASC']],
    });
    res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Failed to get users' });
  }
};
// GET /api/auth/parents
exports.getParents = async (req, res) => {
  try {
    const parents = await User.findAll({
      where: { schoolId: req.user.schoolId, role: 'parent' },
      attributes: { exclude: ['password', 'verificationToken', 'resetPasswordToken', 'resetPasswordExpires'] },
      include: [
        {
          model: db.Student,
          as: 'children',
          include: [
            {
              model: db.User,
              as: 'user',
              attributes: ['id', 'firstName', 'lastName'],
            },
          ],
        },
      ],
      order: [['firstName', 'ASC']],
    });
    res.json(parents);
  } catch (err) {
    console.error('Get parents error:', err);
    res.status(500).json({ message: 'Failed to fetch parents' });
  }
};

// POST /api/auth/parents
exports.createParent = async (req, res) => {
  try {
    const { firstName, lastName, email, phone } = req.body;

    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(409).json({ message: 'Email already in use' });

    const generatedPassword = crypto.randomBytes(6).toString('hex');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(generatedPassword, salt);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const parent = await User.create({
      schoolId: req.user.schoolId,
      firstName,
      lastName,
      email,
      phone: phone || null,
      role: 'parent',
      password: hashedPassword,
      isVerified: false,
      verificationToken,
    });

    try {
      await sendRegistrationEmail(email, verificationToken, generatedPassword);
    } catch (emailError) {
      console.error('Parent registration email failed:', emailError);
    }

    res.status(201).json(formatUser(parent));
  } catch (err) {
    console.error('Create parent error:', err);
    res.status(500).json({ message: 'Failed to create parent' });
  }
};

// PUT /api/auth/parents/:id
exports.updateParent = async (req, res) => {
  try {
    const parent = await User.findOne({
      where: { id: req.params.id, schoolId: req.user.schoolId, role: 'parent' },
    });
    if (!parent) return res.status(404).json({ message: 'Parent not found' });

    const { firstName, lastName, phone, isActive } = req.body;
    const updates = {};
    if (firstName !== undefined) updates.firstName = firstName;
    if (lastName !== undefined) updates.lastName = lastName;
    if (phone !== undefined) updates.phone = phone || null;
    if (isActive !== undefined) updates.isActive = isActive;

    await parent.update(updates);
    res.json(formatUser(parent));
  } catch (err) {
    console.error('Update parent error:', err);
    res.status(500).json({ message: 'Failed to update parent' });
  }
};

// DELETE /api/auth/parents/:id
exports.deleteParent = async (req, res) => {
  try {
    const parent = await User.findOne({
      where: { id: req.params.id, schoolId: req.user.schoolId, role: 'parent' },
    });
    if (!parent) return res.status(404).json({ message: 'Parent not found' });
    await parent.destroy();
    res.json({ message: 'Parent removed successfully' });
  } catch (err) {
    console.error('Delete parent error:', err);
    res.status(500).json({ message: 'Failed to delete parent' });
  }
};
exports.updateAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { id } = req.params;
    let user;

    if (req.originalUrl.includes('/students/')) {
      const student = await Student.findOne({
        where: { id},
      });

      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }

      user = await User.findOne({
        where: { id: student.userId, schoolId: req.user.schoolId },
      });
    } else {
      // staff & parents (already user IDs)
      user = await User.findOne({
        where: { id, schoolId: req.user.schoolId },
      });
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    //  Delete old avatar
    if (user.avatarUrl) {
      const oldPath = path.join(__dirname, '../', user.avatarUrl);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    //  Save new avatar
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    await user.update({ avatarUrl });

    res.json({ avatarUrl });

  } catch (err) {
    console.error('Update avatar error:', err);
    res.status(500).json({ message: 'Failed to update avatar' });
  }
};