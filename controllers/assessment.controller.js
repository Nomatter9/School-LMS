const db = require('../models');
const { validationResult } = require('express-validator');

const calcGrade = (marks, maxMarks) => {
  const pct = (marks / maxMarks) * 100;
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B';
  if (pct >= 60) return 'C';
  if (pct >= 50) return 'D';
  if (pct >= 40) return 'E';
  return 'U';
};

exports.getAll = async (req, res) => {
  try {
    const { classSubjectId, termId } = req.query;
    const where = {};
    if (classSubjectId) where.classSubjectId = classSubjectId;
    if (termId) where.termId = termId;

    const assessments = await db.Assessment.findAll({
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
        { model: db.AssessmentResult, as: 'results' },
      ],
      order: [['date', 'DESC']],
    });
    res.json(assessments);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch assessments' });
  }
};

exports.getOne = async (req, res) => {
  try {
    const assessment = await db.Assessment.findOne({
      where: { id: req.params.id },
      include: [
        {
          model: db.ClassSubject, as: 'classSubject',
          where: { teacherId: req.user.id },
          include: [{ model: db.Subject, as: 'subject' }, { model: db.Class, as: 'class' }],
        },
        { model: db.Term, as: 'term' },
        {
          model: db.AssessmentResult, as: 'results',
          include: [{
            model: db.Student, as: 'student',
            include: [{ model: db.User, as: 'user', attributes: ['id', 'firstName', 'lastName'] }],
          }],
        },
      ],
    });
    if (!assessment) return res.status(404).json({ message: 'Assessment not found' });
    res.json(assessment);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch assessment' });
  }
};

exports.create = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ message: 'Validation failed', errors: errors.array() });

    const { classSubjectId, termId, title, type, maxMarks, weightPercent, date } = req.body;

    const cs = await db.ClassSubject.findOne({ where: { id: classSubjectId, teacherId: req.user.id } });
    if (!cs) return res.status(403).json({ message: 'Not authorized for this subject' });

    const assessment = await db.Assessment.create({
      classSubjectId,
      termId,
      title,
      type: type || 'ca',
      maxMarks: maxMarks ? parseInt(maxMarks) : 100,
      weightPercent: weightPercent ? parseInt(weightPercent) : null,
      date: date || null,
    });

    res.status(201).json(assessment);
  } catch (err) {
    console.error('Create assessment error:', err);
    res.status(500).json({ message: 'Failed to create assessment' });
  }
};

exports.update = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ message: 'Validation failed', errors: errors.array() });

    const assessment = await db.Assessment.findOne({
      where: { id: req.params.id },
      include: [{ model: db.ClassSubject, as: 'classSubject', where: { teacherId: req.user.id } }],
    });
    if (!assessment) return res.status(404).json({ message: 'Assessment not found' });

    const { title, type, maxMarks, weightPercent, date } = req.body;
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (type !== undefined) updates.type = type;
    if (maxMarks !== undefined) updates.maxMarks = parseInt(maxMarks);
    if (weightPercent !== undefined) updates.weightPercent = parseInt(weightPercent);
    if (date !== undefined) updates.date = date;

    await assessment.update(updates);
    res.json(assessment);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update assessment' });
  }
};

exports.remove = async (req, res) => {
  try {
    const assessment = await db.Assessment.findOne({
      where: { id: req.params.id },
      include: [{ model: db.ClassSubject, as: 'classSubject', where: { teacherId: req.user.id } }],
    });
    if (!assessment) return res.status(404).json({ message: 'Assessment not found' });
    await assessment.destroy();
    res.json({ message: 'Assessment deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete assessment' });
  }
};

exports.saveResults = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ message: 'Validation failed', errors: errors.array() });

    const assessment = await db.Assessment.findOne({
      where: { id: req.params.id },
      include: [{ model: db.ClassSubject, as: 'classSubject', where: { teacherId: req.user.id } }],
    });
    if (!assessment) return res.status(404).json({ message: 'Assessment not found' });

    const { results } = req.body;

    const saved = await Promise.all(
      results.map(async (r) => {
        const gradeSymbol = calcGrade(r.marks, assessment.maxMarks);
        const [result, created] = await db.AssessmentResult.findOrCreate({
          where: { assessmentId: assessment.id, pupilId: r.pupilId },
          defaults: { marks: r.marks, gradeSymbol, remarks: r.remarks || null },
        });
        if (!created) {
          await result.update({ marks: r.marks, gradeSymbol, remarks: r.remarks || null });
        }
        return result;
      })
    );

    res.json({ message: 'Results saved', results: saved });
  } catch (err) {
    console.error('Save results error:', err);
    res.status(500).json({ message: 'Failed to save results' });
  }
};