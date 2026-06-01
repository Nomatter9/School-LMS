const db = require('../models');

const DEFAULT_SUBJECTS = [
  'Mathematics',
  'English Language',
  'Shona',
  'Ndebele',
  'Science and Technology',
  'Social Studies',
  'Religious and Moral Education',
  'Physical Education',
  'Art and Craft',
  'Music',
];

const seedSubjects = async (schoolId) => {
  if (!schoolId) {
    await db.sequelize.authenticate();
    const school = await db.School.findOne();
    if (!school) {
      console.error('❌ No school found. Register a school via the app first.');
      process.exit(1);
    }
    schoolId = school.id;
  }

  const grades = await db.Grade.findAll({ where: { schoolId } });
  if (grades.length === 0) {
    console.error('❌ No grades found. Run seed:grade first.');
    process.exit(1);
  }

  let created = 0;
  for (const grade of grades) {
    const subjects = DEFAULT_SUBJECTS.map((name, index) => ({
      schoolId,
      gradeId: grade.id,
      name,
      code: `${name.substring(0, 3).toUpperCase()}${grade.level}${index + 1}`,
    }));
    const result = await db.Subject.bulkCreate(subjects, { ignoreDuplicates: true });
    created += result.length;
  }

  console.log(`✅ Subjects seeded — ${created} records created across ${grades.length} grades`);
};

if (require.main === module) {
  seedSubjects()
    .then(() => process.exit(0))
    .catch((err) => { console.error('❌ Subject seeder failed:', err); process.exit(1); });
}

module.exports = seedSubjects;
