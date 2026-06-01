const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const db = require('../models');

const schools = [
  {
    schoolName: 'Mqolweni Primary School',
    address: '456 Church Street',
    province: 'Matebeleland South',
    schoolPhone: '00263987654321',
    schoolEmail: 'info@mqolweni.com',
    firstName: 'Jane',
    lastName: 'Smith',
  },
];

const register = async () => {
  await db.sequelize.authenticate();
  console.log('✅ Database connected\n');

  const salt = await bcrypt.genSalt(10);

  for (const s of schools) {
    const existing = await db.School.findOne({ where: { email: s.schoolEmail } });
    if (existing) {
      console.log(`⏭  Skipped (already exists): ${s.schoolEmail}`);
      continue;
    }

    const generatedPassword = crypto.randomBytes(6).toString('hex');
    const hashedPassword = await bcrypt.hash(generatedPassword, salt);

    const school = await db.School.create({
      name: s.schoolName,
      address: s.address,
      province: s.province,
      phone: s.schoolPhone,
      email: s.schoolEmail,
    });

    await db.User.create({
      schoolId: school.id,
      firstName: s.firstName,
      lastName: s.lastName,
      email: s.schoolEmail,
      password: hashedPassword,
      phone: s.schoolPhone,
      role: 'headmaster',
      isVerified: true,
      isActive: true,
      verificationToken: null,
    });

    await db.User.create({
      schoolId: school.id,
      firstName: 'System',
      lastName: 'Admin',
      email: `admin.${school.id}@system.thuto.lms`,
      password: hashedPassword,
      role: 'admin',
      isActive: true,
      isVerified: true,
      verificationToken: null,
    });

    console.log(`✅ Registered: ${s.schoolName}`);
    console.log(`   Email:    ${s.schoolEmail}`);
    console.log(`   Password: ${generatedPassword}  ← change after first login\n`);
  }

  console.log('🎉 Done.');
};

register()
  .then(() => process.exit(0))
  .catch((err) => { console.error('❌ Failed:', err); process.exit(1); });
