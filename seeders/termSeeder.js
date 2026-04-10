const db = require('../models');

const seedTerms = async (schoolId) => {
  try {
    const years = await db.AcademicYear.findAll({
      where: { schoolId },
    });

    for (const year of years) {
      await db.Term.bulkCreate([
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
    }

    console.log(`✅ Terms seeded for school ${schoolId}`);
  } catch (err) {
    console.error('Term seeder error:', err);
  }
};

module.exports = seedTerms;