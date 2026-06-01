const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const db = require('../models');

const User = db.User;
const School = db.School;

const STAFF = [
  { firstName: 'Tendai', lastName: 'Moyo', role: 'teacher', phone: '+263 712 111 001' },
  { firstName: 'Simba', lastName: 'Dube', role: 'teacher', phone: '+263 712 111 002' },
  { firstName: 'Farai', lastName: 'Chiweshe', role: 'teacher', phone: '+263 712 111 003' },
  { firstName: 'Blessing', lastName: 'Ncube', role: 'teacher', phone: '+263 712 111 004' },
  { firstName: 'Rudo', lastName: 'Ndlovu', role: 'teacher', phone: '+263 712 111 005' },
  { firstName: 'Tatenda', lastName: 'Mhaka', role: 'teacher', phone: '+263 712 111 006' },
  { firstName: 'Nomsa', lastName: 'Sibanda', role: 'teacher', phone: '+263 712 111 007' },
];

const seedStaff = async () => {
  try {
    await db.sequelize.authenticate();
    console.log('✅ Database connected');

    // Get first school
    const school = await School.findOne();
    if (!school) {
      console.error('❌ No school found. Register a school first.');
      process.exit(1);
    }

    console.log(`🏫 Seeding staff for: ${school.name}`);

    const salt = await bcrypt.genSalt(10);
    const defaultPassword = 'Teacher@123';
    const hashedPassword = await bcrypt.hash(defaultPassword, salt);

    let created = 0;
    let skipped = 0;

    for (const member of STAFF) {
      const email = `${member.firstName.toLowerCase()}.${member.lastName.toLowerCase()}@${school.email.split('@')[1]}`;

      const existing = await User.findOne({ where: { email } });
      if (existing) {
        console.log(`⏭ Skipped (already exists): ${email}`);
        skipped++;
        continue;
      }

      await User.create({
        schoolId: school.id,
        firstName: member.firstName,
        lastName: member.lastName,
        email,
        password: hashedPassword,
        phone: member.phone,
        role: member.role,
        isVerified: true,
        isActive: true,
        verificationToken: null,
      });

      console.log(`✅ Created: ${member.firstName} ${member.lastName} — ${email}`);
      created++;
    }

    console.log(`\n🎉 Done! Created: ${created}, Skipped: ${skipped}`);
    console.log(` Default password for all seeded staff: ${defaultPassword}`);
  } catch (error) {
    console.error('❌ Seeder failed:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  seedStaff()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = seedStaff;