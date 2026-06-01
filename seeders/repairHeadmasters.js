const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const db = require('../models');

const repair = async () => {
  await db.sequelize.authenticate();
  console.log('✅ Database connected\n');

  const schools = await db.School.findAll();
  if (!schools.length) {
    console.log('❌ No schools found.');
    process.exit(1);
  }

  const salt = await bcrypt.genSalt(10);
  let fixed = 0;

  for (const school of schools) {
    const headmaster = await db.User.findOne({
      where: { schoolId: school.id, role: 'headmaster' },
      paranoid: false,
    });

    if (headmaster) {
      if (headmaster.deletedAt) {
        await headmaster.restore();
        console.log(`♻️  Restored soft-deleted headmaster for ${school.name} — ${school.email}`);
        fixed++;
      } else {
        console.log(`✅ OK — ${school.name} already has a headmaster (${headmaster.email})`);
      }
      continue;
    }

    // No headmaster at all — create one
    const tempPassword = crypto.randomBytes(6).toString('hex');
    const hashedPassword = await bcrypt.hash(tempPassword, salt);

    await db.User.create({
      schoolId: school.id,
      firstName: 'Headmaster',
      lastName: school.name,
      email: school.email,
      password: hashedPassword,
      phone: school.phone || null,
      role: 'headmaster',
      isVerified: true,
      isActive: true,
      verificationToken: null,
    });

    console.log(`\n🔧 Created headmaster for: ${school.name}`);
    console.log(`   Email:    ${school.email}`);
    console.log(`   Password: ${tempPassword}  ← change this after login\n`);
    fixed++;
  }

  console.log(`\n🎉 Done. Fixed ${fixed} school(s).`);
};

repair()
  .then(() => process.exit(0))
  .catch((err) => { console.error('❌ Repair failed:', err); process.exit(1); });
