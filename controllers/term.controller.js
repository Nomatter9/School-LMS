const db = require('../models');

// GET all terms for school (flat — no yearId)
// GET /api/terms
exports.getAllForSchool = async (req, res) => {
  try {
    const terms = await db.Term.findAll({
      include: [{
        model: db.AcademicYear,
        as: 'academicYear',
        where: { schoolId: req.user.schoolId },
      }],
      order: [['academicYearId', 'ASC'], ['termNumber', 'ASC']],
    });
    res.json(terms);
  } catch (err) {
    console.error('Get all terms error:', err);
    res.status(500).json({ message: 'Failed to fetch terms' });
  }
};

// GET terms by academic year
exports.getAll = async (req, res) => {
  try {
    const terms = await db.Term.findAll({
      include: [{
        model: db.AcademicYear,
        as: 'academicYear',
        required: true,
        where: { schoolId: req.user.schoolId },
      }],
      order: [
        [{ model: db.AcademicYear, as: 'academicYear' }, 'year', 'DESC'],
        ['termNumber', 'ASC'],
      ],
    });

    res.json(terms);
  } catch (err) {
    console.error('Get terms error:', err);
    res.status(500).json({ message: 'Failed to fetch terms' });
  }
};

// Helper — you can also store isCurrent on Term itself instead
function getCurrentTermNumber() {
  const month = new Date().getMonth() + 1;
  if (month >= 1 && month <= 4)  return 1;
  if (month >= 5 && month <= 8)  return 2;
  return 3;
}

// POST create term
// POST /api/academicYear/:yearId/terms
exports.create = async (req, res) => {
  try {
    const academicYearId = req.params.yearId;
    const { termNumber, startDate, endDate, isCurrent } = req.body;

    const year = await db.AcademicYear.findOne({
      where: { id: academicYearId, schoolId: req.user.schoolId },
    });
    if (!year) return res.status(404).json({ message: 'Academic year not found' });

    if (isCurrent) {
      await db.Term.update(
        { isCurrent: false },
        { where: { academicYearId } }
      );
    }

    const term = await db.Term.create({
      academicYearId,
      termNumber,
      startDate,
      endDate,
      isCurrent: isCurrent || false,
    });

    res.status(201).json(term);
  } catch (err) {
    console.error('Create term error:', err);
    res.status(500).json({ message: 'Failed to create term' });
  }
};

// PUT update term
// PUT /api/terms/:id
exports.update = async (req, res) => {
  try {
    const term = await db.Term.findByPk(req.params.id);
    if (!term) return res.status(404).json({ message: 'Term not found' });

    // Verify it belongs to this school
    const year = await db.AcademicYear.findOne({
      where: { id: term.academicYearId, schoolId: req.user.schoolId },
    });
    if (!year) return res.status(403).json({ message: 'Not authorized' });

    const { termNumber, startDate, endDate, isCurrent } = req.body;

    if (isCurrent) {
      await db.Term.update(
        { isCurrent: false },
        { where: { academicYearId: term.academicYearId } }
      );
    }

    await term.update({ termNumber, startDate, endDate, isCurrent });
    res.json(term);
  } catch (err) {
    console.error('Update term error:', err);
    res.status(500).json({ message: 'Failed to update term' });
  }
};

// DELETE term
// DELETE /api/terms/:id
exports.delete = async (req, res) => {
  try {
    const term = await db.Term.findByPk(req.params.id);
    if (!term) return res.status(404).json({ message: 'Term not found' });

    const year = await db.AcademicYear.findOne({
      where: { id: term.academicYearId, schoolId: req.user.schoolId },
    });
    if (!year) return res.status(403).json({ message: 'Not authorized' });

    await term.destroy();
    res.json({ message: 'Term deleted' });
  } catch (err) {
    console.error('Delete term error:', err);
    res.status(500).json({ message: 'Failed to delete term' });
  }
};