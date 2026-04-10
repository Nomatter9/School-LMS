const { body } = require('express-validator');

exports.validateCreateStudent = [
  body('firstName').trim().notEmpty().withMessage('First name is required')
    .isLength({ min: 2, max: 100 }),
  body('lastName').trim().notEmpty().withMessage('Last name is required')
    .isLength({ min: 2, max: 100 }),
  body('email').trim().notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email').normalizeEmail(),
  body('phone').optional().trim().isLength({ max: 20 }),
  body('regNumber').optional().trim().isLength({ max: 50 }),
  body('dateOfBirth').optional().isDate().withMessage('Invalid date of birth'),
  body('gender').optional().isIn(['male', 'female']).withMessage('Gender must be male or female'),
  body('classId').optional({ nullable: true }).isUUID().withMessage('Invalid class ID'),
  body('parentId').optional({ nullable: true }).isUUID().withMessage('Invalid parent ID'),
];

exports.validateUpdateStudent = [
  body('firstName').optional().trim().notEmpty().withMessage('First name cannot be empty'),
  body('lastName').optional().trim().notEmpty().withMessage('Last name cannot be empty'),
  body('phone').optional().trim().isLength({ max: 20 }),
  body('regNumber').optional().trim().isLength({ max: 50 }),
  body('dateOfBirth').optional().isDate().withMessage('Invalid date of birth'),
  body('gender').optional().isIn(['male', 'female']).withMessage('Gender must be male or female'),
  body('classId').optional({ nullable: true }).isUUID().withMessage('Invalid class ID'),
  body('parentId').optional({ nullable: true }).isUUID().withMessage('Invalid parent ID'),
  body('isActive').optional().isBoolean(),
];