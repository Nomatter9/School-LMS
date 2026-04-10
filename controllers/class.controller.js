const db = require('../models');
const Class = db.Class;

exports.getAll = async (req, res) => {
  try {
    const classes = await Class.findAll({
      where: { schoolId: req.user.schoolId },
      include: [
        { model: db.Grade, as: 'grade' },
        { model: db.AcademicYear, as: 'academicYear' },
        { model: db.User, as: 'teacher', attributes: ['id', 'firstName', 'lastName'] },
      ],
      order: [['name', 'ASC']],
    });
    res.json(classes);
  } catch (err) {
    console.error('Get classes error:', err);
    res.status(500).json({ message: 'Failed to fetch classes' });
  }
};

exports.getOne = async (req, res) => {
  try {
    const cls = await Class.findOne({
      where: { id: req.params.id, schoolId: req.user.schoolId },
      include: [
        { model: db.Grade, as: 'grade' },
        { model: db.AcademicYear, as: 'academicYear' },
        { model: db.User, as: 'teacher', attributes: ['id', 'firstName', 'lastName'] },
      ],
    });
    if (!cls) return res.status(404).json({ message: 'Class not found' });
    res.json(cls);
  } catch (err) {
    console.error('Get class error:', err);
    res.status(500).json({ message: 'Failed to fetch class' });
  }
};

const { getCurrentContext } = require('../utils/currentContext');

exports.create = async (req, res) => {
  try {
    const { name, gradeId, teacherId, capacity } = req.body;

    //  auto-get current academic year + term
    const { academicYearId } = await getCurrentContext(req.user.schoolId);

    const newClass = await Class.create({
      schoolId: req.user.schoolId,
      name,
      gradeId,
      academicYearId, //  no longer from frontend
      teacherId: teacherId || null,
      capacity: capacity !== undefined ? capacity : null,
    });

    // Fetch with associations
    const created = await Class.findByPk(newClass.id, {
      include: [
        { model: db.Grade, as: 'grade' },
        { model: db.AcademicYear, as: 'academicYear' },
        { model: db.User, as: 'teacher', attributes: ['id', 'firstName', 'lastName'] },
      ],
    });

    res.status(201).json(created);

  } catch (err) {
    console.error('Create class error:', err);
    if (err.message.includes('No current academic year')) {
      return res.status(400).json({ message: err.message });
    }

    res.status(500).json({ message: 'Failed to create class' });
  }
};

exports.update = async (req, res) => {
  try {
    const { name, gradeId, academicYearId, teacherId, capacity } = req.body;
    const cls = await Class.findOne({
      where: { id: req.params.id, schoolId: req.user.schoolId },
    });
    if (!cls) return res.status(404).json({ message: 'Class not found' });

    await cls.update({
      name,
      gradeId,
      academicYearId,
      teacherId: teacherId || null,
      capacity: capacity !== undefined ? capacity : null,
    });

    // Fetch updated with associations
    const updated = await Class.findByPk(cls.id, {
      include: [
        { model: db.Grade, as: 'grade' },
        { model: db.AcademicYear, as: 'academicYear' },
        { model: db.User, as: 'teacher', attributes: ['id', 'firstName', 'lastName'] },
      ],
    });

    res.json(updated);
  } catch (err) {
    console.error('Update class error:', err);
    res.status(500).json({ message: 'Failed to update class' });
  }
};

exports.remove = async (req, res) => {
  try {
    const cls = await Class.findOne({
      where: { id: req.params.id, schoolId: req.user.schoolId },
    });
    if (!cls) return res.status(404).json({ message: 'Class not found' });
    await cls.destroy();
    res.json({ message: 'Class deleted' });
  } catch (err) {
    console.error('Delete class error:', err);
    res.status(500).json({ message: 'Failed to delete class' });
  }
};