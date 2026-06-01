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
        { model: User, as: 'parent', attributes: ['id', 'firstName', 'lastName', 'email',  'avatarUrl', ] },
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
      include: [
        {
          model: User,
          as: 'user',
          where: { 
            email: req.params.id, 
            schoolId: req.user.schoolId 
          },
          attributes: { exclude: ['password', 'verificationToken', 'resetPasswordToken', 'resetPasswordExpires'] },
        },
        { model: db.Class, as: 'class' },
        { model: User, as: 'parent', attributes: ['id', 'firstName', 'lastName', 'email',  'avatarUrl', ] },
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
 * GET /api/students/:id/subjects
 * Admin/teacher views a specific student's subjects
 */
exports.getStudentSubjects = async (req, res) => {
  try {
    const student = await Student.findOne({
      where: { id: req.params.id },
      include: [{ model: User, as: 'user', where: { schoolId: req.user.schoolId } }],
    });
    if (!student || !student.classId) return res.json([]);

    const subjects = await db.ClassSubject.findAll({
      where: { classId: student.classId },
      include: [
        { model: db.Subject, as: 'subject' },
        { model: db.Class, as: 'class', include: [{ model: db.Grade, as: 'grade' }] },
        { model: User, as: 'teacher', attributes: ['id', 'firstName', 'lastName'] },
      ],
    });
    res.json(subjects);
  } catch (err) {
    console.error('Get student subjects error:', err);
    res.status(500).json({ message: 'Failed to fetch subjects' });
  }
};

/**
 * GET /api/students/:id/results
 * Admin/teacher views a specific student's assessment results
 */
exports.getStudentResults = async (req, res) => {
  try {
    const student = await Student.findOne({
      where: { id: req.params.id },
      include: [{ model: User, as: 'user', where: { schoolId: req.user.schoolId } }],
    });
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const results = await db.AssessmentResult.findAll({
      where: { pupilId: student.id },
      include: [
        {
          model: db.Assessment, as: 'assessment',
          include: [
            { model: db.Term, as: 'term' },
            {
              model: db.ClassSubject, as: 'classSubject',
              include: [
                { model: db.Subject, as: 'subject' },
                { model: db.Class, as: 'class', include: [{ model: db.Grade, as: 'grade' }] },
              ],
            },
          ],
        },
      ],
      order: [[{ model: db.Assessment, as: 'assessment' }, 'date', 'DESC']],
    });
    res.json(results);
  } catch (err) {
    console.error('Get student results error:', err);
    res.status(500).json({ message: 'Failed to fetch results' });
  }
};

/**
 * GET /api/students/:id/attendance
 * Admin/teacher views a specific student's attendance
 */
exports.getStudentAttendance = async (req, res) => {
  try {
    const student = await Student.findOne({
      where: { id: req.params.id },
      include: [{ model: User, as: 'user', where: { schoolId: req.user.schoolId } }],
    });
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const { termId, startDate, endDate } = req.query;
    const { Op } = require('sequelize');
    const where = { pupilId: student.id };
    if (startDate && endDate) where.date = { [Op.between]: [startDate, endDate] };

    const records = await db.Attendance.findAll({
      where,
      order: [['date', 'DESC']],
    });

    const total = records.length;
    const present = records.filter(r => r.status === 'present').length;
    const absent  = records.filter(r => r.status === 'absent').length;
    const late    = records.filter(r => r.status === 'late').length;

    res.json({
      summary: { total, present, absent, late, attendanceRate: total ? Math.round((present / total) * 100) : 0 },
      records,
    });
  } catch (err) {
    console.error('Get student attendance error:', err);
    res.status(500).json({ message: 'Failed to fetch attendance' });
  }
};

/**
 * GET /api/students/:id/homework
 * Admin/teacher views a specific student's homework submissions
 */
exports.getStudentHomework = async (req, res) => {
  try {
    const student = await Student.findOne({
      where: { id: req.params.id },
      include: [{ model: User, as: 'user', where: { schoolId: req.user.schoolId } }],
    });
    if (!student || !student.classId) return res.json([]);

    const classSubjects = await db.ClassSubject.findAll({
      where: { classId: student.classId },
      attributes: ['id'],
    });
    const csIds = classSubjects.map(cs => cs.id);

    const homework = await db.Homework.findAll({
      where: { classSubjectId: csIds },
      include: [
        {
          model: db.ClassSubject, as: 'classSubject',
          include: [{ model: db.Subject, as: 'subject' }],
        },
        { model: db.Term, as: 'term' },
        {
          model: db.HomeworkSubmission, as: 'submissions',
          where: { pupilId: student.id },
          required: false,
        },
      ],
      order: [['dueDate', 'DESC']],
    });
    res.json(homework);
  } catch (err) {
    console.error('Get student homework error:', err);
    res.status(500).json({ message: 'Failed to fetch homework' });
  }
};

/**
 * GET /api/students/portal/subjects
 * Student views their own class subjects
 */
exports.getMySubjects = async (req, res) => {
  try {
    const student = await Student.findOne({
      include: [{ model: User, as: 'user', where: { id: req.user.id } }],
    });
    if (!student || !student.classId) return res.json([]);

    const subjects = await db.ClassSubject.findAll({
      where: { classId: student.classId },
      include: [
        { model: db.Subject, as: 'subject' },
        { model: db.Class, as: 'class', include: [{ model: db.Grade, as: 'grade' }] },
        { model: User, as: 'teacher', attributes: ['id', 'firstName', 'lastName'] },
      ],
    });
    res.json(subjects);
  } catch (err) {
    console.error('Get my subjects error:', err);
    res.status(500).json({ message: 'Failed to fetch subjects' });
  }
};

/**
 * GET /api/students/portal/homework
 * Student views homework for their class
 */
exports.getMyHomework = async (req, res) => {
  try {
    const student = await Student.findOne({
      include: [{ model: User, as: 'user', where: { id: req.user.id } }],
    });
    if (!student || !student.classId) return res.json([]);

    const classSubjects = await db.ClassSubject.findAll({
      where: { classId: student.classId },
      attributes: ['id'],
    });
    const csIds = classSubjects.map(cs => cs.id);

    const homework = await db.Homework.findAll({
      where: { classSubjectId: csIds, isPublished: true },
      include: [
        {
          model: db.ClassSubject, as: 'classSubject',
          include: [{ model: db.Subject, as: 'subject' }],
        },
        { model: db.Term, as: 'term' },
        {
          model: db.HomeworkSubmission, as: 'submissions',
          where: { pupilId: student.id },
          required: false,
        },
      ],
      order: [['dueDate', 'ASC']],
    });
    res.json(homework);
  } catch (err) {
    console.error('Get my homework error:', err);
    res.status(500).json({ message: 'Failed to fetch homework' });
  }
};

/**
 * GET /api/students/portal/results
 * Student views their assessment results
 */
exports.getMyResults = async (req, res) => {
  try {
    const student = await Student.findOne({
      include: [{ model: User, as: 'user', where: { id: req.user.id } }],
    });
    if (!student) return res.json([]);

    const results = await db.AssessmentResult.findAll({
      where: { pupilId: student.id },
      include: [
        {
          model: db.Assessment, as: 'assessment',
          include: [
            { model: db.Term, as: 'term' },
            {
              model: db.ClassSubject, as: 'classSubject',
              include: [{ model: db.Subject, as: 'subject' }],
            },
          ],
        },
      ],
      order: [[{ model: db.Assessment, as: 'assessment' }, 'date', 'DESC']],
    });
    res.json(results);
  } catch (err) {
    console.error('Get my results error:', err);
    res.status(500).json({ message: 'Failed to fetch results' });
  }
};

/**
 * GET /api/students/me/homework/:id
 * Student views a single published homework from their class
 */
exports.getMyHomeworkOne = async (req, res) => {
  try {
    const student = await Student.findOne({
      include: [{ model: User, as: 'user', where: { id: req.user.id } }],
    });
    if (!student || !student.classId) return res.status(404).json({ message: 'Homework not found' });

    const classSubjects = await db.ClassSubject.findAll({
      where: { classId: student.classId },
      attributes: ['id'],
    });
    const csIds = classSubjects.map(cs => cs.id);

    const homework = await db.Homework.findOne({
      where: { id: req.params.id, classSubjectId: csIds, isPublished: true },
      include: [
        {
          model: db.ClassSubject, as: 'classSubject',
          include: [
            { model: db.Subject, as: 'subject' },
            { model: User, as: 'teacher', attributes: ['id', 'firstName', 'lastName'] },
          ],
        },
        { model: db.Term, as: 'term' },
        {
          model: db.HomeworkSubmission, as: 'submissions',
          where: { pupilId: student.id },
          required: false,
        },
      ],
    });
    if (!homework) return res.status(404).json({ message: 'Homework not found' });
    res.json(homework);
  } catch (err) {
    console.error('Get my homework error:', err);
    res.status(500).json({ message: 'Failed to fetch homework' });
  }
};

/**
 * GET /api/students/me/lessons
 * Student views published lessons for their class
 */
exports.getMyLessons = async (req, res) => {
  try {
    const student = await Student.findOne({
      include: [{ model: User, as: 'user', where: { id: req.user.id } }],
    });
    if (!student || !student.classId) return res.json([]);

    const classSubjects = await db.ClassSubject.findAll({
      where: { classId: student.classId },
      attributes: ['id'],
    });
    const csIds = classSubjects.map(cs => cs.id);

    const lessons = await db.Lesson.findAll({
      where: { classSubjectId: csIds, isPublished: true },
      include: [
        {
          model: db.ClassSubject, as: 'classSubject',
          include: [
            { model: db.Subject, as: 'subject' },
            { model: User, as: 'teacher', attributes: ['id', 'firstName', 'lastName'] },
          ],
        },
        { model: db.Term, as: 'term' },
      ],
      order: [['weekNumber', 'ASC'], ['createdAt', 'DESC']],
    });
    res.json(lessons);
  } catch (err) {
    console.error('Get my lessons error:', err);
    res.status(500).json({ message: 'Failed to fetch lessons' });
  }
};

/**
 * GET /api/students/me/lessons/:id
 * Student views a single published lesson from their class
 */
exports.getMyLesson = async (req, res) => {
  try {
    const student = await Student.findOne({
      include: [{ model: User, as: 'user', where: { id: req.user.id } }],
    });
    if (!student || !student.classId) return res.status(404).json({ message: 'Lesson not found' });

    const classSubjects = await db.ClassSubject.findAll({
      where: { classId: student.classId },
      attributes: ['id'],
    });
    const csIds = classSubjects.map(cs => cs.id);

    const lesson = await db.Lesson.findOne({
      where: { id: req.params.id, classSubjectId: csIds, isPublished: true },
      include: [
        {
          model: db.ClassSubject, as: 'classSubject',
          include: [
            { model: db.Subject, as: 'subject' },
            { model: User, as: 'teacher', attributes: ['id', 'firstName', 'lastName'] },
          ],
        },
        { model: db.Term, as: 'term' },
      ],
    });
    if (!lesson) return res.status(404).json({ message: 'Lesson not found' });
    res.json(lesson);
  } catch (err) {
    console.error('Get my lesson error:', err);
    res.status(500).json({ message: 'Failed to fetch lesson' });
  }
};

/**
 * POST /api/students/me/lessons/:id/read
 * Student marks a lesson as read
 */
exports.markLessonRead = async (req, res) => {
  try {
    const student = await Student.findOne({
      include: [{ model: User, as: 'user', where: { id: req.user.id } }],
    });
    if (!student || !student.classId) return res.status(404).json({ message: 'Lesson not found' });

    const classSubjects = await db.ClassSubject.findAll({
      where: { classId: student.classId },
      attributes: ['id'],
    });
    const csIds = classSubjects.map(cs => cs.id);

    const lesson = await db.Lesson.findOne({
      where: { id: req.params.id, classSubjectId: csIds, isPublished: true },
    });
    if (!lesson) return res.status(404).json({ message: 'Lesson not found' });

    const [progress] = await db.LessonProgress.findOrCreate({
      where: { lessonId: lesson.id, pupilId: student.id },
      defaults: { isRead: true, readAt: new Date() },
    });

    if (!progress.isRead) {
      await progress.update({ isRead: true, readAt: new Date() });
    }

    res.json(progress);
  } catch (err) {
    console.error('Mark lesson read error:', err);
    res.status(500).json({ message: 'Failed to mark lesson as read' });
  }
};

/**
 * POST /api/students/me/lessons/:id/respond
 * Student submits a response/acknowledgment to a lesson
 */
exports.respondToLesson = async (req, res) => {
  try {
    const { response } = req.body;
    if (!response?.trim()) return res.status(422).json({ message: 'Response is required' });

    const student = await Student.findOne({
      include: [{ model: User, as: 'user', where: { id: req.user.id } }],
    });
    if (!student || !student.classId) return res.status(404).json({ message: 'Lesson not found' });

    const classSubjects = await db.ClassSubject.findAll({
      where: { classId: student.classId },
      attributes: ['id'],
    });
    const csIds = classSubjects.map(cs => cs.id);

    const lesson = await db.Lesson.findOne({
      where: { id: req.params.id, classSubjectId: csIds, isPublished: true },
    });
    if (!lesson) return res.status(404).json({ message: 'Lesson not found' });

    const [progress, created] = await db.LessonProgress.findOrCreate({
      where: { lessonId: lesson.id, pupilId: student.id },
      defaults: { isRead: true, readAt: new Date(), response: response.trim(), respondedAt: new Date() },
    });

    if (!created) {
      await progress.update({ response: response.trim(), respondedAt: new Date() });
    }

    res.status(created ? 201 : 200).json(progress);
  } catch (err) {
    console.error('Respond to lesson error:', err);
    res.status(500).json({ message: 'Failed to save response' });
  }
};

/**
 * GET /api/students/me/submissions/:id
 * Student views a single homework submission
 */
exports.getMySubmissionOne = async (req, res) => {
  try {
    const student = await Student.findOne({
      include: [{ model: User, as: 'user', where: { id: req.user.id } }],
    });
    if (!student) return res.status(404).json({ message: 'Submission not found' });

    const submission = await db.HomeworkSubmission.findOne({
      where: { id: req.params.id, pupilId: student.id },
      include: [
        {
          model: db.Homework, as: 'homework',
          include: [
            {
              model: db.ClassSubject, as: 'classSubject',
              include: [{ model: db.Subject, as: 'subject' }],
            },
            { model: db.Term, as: 'term' },
          ],
        },
      ],
    });
    if (!submission) return res.status(404).json({ message: 'Submission not found' });
    res.json(submission);
  } catch (err) {
    console.error('Get my submission error:', err);
    res.status(500).json({ message: 'Failed to fetch submission' });
  }
};

/**
 * GET /api/students/me/submissions
 * Student views their own homework submissions
 */
exports.getMySubmissions = async (req, res) => {
  try {
    const student = await Student.findOne({
      include: [{ model: User, as: 'user', where: { id: req.user.id } }],
    });
    if (!student) return res.json([]);

    const submissions = await db.HomeworkSubmission.findAll({
      where: { pupilId: student.id },
      include: [
        {
          model: db.Homework, as: 'homework',
          include: [
            {
              model: db.ClassSubject, as: 'classSubject',
              include: [{ model: db.Subject, as: 'subject' }],
            },
            { model: db.Term, as: 'term' },
          ],
        },
      ],
      order: [['submittedAt', 'DESC']],
    });
    res.json(submissions);
  } catch (err) {
    console.error('Get my submissions error:', err);
    res.status(500).json({ message: 'Failed to fetch submissions' });
  }
};

/**
 * GET /api/students/me/results/:id
 * Student views a single assessment result
 */
exports.getMyResultOne = async (req, res) => {
  try {
    const student = await Student.findOne({
      include: [{ model: User, as: 'user', where: { id: req.user.id } }],
    });
    if (!student) return res.status(404).json({ message: 'Result not found' });

    const result = await db.AssessmentResult.findOne({
      where: { id: req.params.id, pupilId: student.id },
      include: [
        {
          model: db.Assessment, as: 'assessment',
          include: [
            { model: db.Term, as: 'term' },
            {
              model: db.ClassSubject, as: 'classSubject',
              include: [{ model: db.Subject, as: 'subject' }],
            },
          ],
        },
      ],
    });
    if (!result) return res.status(404).json({ message: 'Result not found' });
    res.json(result);
  } catch (err) {
    console.error('Get my result error:', err);
    res.status(500).json({ message: 'Failed to fetch result' });
  }
};

/**
 * GET /api/students/me/attendance/:id
 * Student views a single attendance record
 */
exports.getMyAttendanceOne = async (req, res) => {
  try {
    const student = await Student.findOne({
      include: [{ model: User, as: 'user', where: { id: req.user.id } }],
    });
    if (!student) return res.status(404).json({ message: 'Record not found' });

    const record = await db.Attendance.findOne({
      where: { id: req.params.id, pupilId: student.id },
    });
    if (!record) return res.status(404).json({ message: 'Record not found' });
    res.json(record);
  } catch (err) {
    console.error('Get my attendance record error:', err);
    res.status(500).json({ message: 'Failed to fetch attendance record' });
  }
};

/**
 * GET /api/students/me/attendance
 * Student views their own attendance records
 */
exports.getMyAttendance = async (req, res) => {
  try {
    const student = await Student.findOne({
      include: [{ model: User, as: 'user', where: { id: req.user.id } }],
    });
    if (!student) return res.json([]);

    const records = await db.Attendance.findAll({
      where: { pupilId: student.id },
      order: [['date', 'DESC']],
    });
    res.json(records);
  } catch (err) {
    console.error('Get my attendance error:', err);
    res.status(500).json({ message: 'Failed to fetch attendance' });
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