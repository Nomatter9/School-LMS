const db = require('../models');
const Subject = db.Subject;

exports.getAll = async (req, res) => {
  try {
    const subjects = await Subject.findAll({
      where: { schoolId: req.user.schoolId },
      include: [{ model: db.Grade, as: 'grade' }],
      order: [['name', 'ASC']],
    });
    res.json(subjects);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch subjects' });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, code, gradeId } = req.body;
    const subject = await Subject.create({ schoolId: req.user.schoolId, name, code, gradeId });
    res.status(201).json(subject);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create subject' });
  }
};

exports.update = async (req, res) => {
  try {
    const { name, code, gradeId } = req.body;
    const subject = await Subject.findOne({ where: { id: req.params.id, schoolId: req.user.schoolId } });
    if (!subject) return res.status(404).json({ message: 'Subject not found' });
    await subject.update({ name, code, gradeId });
    res.json(subject);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update subject' });
  }
};

exports.remove = async (req, res) => {
  try {
    const subject = await Subject.findOne({ where: { id: req.params.id, schoolId: req.user.schoolId } });
    if (!subject) return res.status(404).json({ message: 'Subject not found' });
    await subject.destroy();
    res.json({ message: 'Subject deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete subject' });
  }
};