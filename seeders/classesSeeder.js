const db = require('../models');

const seedClasses = async (schoolId) => {
  if (!schoolId) {
    const school = await db.School.findOne();
    if (!school) throw new Error('No school found');
    schoolId = school.id;
  }

  const currentYear = await db.AcademicYear.findOne({
    where: { schoolId, isCurrent: true },
  });
  if (!currentYear) throw new Error('No current academic year found. Run seed:year first');

  const grades = await db.Grade.findAll({
    where: { schoolId },
    order: [['level', 'ASC']],
  });
  if (grades.length === 0) throw new Error('No grades found. Run seed:grades first');

  const CLASSES = [
    { gradeName: 'Grade 1', classes: ['A', 'B'] },
    { gradeName: 'Grade 2', classes: ['A', 'B'] },
    { gradeName: 'Grade 3', classes: ['A', 'B'] },
    { gradeName: 'Grade 4', classes: ['A', 'B'] },
    { gradeName: 'Grade 5', classes: ['A', 'B'] },
    { gradeName: 'Grade 6', classes: ['A', 'B'] },
    { gradeName: 'Grade 7', classes: ['A', 'B'] },
  ];

  let created = 0;
  let skipped = 0;

  for (const entry of CLASSES) {
    const grade = grades.find((g) => g.label === entry.gradeName);
    if (!grade) {
      console.log(`⚠ Grade not found: ${entry.gradeName} — skipping`);
      continue;
    }

    for (const className of entry.classes) {
      const [, wasCreated] = await db.Class.findOrCreate({
        where: { schoolId, gradeId: grade.id, academicYearId: currentYear.id, name: className },
        defaults: { schoolId, gradeId: grade.id, academicYearId: currentYear.id, name: className, teacherId: null },
      });

      if (wasCreated) {
        console.log(` Created: ${className} (${entry.gradeName})`);
        created++;
      } else {
        console.log(`⏭ Skipped (exists): ${className} (${entry.gradeName})`);
        skipped++;
      }
    }
  }

  console.log(`\n🎉 Done! Created: ${created}, Skipped: ${skipped}`);
};

if (require.main === module) {
  seedClasses()
    .then(() => process.exit(0))
    .catch((err) => { console.error('Seeder failed:', err); process.exit(1); });
}

module.exports = seedClasses;
