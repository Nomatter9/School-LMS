const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const db = require('../models');
const { sendSetPasswordEmail } = require('../utils/emailService');
const { formatUser } = require('../utils/formatters');
const { User } = db;

exports.getParents = async (req, res) => {
  try {
    const parents = await User.findAll({
      where: { schoolId: req.user.schoolId, role: 'parent' },
      attributes: { exclude: ['password', 'verificationToken', 'resetPasswordToken', 'resetPasswordExpires'] },
      include: [
        {
          model: db.Student,
          as: 'children',
          include: [{ model: db.User, as: 'user', attributes: ['id', 'firstName', 'lastName'] }],
        },
      ],
      order: [['firstName', 'ASC']],
    });
    res.json(parents.map(p => ({
      ...formatUser(p),
      children: p.children || [],
    })));
  } catch (err) {
    console.error('Get parents error:', err);
    res.status(500).json({ message: 'Failed to fetch parents' });
  }
};

exports.createParent = async (req, res) => {
  try {
    const { firstName, lastName, email, phone } = req.body;

    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(409).json({ message: 'Email already in use' });

    const salt = await bcrypt.genSalt(10);
    const placeholderPassword = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), salt);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const setPasswordToken = crypto.randomBytes(32).toString('hex');

    const parent = await User.create({
      schoolId: req.user.schoolId,
      firstName,
      lastName,
      email,
      phone: phone || null,
      role: 'parent',
      password: placeholderPassword,
      isVerified: false,
      verificationToken,
      resetPasswordToken: setPasswordToken,
      resetPasswordExpires: new Date(Date.now() + 24 * 3600000),
    });

    try {
      await sendSetPasswordEmail(email, firstName, setPasswordToken);
    } catch (emailError) {
      console.error('Parent activation email failed:', emailError);
    }

    res.status(201).json(formatUser(parent));
  } catch (err) {
    console.error('Create parent error:', err);
    res.status(500).json({ message: 'Failed to create parent' });
  }
};

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

exports.updateParentAvatar = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const parent = await User.findOne({
      where: { id: req.params.id, schoolId: req.user.schoolId, role: 'parent' },
    });
    if (!parent) return res.status(404).json({ message: 'Parent not found' });

    if (parent.avatarUrl) {
      const oldPath = path.join(__dirname, '../', parent.avatarUrl);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    await parent.update({ avatarUrl });
    res.json({ avatarUrl });
  } catch (err) {
    console.error('Update parent avatar error:', err);
    res.status(500).json({ message: 'Failed to update avatar' });
  }
};
