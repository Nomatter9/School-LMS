const db = require('../models');
const seedGrades     = require('./gradeSeeder');
const setCurrentYear = require('./currentYearSeeder');
const seedTerms      = require('./termSeeder');
const seedStaff      = require('./staffSeeder');
const seedSubjects   = require('./subjectSeeder');
const seedClasses    = require('./classesSeeder');
const seedStudents   = require('./studentSeeder');

const run = async () => {
  console.log('⚠️  Dropping and recreating all tables...');
  await db.sequelize.sync({ force: true });
  console.log('✅ Database reset\n');

  const school = await db.School.findOne();
  if (!school) {
    console.error('❌ No school found. Register a school via the app, then run: npm run seed:all');
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

run()
  .then(() => process.exit(0))
  .catch((err) => { console.error('❌ Fresh seed failed:', err); process.exit(1); });
