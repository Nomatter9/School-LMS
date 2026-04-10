const db = require('../models');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const { sendRegistrationEmail } = require('../utils/emailService');

const User = db.User;
const Student = db.Student;

// ─── Format ───────────────────────────────────────────────────
const formatStudent = (student) => ({
  id: student.id,
  userId: student.userId,
  regNumber: student.regNumber,
  dateOfBirth: student.dateOfBirth,
  gender: student.gender,
  classId: student.classId,
  parentId: student.parentId,
  user: student.user ? {
    id: student.user.id,
    firstName: student.user.firstName,
    lastName: student.user.lastName,
    email: student.user.email,
    phone: student.user.phone,
    isActive: student.user.isActive,
    isVerified: student.user.isVerified,
  } : null,
  class: student.class ? {
    id: student.class.id,
    name: student.class.name,
  } : null,
  parent: student.parent ? {
    id: student.parent.id,
    firstName: student.parent.firstName,
    lastName: student.parent.lastName,
    email: student.parent.email,
  } : null,
  createdAt: student.createdAt,
});

/**
 * GET /api/students
 */
exports.getAll = async (req, res) => {
  try {
    const students = await Student.findAll({
      include: [
        {
          model: User,
          as: 'user',
          where: { schoolId: req.user.schoolId },
          attributes: { exclude: ['password', 'verificationToken', 'resetPasswordToken', 'resetPasswordExpires'] },
        },
        { model: db.Class, as: 'class', attributes: ['id', 'name'] },
        { model: User, as: 'parent', attributes: ['id', 'firstName', 'lastName', 'email'] },
      ],
      order: [[{ model: User, as: 'user' }, 'firstName', 'ASC']],
    });
    res.json(students.map(formatStudent));
  } catch (err) {
    console.error('Get students error:', err);
    res.status(500).json({ message: 'Failed to fetch students' });
  }
};

/**
 * GET /api/students/:id
 */
exports.getOne = async (req, res) => {
  try {
    const student = await Student.findOne({
      where: { id: req.params.id },
      include: [
        {
          model: User,
          as: 'user',
          where: { schoolId: req.user.schoolId },
          attributes: { exclude: ['password', 'verificationToken', 'resetPasswordToken', 'resetPasswordExpires'] },
        },
        { model: db.Class, as: 'class' },
        { model: User, as: 'parent', attributes: ['id', 'firstName', 'lastName', 'email'] },
      ],
    });
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json(formatStudent(student));
  } catch (err) {
    console.error('Get student error:', err);
    res.status(500).json({ message: 'Failed to fetch student' });
  }
};

/**
 * POST /api/students
 */
exports.create = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ message: 'Validation failed', errors: errors.array() });
    }

    const {
      firstName, lastName, email, phone,
      regNumber, dateOfBirth, gender, classId, parentId,
    } = req.body;

    // Check email not taken
    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(409).json({ message: 'Email already registered' });

    // Auto generate password
    const generatedPassword = crypto.randomBytes(6).toString('hex');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(generatedPassword, salt);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Create user with role pupil
    const user = await User.create({
      schoolId: req.user.schoolId,
      firstName,
      lastName,
      email,
      phone: phone || null,
      password: hashedPassword,
      role: 'pupil',
      isVerified: false,
      verificationToken,
    });

    // Create student profile
    const student = await Student.create({
      userId: user.id,
      classId: classId || null,
      parentId: parentId || null,
      regNumber: regNumber || null,
      dateOfBirth: dateOfBirth || null,
      gender: gender || null,
    });

    // Send registration email
    try {
      await sendRegistrationEmail(email, verificationToken, generatedPassword);
    } catch (emailErr) {
      console.error('Student registration email failed:', emailErr);
    }

    // Fetch with associations
    const created = await Student.findByPk(student.id, {
      include: [
        { model: User, as: 'user', attributes: { exclude: ['password', 'verificationToken', 'resetPasswordToken', 'resetPasswordExpires'] } },
        { model: db.Class, as: 'class', attributes: ['id', 'name'] },
        { model: User, as: 'parent', attributes: ['id', 'firstName', 'lastName', 'email'] },
      ],
    });

    res.status(201).json(formatStudent(created));
  } catch (err) {
    console.error('Create student error:', err);
    res.status(500).json({ message: 'Failed to create student' });
  }
};

/**
 * PUT /api/students/:id
 */
exports.update = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ message: 'Validation failed', errors: errors.array() });
    }

    const student = await Student.findOne({
      where: { id: req.params.id },
      include: [{ model: User, as: 'user', where: { schoolId: req.user.schoolId } }],
    });
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const {
      firstName, lastName, phone,
      regNumber, dateOfBirth, gender, classId, parentId, isActive,
    } = req.body;

    // Update user
    const userUpdate = {};
    if (firstName !== undefined) userUpdate.firstName = firstName;
    if (lastName !== undefined) userUpdate.lastName = lastName;
    if (phone !== undefined) userUpdate.phone = phone || null;
    if (isActive !== undefined) userUpdate.isActive = isActive;
    await student.user.update(userUpdate);

    // Update student profile
    const studentUpdate = {};
    if (regNumber !== undefined) studentUpdate.regNumber = regNumber || null;
    if (dateOfBirth !== undefined) studentUpdate.dateOfBirth = dateOfBirth || null;
    if (gender !== undefined) studentUpdate.gender = gender || null;
    if (classId !== undefined) studentUpdate.classId = classId || null;
    if (parentId !== undefined) studentUpdate.parentId = parentId || null;
    await student.update(studentUpdate);

    // Fetch updated
    const updated = await Student.findByPk(student.id, {
      include: [
        { model: User, as: 'user', attributes: { exclude: ['password', 'verificationToken', 'resetPasswordToken', 'resetPasswordExpires'] } },
        { model: db.Class, as: 'class', attributes: ['id', 'name'] },
        { model: User, as: 'parent', attributes: ['id', 'firstName', 'lastName', 'email'] },
      ],
    });

    res.json(formatStudent(updated));
  } catch (err) {
    console.error('Update student error:', err);
    res.status(500).json({ message: 'Failed to update student' });
  }
};

/**
 * DELETE /api/students/:id
 */
exports.remove = async (req, res) => {
  try {
    const student = await Student.findOne({
      where: { id: req.params.id },
      include: [{ model: User, as: 'user', where: { schoolId: req.user.schoolId } }],
    });
    if (!student) return res.status(404).json({ message: 'Student not found' });

    await student.destroy();
    await student.user.destroy();

    res.json({ message: 'Student removed successfully' });
  } catch (err) {
    console.error('Delete student error:', err);
    res.status(500).json({ message: 'Failed to delete student' });
  }
};