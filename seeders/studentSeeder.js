const bcrypt = require('bcryptjs');
const db = require('../models');

const seedStudents = async (schoolId) => {
  try {
    const salt = await bcrypt.genSalt(10);

    // Get first class for this school
    const classes = await db.Class.findAll({ where: { schoolId } });
    const classId = classes[0]?.id || null;

    // Get a parent user
    const parent = await db.User.findOne({
      where: { schoolId, role: 'parent' }
    });

    const students = [
      { firstName: 'Tafara', lastName: 'Moyo', email: `student1.${schoolId}@demo.thuto.lms`, gender: 'male', regNumber: `REG001-${schoolId.slice(0, 4)}` },
      { firstName: 'Chiedza', lastName: 'Dube', email: `student2.${schoolId}@demo.thuto.lms`, gender: 'female', regNumber: `REG002-${schoolId.slice(0, 4)}` },
      { firstName: 'Tinashe', lastName: 'Ncube', email: `student3.${schoolId}@demo.thuto.lms`, gender: 'male', regNumber: `REG003-${schoolId.slice(0, 4)}` },
    ];

    for (const s of students) {
      const hashedPassword = await bcrypt.hash('student123', salt);
      const user = await db.User.create({
        schoolId,
        firstName: s.firstName,
        lastName: s.lastName,
        email: s.email,
        password: hashedPassword,
        role: 'pupil',
        isVerified: true,
        isActive: true,
        verificationToken: null,
      });

      await db.Student.create({
        userId: user.id,
        classId,
        parentId: parent?.id || null,
        regNumber: s.regNumber,
        gender: s.gender,
        dateOfBirth: '2012-01-01',
      });
    }

    console.log(`✅ Students seeded for school ${schoolId}`);
  } catch (err) {
    console.error('Student seeder error:', err);
  }
};

module.exports = seedStudents;