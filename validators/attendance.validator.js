const { body } = require('express-validator');

exports.validateSaveAttendance = [
  body('classId').notEmpty().withMessage('Class is required').isUUID(),
  body('date').notEmpty().withMessage('Date is required').isDate().withMessage('Invalid date'),
  body('records').isArray({ min: 1 }).withMessage('Records are required'),
  body('records.*.pupilId').notEmpty().withMessage('Pupil ID is required').isUUID(),
  body('records.*.status').notEmpty().withMessage('Status is required')
    .isIn(['present', 'absent', 'late']).withMessage('Status must be present, absent or late'),
  body('records.*.notes').optional().trim(),
];