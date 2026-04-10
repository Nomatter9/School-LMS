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

    const lessons = await db.Lesson.findAll({
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
      ],
      order: [['weekNumber', 'ASC'], ['createdAt', 'DESC']],
    });
    res.json(lessons);
  } catch (err) {
    console.error('Get lessons error:', err);
    res.status(500).json({ message: 'Failed to fetch lessons' });
  }
};

exports.getOne = async (req, res) => {
  try {
    const lesson = await db.Lesson.findOne({
      where: { id: req.params.id },
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
      ],
    });
    if (!lesson) return res.status(404).json({ message: 'Lesson not found' });
    res.json(lesson);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch lesson' });
  }
};

exports.create = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ message: 'Validation failed', errors: errors.array() });

    const { classSubjectId, termId, title, content, videoUrl, weekNumber, isPublished } = req.body;

    const cs = await db.ClassSubject.findOne({ where: { id: classSubjectId, teacherId: req.user.id } });
    if (!cs) return res.status(403).json({ message: 'Not authorized for this subject' });

    const lesson = await db.Lesson.create({
      classSubjectId,
      termId,
      title,
      content: content || null,
      videoUrl: videoUrl || null,
      fileUrl: req.file ? `/uploads/files/${req.file.filename}` : null,
      weekNumber: weekNumber ? parseInt(weekNumber) : null,
      isPublished: isPublished === 'true' || isPublished === true || false,
    });

    const created = await db.Lesson.findByPk(lesson.id, {
      include: [
        { model: db.ClassSubject, as: 'classSubject', include: [{ model: db.Subject, as: 'subject' }, { model: db.Class, as: 'class' }] },
        { model: db.Term, as: 'term' },
      ],
    });

    res.status(201).json(created);
  } catch (err) {
    console.error('Create lesson error:', err);
    res.status(500).json({ message: 'Failed to create lesson' });
  }
};

exports.update = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ message: 'Validation failed', errors: errors.array() });

    const lesson = await db.Lesson.findOne({
      where: { id: req.params.id },
      include: [{ model: db.ClassSubject, as: 'classSubject', where: { teacherId: req.user.id } }],
    });
    if (!lesson) return res.status(404).json({ message: 'Lesson not found' });

    const { title, content, videoUrl, weekNumber, isPublished } = req.body;
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (content !== undefined) updates.content = content;
    if (videoUrl !== undefined) updates.videoUrl = videoUrl || null;
    if (weekNumber !== undefined) updates.weekNumber = parseInt(weekNumber);
    if (isPublished !== undefined) updates.isPublished = isPublished === 'true' || isPublished === true;

    if (req.file) {
      // Delete old file
      if (lesson.fileUrl) {
        const oldPath = path.join(__dirname, '../', lesson.fileUrl);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      updates.fileUrl = `/uploads/files/${req.file.filename}`;
    }

    await lesson.update(updates);
    await lesson.reload({
      include: [
        { model: db.ClassSubject, as: 'classSubject', include: [{ model: db.Subject, as: 'subject' }, { model: db.Class, as: 'class' }] },
        { model: db.Term, as: 'term' },
      ],
    });

    res.json(lesson);
  } catch (err) {
    console.error('Update lesson error:', err);
    res.status(500).json({ message: 'Failed to update lesson' });
  }
};

exports.remove = async (req, res) => {
  try {
    const lesson = await db.Lesson.findOne({
      where: { id: req.params.id },
      include: [{ model: db.ClassSubject, as: 'classSubject', where: { teacherId: req.user.id } }],
    });
    if (!lesson) return res.status(404).json({ message: 'Lesson not found' });

    if (lesson.fileUrl) {
      const filePath = path.join(__dirname, '../', lesson.fileUrl);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await lesson.destroy();
    res.json({ message: 'Lesson deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete lesson' });
  }
};