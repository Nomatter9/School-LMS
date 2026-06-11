const bcrypt = require('bcryptjs');
const db = require('../models');

const STAFF = [
  { firstName: 'Tendai',   lastName: 'Moyo',     role: 'teacher', phone: '+263 712 111 001' },
  { firstName: 'Simba',    lastName: 'Dube',     role: 'teacher', phone: '+263 712 111 002' },
  { firstName: 'Farai',    lastName: 'Chiweshe', role: 'teacher', phone: '+263 712 111 003' },
  { firstName: 'Blessing', lastName: 'Ncube',    role: 'teacher', phone: '+263 712 111 004' },
  { firstName: 'Rudo',     lastName: 'Ndlovu',   role: 'teacher', phone: '+263 712 111 005' },
  { firstName: 'Tatenda',  lastName: 'Mhaka',    role: 'teacher', phone: '+263 712 111 006' },
  { firstName: 'Nomsa',    lastName: 'Sibanda',  role: 'teacher', phone: '+263 712 111 007' },
];

const seedStaff = async (schoolId) => {
  try {
    let school;
    if (schoolId) {
      school = await db.School.findByPk(schoolId);
    } else {
      await db.sequelize.authenticate();
      school = await db.School.findOne();
    }

    if (!school) {
      console.error('❌ No school found. Register a school first.');
      process.exit(1);
    }

    console.log(`🏫 Seeding staff for: ${school.name}`);

    const salt = await bcrypt.genSalt(10);
    const defaultPassword = 'Teacher@123';
    const hashedPassword = await bcrypt.hash(defaultPassword, salt);
    const domain = school.email.split('@')[1];

    let created = 0;
    let skipped = 0;

    for (const member of STAFF) {
      const email = `${member.firstName.toLowerCase()}.${member.lastName.toLowerCase()}@${domain}`;

      const existing = await db.User.findOne({ where: { email } });
      if (existing) {
        console.log(`⏭ Skipped (already exists): ${email}`);
        skipped++;
        continue;
      }

      await db.User.create({
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
    console.log(`   Default password for all seeded staff: ${defaultPassword}`);
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
