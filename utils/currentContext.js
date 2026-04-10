// utils/currentContext.js
const db = require('../models');

exports.getCurrentContext = async (schoolId) => {
  const year = await db.AcademicYear.findOne({
    where: { schoolId, isCurrent: true },
    include: [{
      model: db.Term,
      as: 'terms',
      where: { isCurrent: true },
      required: false
    }]
  });

  if (!year) throw new Error("No current academic year set");

  return {
    academicYearId: year.id,
    termId: year.terms?.[0]?.id || null
  };
};