const db = require('../models');
const Subject = db.Subject;


exports.getAll = async (req, res) => {
  try {
    const subjects = await db.Subject.findAll({
      where: { schoolId: req.user.schoolId },
      include: [
        { model: db.Grade, as: 'grade' },
        {
          model: db.Class, as: 'class',
          include: [{ model: db.Grade, as: 'grade' }],
          required: false,
        },
      ],
      order: [[{ model: db.Grade, as: 'grade' }, 'level', 'ASC']],
    });
    res.json(subjects);
  } catch (err) {
    console.error('Get subjects error:', err);
    res.status(500).json({ message: 'Failed to fetch subjects' });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, code, gradeId, classId } = req.body;

    const subject = await db.Subject.create({
      schoolId: req.user.schoolId,
      name, code, gradeId,
      classId: classId || null,
    });

    // ✅ Auto-create ClassSubject and inherit class teacher
    if (classId) {
      const cls = await db.Class.findByPk(classId, { attributes: ['teacherId'] });

      await db.ClassSubject.findOrCreate({
        where: { classId, subjectId: subject.id },
        defaults: {
          classId,
          subjectId: subject.id,
          teacherId: cls?.teacherId || null,
        },
      });
    }

    const full = await db.Subject.findByPk(subject.id, {
      include: [
        { model: db.Grade, as: 'grade' },
        { model: db.Class, as: 'class', include: [{ model: db.Grade, as: 'grade' }], required: false },
      ],
    });
    res.status(201).json(full);
  } catch (err) {
    console.error('Create subject error:', err);
    res.status(500).json({ message: 'Failed to create subject' });
  }
};

exports.update = async (req, res) => {
  try {
    const subject = await db.Subject.findOne({
      where: { id: req.params.id, schoolId: req.user.schoolId },
    });
    if (!subject) return res.status(404).json({ message: 'Subject not found' });

    const { name, code, gradeId, classId } = req.body;
    const oldClassId = subject.classId;

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (code !== undefined) updates.code = code;
    if (gradeId !== undefined) updates.gradeId = gradeId;
    if (classId !== undefined) updates.classId = classId || null;

    await subject.update(updates);

    // ✅ If class changed, remove from old ClassSubject
    if (oldClassId && oldClassId !== classId) {
      await db.ClassSubject.destroy({
        where: { classId: oldClassId, subjectId: subject.id },
      });
    }

    // ✅ Create/update ClassSubject for new class
    if (classId) {
      const cls = await db.Class.findByPk(classId, { attributes: ['teacherId'] });

      const [cs, created] = await db.ClassSubject.findOrCreate({
        where: { classId, subjectId: subject.id },
        defaults: {
          classId,
          subjectId: subject.id,
          teacherId: cls?.teacherId || null,
        },
      });

      // If it existed but had no teacher, assign the class teacher
      if (!created && !cs.teacherId && cls?.teacherId) {
        await cs.update({ teacherId: cls.teacherId });
      }
    }

    const full = await db.Subject.findByPk(subject.id, {
      include: [
        { model: db.Grade, as: 'grade' },
        { model: db.Class, as: 'class', include: [{ model: db.Grade, as: 'grade' }], required: false },
      ],
    });
    res.json(full);
  } catch (err) {
    console.error('Update subject error:', err);
    res.status(500).json({ message: 'Failed to update subject' });
  }
};

exports.deleteSubject = async (req, res) => {
  try {
    const subject = await db.Subject.findOne({
      where: { id: req.params.id, schoolId: req.user.schoolId },
    });
    if (!subject) return res.status(404).json({ message: 'Subject not found' });

    await db.ClassSubject.destroy({ where: { subjectId: subject.id } });
    await subject.destroy();

    res.json({ message: 'Subject deleted successfully' });
  } catch (err) {
    console.error('Delete subject error:', err);
    res.status(500).json({ message: 'Failed to delete subject' });
  }
};