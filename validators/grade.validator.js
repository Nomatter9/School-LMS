const { body } = require('express-validator');

exports.validateCreateGrade = [
  body('level')
    .notEmpty().withMessage('Level is required')
    .isInt({ min: 1, max: 7 }).withMessage('Level must be between 1 and 7'),
  body('label')
    .trim()
    .notEmpty().withMessage('Label is required')
    .isLength({ max: 20 }).withMessage('Label max 20 characters'),
];

exports.validateUpdateGrade = [
  body('level')
    .optional()
    .isInt({ min: 1, max: 7 }).withMessage('Level must be between 1 and 7'),
  body('label')
    .optional()
    .trim()
    .notEmpty().withMessage('Label cannot be empty')
    .isLength({ max: 20 }).withMessage('Label max 20 characters'),
];