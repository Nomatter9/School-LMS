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
    const { suffix, gradeId, teacherId, capacity } = req.body;

    if (!suffix || !gradeId) {
      return res.status(400).json({ message: 'suffix and gradeId are required' });
    }

    const grade = await db.Grade.findOne({ where: { id: gradeId, schoolId: req.user.schoolId } });
    if (!grade) return res.status(404).json({ message: 'Grade not found' });

    const name = suffix.trim().toUpperCase();

    const { academicYearId } = await getCurrentContext(req.user.schoolId);

    const newClass = await Class.create({
      schoolId: req.user.schoolId,
      name,
      gradeId,
      academicYearId,
      teacherId: teacherId || null,
      capacity: capacity !== undefined ? capacity : null,
    });

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
    const cls = await db.Class.findOne({
      where: { id: req.params.id, schoolId: req.user.schoolId },
    });
    if (!cls) return res.status(404).json({ message: 'Class not found' });

    const { suffix, gradeId, teacherId, capacity } = req.body;

    const updates = {};

    if (gradeId !== undefined) {
      const grade = await db.Grade.findOne({ where: { id: gradeId, schoolId: req.user.schoolId } });
      if (!grade) return res.status(404).json({ message: 'Grade not found' });
      updates.gradeId = gradeId;
    }

    if (suffix !== undefined) {
      updates.name = suffix.trim().toUpperCase();
    }

    if (teacherId !== undefined) updates.teacherId = teacherId || null;
    if (capacity !== undefined) updates.capacity = capacity;

    await cls.update(updates);

    // Reassign all ClassSubjects of this class to the new teacher
    if (teacherId !== undefined) {
      await db.ClassSubject.update(
        { teacherId: teacherId || null },
        { where: { classId: cls.id } }
      );
    }

    const updated = await db.Class.findByPk(cls.id, {
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