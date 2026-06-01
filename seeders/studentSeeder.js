const bcrypt = require('bcryptjs');
const db = require('../models');

const seedStudents = async (schoolId) => {
  if (!schoolId) {
    await db.sequelize.authenticate();
    const school = await db.School.findOne();
    if (!school) {
      console.error('❌ No school found. Register a school via the app first.');
      process.exit(1);
    }
    schoolId = school.id;
  }

  const salt = await bcrypt.genSalt(10);

  const classes = await db.Class.findAll({ where: { schoolId } });
  if (classes.length === 0) {
    throw new Error('No classes found. Run seed:classes first.');
  }
  const classId = classes[0].id;

  const parent = await db.User.findOne({ where: { schoolId, role: 'parent' } });

  const students = [
    { firstName: 'Tafara',  lastName: 'Moyo',  email: `tafara.moyo@demo.thuto.lms`,    gender: 'male',   regNumber: 'REG001' },
    { firstName: 'Chiedza', lastName: 'Dube',  email: `chiedza.dube@demo.thuto.lms`,   gender: 'female', regNumber: 'REG002' },
    { firstName: 'Tinashe', lastName: 'Ncube', email: `tinashe.ncube@demo.thuto.lms`,  gender: 'male',   regNumber: 'REG003' },
  ];

  let created = 0;
  for (const s of students) {
    const existing = await db.User.findOne({ where: { email: s.email } });
    if (existing) { console.log(`⏭ Skipped (exists): ${s.email}`); continue; }

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

    console.log(`✅ Created student: ${s.firstName} ${s.lastName}`);
    created++;
  }

  console.log(`✅ Students seeded (${created} created)`);
};

if (require.main === module) {
  seedStudents()
    .then(() => process.exit(0))
    .catch((err) => { console.error('❌ Student seeder failed:', err); process.exit(1); });
}

module.exports = seedStudents;
