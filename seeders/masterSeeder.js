const db = require('../models');
const seedGrades     = require('./gradeSeeder');
const setCurrentYear = require('./currentYearSeeder');
const seedTerms      = require('./termSeeder');
const seedStaff      = require('./staffSeeder');
const seedSubjects   = require('./subjectSeeder');
const seedClasses    = require('./classesSeeder');
const seedStudents   = require('./studentSeeder');

const runAll = async () => {
  await db.sequelize.authenticate();
  console.log('✅ Database connected\n');

  const school = await db.School.findOne();
  if (!school) {
    console.error('❌ No school found. Register a school via the app first, then run this seeder.');
    process.exit(1);
  }

  console.log(`🏫 Seeding all data for: ${school.name}\n`);
  const schoolId = school.id;

  await seedGrades(schoolId);
  await setCurrentYear(schoolId);
  await seedTerms(schoolId);
  await seedStaff();
  await seedSubjects(schoolId);
  await seedClasses(schoolId);
  await seedStudents(schoolId);

  console.log('\n🎉 All seeders completed successfully!');
};

runAll()
  .then(() => process.exit(0))
  .catch((err) => { console.error('❌ Master seeder failed:', err); process.exit(1); });
