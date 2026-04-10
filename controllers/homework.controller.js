const db = require('../models');
const { validationResult } = require('express-validator');
const fs = require('fs');
const path = require('path');

exports.getAll = async (req, res) => {
  try {
    const { classSubjectId, termId } = req.query;
    const where = {};
    if (classSubjectId) where.classSubjectId = classSubjectId;
    if (termId) where.termId = termId;

    const homework = await db.Homework.findAll({
      where,
      include: [
        {
          model: db.ClassSubject, as: 'classSubject',
          where: { teacherId: req.user.id },
          include: [
            { model: db.Subject, as: 'subject' },
            { model: db.Class, as: 'class' },
          ],
        },
        { model: db.Term, as: 'term' },
        { model: db.HomeworkSubmission, as: 'submissions' },
      ],
      order: [['dueDate', 'ASC']],
    });
    res.json(homework);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch homework' });
  }
};

exports.getOne = async (req, res) => {
  try {
    const hw = await db.Homework.findOne({
      where: { id: req.params.id },
      include: [
        {
          model: db.ClassSubject, as: 'classSubject',
          where: { teacherId: req.user.id },
          include: [{ model: db.Subject, as: 'subject' }, { model: db.Class, as: 'class' }],
        },
        { model: db.Term, as: 'term' },
        {
          model: db.HomeworkSubmission, as: 'submissions',
          include: [{
            model: db.Student, as: 'pupil',
            include: [{ model: db.User, as: 'user', attributes: ['id', 'firstName', 'lastName'] }],
          }],
        },
      ],
    });
    if (!hw) return res.status(404).json({ message: 'Homework not found' });
    res.json(hw);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch homework' });
  }
};

exports.create = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ message: 'Validation failed', errors: errors.array() });

    const { classSubjectId, termId, title, description, dueDate, maxMarks, isPublished } = req.body;

    const cs = await db.ClassSubject.findOne({ where: { id: classSubjectId, teacherId: req.user.id } });
    if (!cs) return res.status(403).json({ message: 'Not authorized for this subject' });

    const hw = await db.Homework.create({
      classSubjectId,
      termId,
      title,
      description: description || null,
      dueDate,
      maxMarks: maxMarks ? parseInt(maxMarks) : null,
      fileUrl: req.file ? `/uploads/files/${req.file.filename}` : null,
      isPublished: isPublished === 'true' || isPublished === true || false,
    });

    res.status(201).json(hw);
  } catch (err) {
    console.error('Create homework error:', err);
    res.status(500).json({ message: 'Failed to create homework' });
  }
};

exports.update = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ message: 'Validation failed', errors: errors.array() });

    const hw = await db.Homework.findOne({
      where: { id: req.params.id },
      include: [{ model: db.ClassSubject, as: 'classSubject', where: { teacherId: req.user.id } }],
    });
    if (!hw) return res.status(404).json({ message: 'Homework not found' });

    const { title, description, dueDate, maxMarks, isPublished } = req.body;
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (dueDate !== undefined) updates.dueDate = dueDate;
    if (maxMarks !== undefined) updates.maxMarks = parseInt(maxMarks);
    if (isPublished !== undefined) updates.isPublished = isPublished === 'true' || isPublished === true;

    if (req.file) {
      if (hw.fileUrl) {
        const oldPath = path.join(__dirname, '../', hw.fileUrl);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      updates.fileUrl = `/uploads/files/${req.file.filename}`;
    }

    await hw.update(updates);
    res.json(hw);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update homework' });
  }
};

exports.remove = async (req, res) => {
  try {
    const hw = await db.Homework.findOne({
      where: { id: req.params.id },
      include: [{ model: db.ClassSubject, as: 'classSubject', where: { teacherId: req.user.id } }],
    });
    if (!hw) return res.status(404).json({ message: 'Homework not found' });

    if (hw.fileUrl) {
      const filePath = path.join(__dirname, '../', hw.fileUrl);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await hw.destroy();
    res.json({ message: 'Homework deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete homework' });
  }
};

exports.gradeSubmission = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ message: 'Validation failed', errors: errors.array() });

    const submission = await db.HomeworkSubmission.findOne({
      where: { id: req.params.subId, homeworkId: req.params.hwId },
    });
    if (!submission) return res.status(404).json({ message: 'Submission not found' });

    const { marks, feedback } = req.body;
    await submission.update({ marks, feedback, gradedAt: new Date() });
    res.json(submission);
  } catch (err) {
    res.status(500).json({ message: 'Failed to grade submission' });
  }
};