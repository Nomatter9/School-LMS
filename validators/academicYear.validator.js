const { body } = require('express-validator');

exports.validateCreateAcademicYear = [
  body('year')
    .notEmpty().withMessage('Year is required')
    .isInt({ min: 2000, max: 2100 }).withMessage('Year must be a valid year'),
  body('isCurrent')
    .optional()
    .isBoolean().withMessage('isCurrent must be a boolean'),
];

exports.validateUpdateAcademicYear = [
  body('year')
    .optional()
    .isInt({ min: 2000, max: 2100 }).withMessage('Year must be a valid year'),
  body('isCurrent')
    .optional()
    .isBoolean().withMessage('isCurrent must be a boolean'),
];