const db = require('../models');
const AcademicYear = db.AcademicYear;
const Term = db.Term;

// GET /api/academic-years
exports.getAll = async (req, res) => {
  try {
    const years = await AcademicYear.findAll({
      where: { schoolId: req.user.schoolId },
      include: [{ model: Term, as: 'terms' }],
      order: [['year', 'DESC']],
    });
    res.json(years);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch academic years' });
  }
};

// POST /api/academic-years
exports.create = async (req, res) => {
  try {
    const { year, isCurrent } = req.body;
    if (isCurrent) {
      await AcademicYear.update({ isCurrent: false }, { where: { schoolId: req.user.schoolId } });
    }
    const academicYear = await AcademicYear.create({ schoolId: req.user.schoolId, year, isCurrent: isCurrent || false });
    res.status(201).json(academicYear);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create academic year' });
  }
};

// PUT /api/academic-years/:id
exports.update = async (req, res) => {
  try {
    const { year, isCurrent } = req.body;
    const academicYear = await AcademicYear.findOne({ where: { id: req.params.id, schoolId: req.user.schoolId } });
    if (!academicYear) return res.status(404).json({ message: 'Academic year not found' });
    if (isCurrent) {
      await AcademicYear.update({ isCurrent: false }, { where: { schoolId: req.user.schoolId } });
    }
    await academicYear.update({ year, isCurrent });
    res.json(academicYear);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update academic year' });
  }
};

// DELETE /api/academic-years/:id
exports.remove = async (req, res) => {
  try {
    const academicYear = await AcademicYear.findOne({ where: { id: req.params.id, schoolId: req.user.schoolId } });
    if (!academicYear) return res.status(404).json({ message: 'Academic year not found' });
    await academicYear.destroy();
    res.json({ message: 'Academic year deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete academic year' });
  }
};