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
  const subjects = DEFAULT_SUBJECTS.map((name, index) => ({
    schoolId,
    name,
    code: name.substring(0, 4).toUpperCase() + (index + 1),
  }));

  await db.Subject.bulkCreate(subjects, { ignoreDuplicates: true });
  console.log(`✅ Subjects seeded for school ${schoolId}`);
};

module.exports = seedSubjects;