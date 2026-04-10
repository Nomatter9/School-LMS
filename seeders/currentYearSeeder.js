// seeders/currentYearSeeder.js
const db = require('../models');

const setCurrentYear = async () => {
  await db.sequelize.authenticate();
  const school = await db.School.findOne();
  
  // Set all to false first
  await db.AcademicYear.update({ isCurrent: false }, { where: { schoolId: school.id } });
  
  // Set 2026 as current (or whatever year you want)
  const [year, created] = await db.AcademicYear.findOrCreate({
    where: { schoolId: school.id, year: 2026 },
    defaults: { schoolId: school.id, year: 2026, isCurrent: true },
  });
  
  if (!created) await year.update({ isCurrent: true });
  
  console.log('2026 set as current academic year');
};

module.exports =setCurrentYear;