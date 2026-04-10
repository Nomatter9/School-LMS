const { body } = require('express-validator');

exports.validateCreateSubject = [
  body('name')
    .trim()
    .notEmpty().withMessage('Subject name is required')
    .isLength({ max: 100 }).withMessage('Subject name max 100 characters'),
  body('code')
    .trim()
    .notEmpty().withMessage('Subject code is required')
    .isLength({ max: 20 }).withMessage('Subject code max 20 characters')
    .toUpperCase(),
  body('gradeId')
    .notEmpty().withMessage('Grade is required')
    .isUUID().withMessage('Invalid grade ID'),
];

exports.validateUpdateSubject = [
  body('name')
    .optional()
    .trim()
    .notEmpty().withMessage('Subject name cannot be empty')
    .isLength({ max: 100 }).withMessage('Subject name max 100 characters'),
  body('code')
    .optional()
    .trim()
    .notEmpty().withMessage('Subject code cannot be empty')
    .isLength({ max: 20 }).withMessage('Subject code max 20 characters')
    .toUpperCase(),
  body('gradeId')
    .optional()
    .isUUID().withMessage('Invalid grade ID'),
];