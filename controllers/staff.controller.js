const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const db = require('../models');
const { sendSetPasswordEmail } = require('../utils/emailService');
const { formatUser } = require('../utils/formatters');
const { User, Student, Class } = db;

exports.getStaff = async (req, res) => {
  try {
    const staff = await User.findAll({
      where: {
        schoolId: req.user.schoolId,
        role: ['teacher', 'headmaster', 'admin'],
      },
      attributes: { exclude: ['password', 'verificationToken', 'resetPasswordToken', 'resetPasswordExpires'] },
      order: [['firstName', 'ASC']],
    });
    res.json(staff.map(formatUser));
  } catch (err) {
    console.error('Get staff error:', err);
    res.status(500).json({ message: 'Failed to fetch staff' });
  }
};

exports.createStaff = async (req, res) => {
  try {
    const { firstName, lastName, email, classId, phone, role } = req.body;

    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(409).json({ message: 'Email already in use' });

    if (classId) {
      const classExists = await Class.findOne({ where: { id: classId, schoolId: req.user.schoolId } });
      if (!classExists) return res.status(404).json({ message: 'Class not found' });
    }

    const salt = await bcrypt.genSalt(10);
    const placeholderPassword = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), salt);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const setPasswordToken = crypto.randomBytes(32).toString('hex');

    const user = await User.create({
      schoolId: req.user.schoolId,
      firstName,
      lastName,
      email,
      classId: classId || null,
      phone: phone || null,
      role: role || 'teacher',
      password: placeholderPassword,
      isVerified: false,
      verificationToken,
      resetPasswordToken: setPasswordToken,
      resetPasswordExpires: new Date(Date.now() + 24 * 3600000),
    });

    try {
      await sendSetPasswordEmail(email, firstName, setPasswordToken);
    } catch (emailError) {
      console.error('Staff activation email failed:', emailError);
    }

    res.status(201).json(formatUser(user));
  } catch (err) {
    console.error('Create staff error:', err);
    res.status(500).json({ message: 'Failed to create staff member' });
  }
};

exports.updateStaff = async (req, res) => {
  try {
    const { firstName, lastName, phone, role, classId } = req.body;

    const user = await User.findOne({
      where: { id: req.params.id, schoolId: req.user.schoolId },
    });
    if (!user) return res.status(404).json({ message: 'Staff member not found' });

    const oldClassId = user.classId;

    await user.update({
      firstName,
      lastName,
      phone: phone || null,
      role,
      classId: classId || null,
    });

    if (classId) {
      await db.ClassSubject.update(
        { teacherId: user.id },
        { where: { classId, teacherId: null } }
      );
    }

    if (oldClassId && oldClassId !== classId) {
      await db.ClassSubject.update(
        { teacherId: null },
        { where: { classId: oldClassId, teacherId: user.id } }
      );
    }

    const updated = await User.findByPk(user.id, {
      include: [{ model: db.Class, as: 'class', include: [{ model: db.Grade, as: 'grade' }] }],
      attributes: { exclude: ['password', 'verificationToken', 'resetPasswordToken', 'resetPasswordExpires'] },
    });

    res.json(updated);
  } catch (err) {
    console.error('Update staff error:', err);
    res.status(500).json({ message: 'Failed to update staff' });
  }
};

exports.deleteStaff = async (req, res) => {
  try {
    const user = await User.findOne({ where: { id: req.params.id, schoolId: req.user.schoolId } });
    if (!user) return res.status(404).json({ message: 'Staff member not found' });

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

exports.updateStaffAvatar = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const user = await User.findOne({ where: { id: req.params.id, schoolId: req.user.schoolId } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.avatarUrl) {
      const oldPath = path.join(__dirname, '../', user.avatarUrl);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    await user.update({ avatarUrl });
    res.json({ avatarUrl });
  } catch (err) {
    console.error('Update staff avatar error:', err);
    res.status(500).json({ message: 'Failed to update avatar' });
  }
};

exports.updateStudentAvatar = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const student = await Student.findOne({ where: { id: req.params.id } });
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const user = await User.findOne({ where: { id: student.userId, schoolId: req.user.schoolId } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.avatarUrl) {
      const oldPath = path.join(__dirname, '../', user.avatarUrl);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    await user.update({ avatarUrl });
    res.json({ avatarUrl });
  } catch (err) {
    console.error('Update student avatar error:', err);
    res.status(500).json({ message: 'Failed to update avatar' });
  }
};
