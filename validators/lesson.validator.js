const { body } = require('express-validator');

exports.validateCreateLesson = [
  body('classSubjectId').notEmpty().withMessage('Subject is required').isUUID().withMessage('Invalid subject ID'),
  body('termId').notEmpty().withMessage('Term is required').isUUID().withMessage('Invalid term ID'),
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }).withMessage('Max 200 characters'),
  body('content').optional().trim(),
  body('videoUrl').optional().trim().isURL().withMessage('Invalid video URL'),
  body('weekNumber').optional().isInt({ min: 1, max: 20 }).withMessage('Week must be between 1 and 20'),
  body('isPublished').optional().isBoolean(),
];

exports.validateUpdateLesson = [
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty').isLength({ max: 200 }),
  body('content').optional().trim(),
  body('videoUrl').optional({ nullable: true }).trim(),
  body('weekNumber').optional().isInt({ min: 1, max: 20 }),
  body('isPublished').optional().isBoolean(),
];