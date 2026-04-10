const { body } = require('express-validator');

exports.validateCreateTerm = [
  body('termNumber')
    .notEmpty().withMessage('Term number is required')
    .isInt({ min: 1, max: 3 }).withMessage('Term number must be 1, 2, or 3'),
  body('startDate')
    .notEmpty().withMessage('Start date is required')
    .isDate().withMessage('Start date must be a valid date'),
  body('endDate')
    .notEmpty().withMessage('End date is required')
    .isDate().withMessage('End date must be a valid date')
    .custom((endDate, { req }) => {
      if (new Date(endDate) <= new Date(req.body.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  body('isCurrent')
    .optional()
    .isBoolean().withMessage('isCurrent must be a boolean'),
];

exports.validateUpdateTerm = [
  body('termNumber')
    .optional()
    .isInt({ min: 1, max: 3 }).withMessage('Term number must be 1, 2, or 3'),
  body('startDate')
    .optional()
    .isDate().withMessage('Start date must be a valid date'),
  body('endDate')
    .optional()
    .isDate().withMessage('End date must be a valid date')
    .custom((endDate, { req }) => {
      if (req.body.startDate && new Date(endDate) <= new Date(req.body.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  body('isCurrent')
    .optional()
    .isBoolean().withMessage('isCurrent must be a boolean'),
];