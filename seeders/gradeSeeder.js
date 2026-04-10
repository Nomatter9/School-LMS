const db = require('../models');

const seedGrades = async (schoolId) => {
  const grades = [
    { name: 'Grade 1', level: 1, schoolId },
    { name: 'Grade 2', level: 2, schoolId },
    { name: 'Grade 3', level: 3, schoolId },
    { name: 'Grade 4', level: 4, schoolId },
    { name: 'Grade 5', level: 5, schoolId },
    { name: 'Grade 6', level: 6, schoolId },
    { name: 'Grade 7', level: 7, schoolId },
  ];

  await db.Grade.bulkCreate(grades, { ignoreDuplicates: true });
  console.log(`✅ Grades seeded for school ${schoolId}`);
};

module.exports = seedGrades;