const db = require('../models');

const setCurrentYear = async (schoolId) => {
  if (!schoolId) {
    await db.sequelize.authenticate();
    const school = await db.School.findOne();
    if (!school) {
      console.error('❌ No school found. Register a school via the app first.');
      process.exit(1);
    }
    schoolId = school.id;
  }

  await db.AcademicYear.update({ isCurrent: false }, { where: { schoolId } });

  const [year, created] = await db.AcademicYear.findOrCreate({
    where: { schoolId, year: 2026 },
    defaults: { schoolId, year: 2026, isCurrent: true },
  });

  if (!created) await year.update({ isCurrent: true });

  console.log(`✅ 2026 set as current academic year (${created ? 'created' : 'updated'})`);
};

if (require.main === module) {
  setCurrentYear()
    .then(() => process.exit(0))
    .catch((err) => { console.error('❌ Year seeder failed:', err); process.exit(1); });
}

module.exports = setCurrentYear;
