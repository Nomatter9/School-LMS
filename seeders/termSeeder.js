const db = require('../models');

const seedTerms = async (schoolId) => {
  if (!schoolId) {
    await db.sequelize.authenticate();
    const school = await db.School.findOne();
    if (!school) {
      console.error('❌ No school found. Register a school via the app first.');
      process.exit(1);
    }
    schoolId = school.id;
  }

  const years = await db.AcademicYear.findAll({ where: { schoolId } });
  if (years.length === 0) {
    console.error('❌ No academic years found. Run seed:year first.');
    process.exit(1);
  }

  let created = 0;
  for (const year of years) {
    const terms = await db.Term.bulkCreate([
      {
        academicYearId: year.id,
        termNumber: 1,
        startDate: `${year.year}-01-15`,
        endDate: `${year.year}-04-10`,
        isCurrent: year.isCurrent,
      },
      {
        academicYearId: year.id,
        termNumber: 2,
        startDate: `${year.year}-05-05`,
        endDate: `${year.year}-08-08`,
        isCurrent: false,
      },
      {
        academicYearId: year.id,
        termNumber: 3,
        startDate: `${year.year}-09-01`,
        endDate: `${year.year}-12-05`,
        isCurrent: false,
      },
    ], { ignoreDuplicates: true });
    created += terms.length;
  }

  console.log(`✅ Terms seeded (${created} created)`);
};

if (require.main === module) {
  seedTerms()
    .then(() => process.exit(0))
    .catch((err) => { console.error('❌ Term seeder failed:', err); process.exit(1); });
}

module.exports = seedTerms;
