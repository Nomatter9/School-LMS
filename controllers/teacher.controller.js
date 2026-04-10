const db = require('../models');

exports.getOverview = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const schoolId = req.user.schoolId;

    const [myClasses, mySubjects, pendingHomework] = await Promise.all([
      db.Class.findAll({
        where: { teacherId, schoolId },
        include: [
          { model: db.Grade, as: 'grade' },
          { model: db.AcademicYear, as: 'academicYear' },
          {
            model: db.Student, as: 'students',
            include: [{ model: db.User, as: 'user', attributes: ['id', 'firstName', 'lastName'] }],
          },
        ],
      }),
      db.ClassSubject.findAll({
        where: { teacherId },
        include: [
          { model: db.Subject, as: 'subject' },
          { model: db.Class, as: 'class', include: [{ model: db.Grade, as: 'grade' }] },
        ],
      }),
      db.Homework.count({
        where: { isPublished: true },
        include: [{
          model: db.ClassSubject, as: 'classSubject',
          where: { teacherId },
        }],
      }),
    ]);

    // Count total students across my classes
    const totalStudents = myClasses.reduce((acc, cls) => acc + (cls.students?.length || 0), 0);

    res.json({
      myClasses: myClasses.length,
      mySubjects: mySubjects.length,
      totalStudents,
      pendingHomework,
      classes: myClasses,
      subjects: mySubjects,
    });
  } catch (err) {
    console.error('Teacher overview error:', err);
    res.status(500).json({ message: 'Failed to load overview' });
  }
};

exports.getMyClasses = async (req, res) => {
  try {
    const classes = await db.Class.findAll({
      where: { teacherId: req.user.id, schoolId: req.user.schoolId },
      include: [
        { model: db.Grade, as: 'grade' },
        { model: db.AcademicYear, as: 'academicYear' },
        {
          model: db.Student, as: 'students',
          include: [{ model: db.User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] }],
        },
      ],
    });
    res.json(classes);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch classes' });
  }
};

exports.getClassStudents = async (req, res) => {
  try {
    const students = await db.Student.findAll({
      where: { classId: req.params.classId },
      include: [
        { model: db.User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email', 'isActive'] },
        { model: db.User, as: 'parent', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'] },
      ],
      order: [[{ model: db.User, as: 'user' }, 'firstName', 'ASC']],
    });
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch students' });
  }
};

exports.getMySubjects = async (req, res) => {
  try {
    const subjects = await db.ClassSubject.findAll({
      where: { teacherId: req.user.id },
      include: [
        { model: db.Subject, as: 'subject' },
        { model: db.Class, as: 'class', include: [{ model: db.Grade, as: 'grade' }] },
      ],
    });
    res.json(subjects);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch subjects' });
  }
};