const db = require('../models');

const GRADES = [
  { level: 1, label: 'Grade 1' },
  { level: 2, label: 'Grade 2' },
  { level: 3, label: 'Grade 3' },
  { level: 4, label: 'Grade 4' },
  { level: 5, label: 'Grade 5' },
  { level: 6, label: 'Grade 6' },
  { level: 7, label: 'Grade 7' },
];

const seedGrades = async (schoolId) => {
  if (!schoolId) {
    await db.sequelize.authenticate();
    const school = await db.School.findOne();
    if (!school) {
      console.error('❌ No school found. Register a school via the app first.');
      process.exit(1);
    }
    schoolId = school.id;
  }

  let created = 0;
  for (const grade of GRADES) {
    const [, wasCreated] = await db.Grade.findOrCreate({
      where: { schoolId, level: grade.level },
      defaults: { schoolId, level: grade.level, label: grade.label },
    });
    if (wasCreated) created++;
  }
  console.log(`✅ Grades seeded (${created} created, ${GRADES.length - created} skipped)`);
};

if (require.main === module) {
  seedGrades()
    .then(() => process.exit(0))
    .catch((err) => { console.error('❌ Grade seeder failed:', err); process.exit(1); });
}

module.exports = seedGrades;

