const { body } = require('express-validator');

exports.validateCreateAssessment = [
  body('classSubjectId').notEmpty().withMessage('Subject is required').isUUID(),
  body('termId').notEmpty().withMessage('Term is required').isUUID(),
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }),
  body('type').notEmpty().withMessage('Type is required').isIn(['ca', 'exam']).withMessage('Type must be ca or exam'),
  body('maxMarks').optional().isInt({ min: 1 }).withMessage('Max marks must be positive'),
  body('weightPercent').optional().isInt({ min: 1, max: 100 }).withMessage('Weight must be between 1 and 100'),
  body('date').optional().isDate().withMessage('Invalid date'),
];

exports.validateUpdateAssessment = [
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
  body('type').optional().isIn(['ca', 'exam']),
  body('maxMarks').optional().isInt({ min: 1 }),
  body('weightPercent').optional().isInt({ min: 1, max: 100 }),
  body('date').optional().isDate(),
];

exports.validateSaveResults = [
  body('results').isArray({ min: 1 }).withMessage('Results are required'),
  body('results.*.pupilId').notEmpty().withMessage('Pupil ID is required').isUUID(),
  body('results.*.marks').notEmpty().withMessage('Marks are required').isInt({ min: 0 }),
  body('results.*.remarks').optional().trim(),
];