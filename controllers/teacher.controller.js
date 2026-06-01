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
exports.getMySubjects = async (req, res) => {
  try {
    const teacherId = req.user.id;
    const schoolId  = req.user.schoolId;

    // ── Source 1: ClassSubject.teacherId = me ─────────────
    const byTeacherId = await db.ClassSubject.findAll({
      where: { teacherId },
      include: [
        { model: db.Subject, as: 'subject', include: [{ model: db.Grade, as: 'grade' }] },
        { model: db.Class,   as: 'class',   include: [{ model: db.Grade, as: 'grade' }] },
      ],
    });

    // ── Source 2: Class.teacherId = me ────────────────────
    const myDirectClasses = await db.Class.findAll({
      where: { teacherId, schoolId },
      attributes: ['id', 'gradeId'],
    });

    let byDirectClass = [];
    if (myDirectClasses.length > 0) {
      byDirectClass = await db.ClassSubject.findAll({
        where: { classId: myDirectClasses.map(c => c.id) },
        include: [
          { model: db.Subject, as: 'subject', include: [{ model: db.Grade, as: 'grade' }] },
          { model: db.Class,   as: 'class',   include: [{ model: db.Grade, as: 'grade' }] },
        ],
      });
    }

    // ── Source 3: User.classId ────────────────────────────
    const teacher = await db.User.findByPk(teacherId, { attributes: ['classId'] });
    let byUserClassId = [];
    if (teacher?.classId) {
      byUserClassId = await db.ClassSubject.findAll({
        where: { classId: teacher.classId },
        include: [
          { model: db.Subject, as: 'subject', include: [{ model: db.Grade, as: 'grade' }] },
          { model: db.Class,   as: 'class',   include: [{ model: db.Grade, as: 'grade' }] },
        ],
      });
    }

    // ── Source 4: Subjects with classId matching teacher's classes ─
    // This catches subjects assigned to SAME class but ClassSubject not created yet
    let bySubjectClassId = [];
    if (myDirectClasses.length > 0) {
      const classIds = myDirectClasses.map(c => c.id);
      if (teacher?.classId) classIds.push(teacher.classId);

      const subjectsWithClass = await db.Subject.findAll({
        where: { 
          classId: classIds,
          schoolId,
        },
        include: [
          { model: db.Grade, as: 'grade' },
          { model: db.Class, as: 'class', include: [{ model: db.Grade, as: 'grade' }] },
        ],
      });

      // Convert Subject records to ClassSubject-like shape for frontend
      // Also ensure ClassSubject records exist
      for (const subject of subjectsWithClass) {
        const [cs] = await db.ClassSubject.findOrCreate({
          where: { classId: subject.classId, subjectId: subject.id },
          defaults: {
            classId: subject.classId,
            subjectId: subject.id,
            teacherId,  // ✅ assign this teacher
          },
        });
        // Update teacherId if not set
        if (!cs.teacherId) {
          await cs.update({ teacherId });
        }
        bySubjectClassId.push(await db.ClassSubject.findByPk(cs.id, {
          include: [
            { model: db.Subject, as: 'subject', include: [{ model: db.Grade, as: 'grade' }] },
            { model: db.Class,   as: 'class',   include: [{ model: db.Grade, as: 'grade' }] },
          ],
        }));
      }
    }

    // ── Deduplicate all sources ────────────────────────────
    const map = new Map();
    [...byTeacherId, ...byDirectClass, ...byUserClassId, ...bySubjectClassId]
      .filter(Boolean)
      .forEach(cs => map.set(cs.id, cs));

    res.json(Array.from(map.values()));
  } catch (err) {
    console.error('Get teacher subjects error:', err);
    res.status(500).json({ message: 'Failed to fetch subjects' });
  }
};
// GET /teacher/classes — returns classes this teacher is assigned to
exports.getMyClasses = async (req, res) => {
  try {
    const teacherId = req.user.id;

    // Classes where teacher is directly assigned
    const directClasses = await db.Class.findAll({
      where: { teacherId, schoolId: req.user.schoolId },
      include: [
        { model: db.Grade, as: 'grade' },
        { model: db.Student, as: 'students', include: [{ model: db.User, as: 'user' }] },
      ],
    });

    // Classes via User.classId
    const teacher = await db.User.findByPk(teacherId, { attributes: ['classId'] });
    let fromUserClassId = [];
    if (teacher?.classId) {
      const cls = await db.Class.findByPk(teacher.classId, {
        include: [
          { model: db.Grade, as: 'grade' },
          { model: db.Student, as: 'students', include: [{ model: db.User, as: 'user' }] },
        ],
      });
      if (cls) fromUserClassId = [cls];
    }

    // Classes via ClassSubject.teacherId
    const subjectClasses = await db.ClassSubject.findAll({
      where: { teacherId },
      include: [{
        model: db.Class,
        as: 'class',
        include: [
          { model: db.Grade, as: 'grade' },
          { model: db.Student, as: 'students', include: [{ model: db.User, as: 'user' }] },
        ],
      }],
    });

    // Deduplicate
    const classMap = new Map();
    directClasses.forEach(c => classMap.set(c.id, c));
    fromUserClassId.forEach(c => classMap.set(c.id, c));
    subjectClasses.forEach(cs => {
      if (cs.class && !classMap.has(cs.class.id)) {
        classMap.set(cs.class.id, cs.class);
      }
    });

    res.json(Array.from(classMap.values()));
  } catch (err) {
    console.error('Get teacher classes error:', err);
    res.status(500).json({ message: 'Failed to fetch classes' });
  }
};

// GET /teacher/classes/:classId/students
exports.getClassStudents = async (req, res) => {
  try {
    const students = await db.Student.findAll({
      where: { classId: req.params.classId },
      include: [
        {
          model: db.User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'isActive', 'avatarUrl'],
        },
        {
          model: db.User,
          as: 'parent',
          attributes: ['id', 'firstName', 'lastName', 'email', 'phone'],
          required: false,   // ✅ LEFT JOIN — don't exclude students without parents
        },
      ],
      order: [[{ model: db.User, as: 'user' }, 'firstName', 'ASC']],
    });

    console.log("Students found:", students.length, "for classId:", req.params.classId);
    console.log("First student:", JSON.stringify(students[0]?.toJSON(), null, 2));

    res.json(students);
  } catch (err) {
    console.error('Get class students error:', err);
    res.status(500).json({ message: 'Failed to fetch students' });
  }
};
