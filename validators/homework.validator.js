const { body } = require('express-validator');

exports.validateCreateHomework = [
  body('classSubjectId').notEmpty().withMessage('Subject is required').isUUID(),
  body('termId').notEmpty().withMessage('Term is required').isUUID(),
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }),
  body('description').optional().trim(),
  body('dueDate').notEmpty().withMessage('Due date is required').isDate().withMessage('Invalid date'),
  body('maxMarks').optional().isInt({ min: 1 }).withMessage('Max marks must be positive'),
  body('isPublished').optional().isBoolean(),
];

exports.validateUpdateHomework = [
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
  body('description').optional().trim(),
  body('dueDate').optional().isDate().withMessage('Invalid date'),
  body('maxMarks').optional().isInt({ min: 1 }),
  body('isPublished').optional().isBoolean(),
];

exports.validateGradeSubmission = [
  body('marks').notEmpty().withMessage('Marks are required').isInt({ min: 0 }).withMessage('Marks must be a positive number'),
  body('feedback').optional().trim(),
];