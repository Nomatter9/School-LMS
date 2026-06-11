const bcrypt = require('bcryptjs');
const db = require('../models');

const STUDENTS = [
  { firstName: 'Tafara',  lastName: 'Moyo',  gender: 'male',   regNumber: 'REG001' },
  { firstName: 'Chiedza', lastName: 'Dube',  gender: 'female', regNumber: 'REG002' },
  { firstName: 'Tinashe', lastName: 'Ncube', gender: 'male',   regNumber: 'REG003' },
];

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

  const school = await db.School.findByPk(schoolId);
  if (!school) throw new Error(`School not found: ${schoolId}`);

  const domain = school.email.split('@')[1];

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('student123', salt);

  const classes = await db.Class.findAll({ where: { schoolId } });
  if (classes.length === 0) {
    throw new Error('No classes found. Run seed:classes first.');
  }
  const classId = classes[0].id;

  const parent = await db.User.findOne({ where: { schoolId, role: 'parent' } });

  let created = 0;
  for (const s of STUDENTS) {
    const email = `${s.firstName.toLowerCase()}.${s.lastName.toLowerCase()}@${domain}`;

    const existing = await db.User.findOne({ where: { email } });
    if (existing) { console.log(`⏭ Skipped (exists): ${email}`); continue; }

    const user = await db.User.create({
      schoolId,
      firstName: s.firstName,
      lastName: s.lastName,
      email,
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

    console.log(`✅ Created student: ${s.firstName} ${s.lastName} — ${email}`);
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
