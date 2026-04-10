const db = require('../models');

const seedClasses = async () => {
  try {
    await db.sequelize.authenticate();
    console.log(' Database connected');

    const school = await db.School.findOne();
    if (!school) { console.error(' No school found'); process.exit(1); }

    const currentYear = await db.AcademicYear.findOne({
      where: { schoolId: school.id, isCurrent: true },
    });
    if (!currentYear) { console.error(' No current academic year found. Run seed:year first'); process.exit(1); }

    const grades = await db.Grade.findAll({
      where: { schoolId: school.id },
      order: [['level', 'ASC']],
    });
    if (grades.length === 0) { console.error(' No grades found. Run seed:grades first'); process.exit(1); }

    const CLASSES = [
      { gradeName: 'Grade 1', classes: ['1A', '1B'] },
      { gradeName: 'Grade 2', classes: ['2A', '2B'] },
      { gradeName: 'Grade 3', classes: ['3A', '3B'] },
      { gradeName: 'Grade 4', classes: ['4A', '4B'] },
      { gradeName: 'Grade 5', classes: ['5A', '5B'] },
      { gradeName: 'Grade 6', classes: ['6A', '6B'] },
      { gradeName: 'Grade 7', classes: ['7A', '7B'] },
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
        const [cls, wasCreated] = await db.Class.findOrCreate({
          where: {
            schoolId: school.id,
            gradeId: grade.id,
            academicYearId: currentYear.id,
            name: className,
          },
          defaults: {
            schoolId: school.id,
            gradeId: grade.id,
            academicYearId: currentYear.id,
            name: className,
            teacherId: null,
          },
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
  } catch (error) {
    console.error('Seeder failed:', error);
    process.exit(1);
  }
};

module.exports =seedClasses;