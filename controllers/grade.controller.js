const db = require('../models');
const Grade = db.Grade;

exports.getAll = async (req, res) => {
  try {
    const grades = await Grade.findAll({
      where: { schoolId: req.user.schoolId },
      order: [['level', 'ASC']],
    });
    res.json(grades);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch grades' });
  }
};

exports.create = async (req, res) => {
  try {
    const { level, label } = req.body;
    const grade = await Grade.create({ schoolId: req.user.schoolId, level, label });
    res.status(201).json(grade);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create grade' });
  }
};

exports.update = async (req, res) => {
  try {
    const { level, label } = req.body;
    const grade = await Grade.findOne({ where: { id: req.params.id, schoolId: req.user.schoolId } });
    if (!grade) return res.status(404).json({ message: 'Grade not found' });
    await grade.update({ level, label });
    res.json(grade);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update grade' });
  }
};

exports.remove = async (req, res) => {
  try {
    const grade = await Grade.findOne({ where: { id: req.params.id, schoolId: req.user.schoolId } });
    if (!grade) return res.status(404).json({ message: 'Grade not found' });
    await grade.destroy();
    res.json({ message: 'Grade deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete grade' });
  }
};