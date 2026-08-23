const { body, param, query } = require('express-validator');

exports.validateRegisterSchool = [
  // School fields
  body('schoolName').trim().notEmpty().withMessage('School name is required')
    .isLength({ min: 2, max: 150 }).withMessage('School name must be 2-150 characters'),

  body('address').trim().notEmpty().withMessage('Address is required'),

  body('province').trim().notEmpty().withMessage('Province is required')
    .isLength({ max: 100 }).withMessage('Province max 100 characters'),

  body('schoolPhone').trim().notEmpty().withMessage('School phone is required')
    .isLength({ max: 20 }).withMessage('Phone max 20 characters'),

  body('schoolEmail').trim().notEmpty().withMessage('School email is required')
    .isEmail().withMessage('Invalid school email').normalizeEmail(),

  // Headmaster fields
  body('firstName').trim().notEmpty().withMessage('First name is required')
    .isLength({ min: 2, max: 100 }).withMessage('First name must be 2-100 characters'),

  body('lastName').trim().notEmpty().withMessage('Last name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Last name must be 2-100 characters'),
];

exports.validateLogin = [
  body('email').trim().notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

exports.validateForgotPassword = [
  body('email').trim().notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email').normalizeEmail(),
];

exports.validateResetPassword = [
  body('token').notEmpty().withMessage('Token is required'),
  body('newPassword').notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/\d/).withMessage('Must contain at least one number')
    .matches(/[a-zA-Z]/).withMessage('Must contain at least one letter'),
];

exports.validateChangePassword = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').notEmpty().withMessage('New password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/\d/).withMessage('Must contain at least one number')
    .matches(/[a-zA-Z]/).withMessage('Must contain at least one letter')
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) throw new Error('New password must differ from current');
      return true;
    }),
];

exports.validateUpdateProfile = [
  body('firstName').optional().trim().notEmpty().withMessage('First name cannot be empty')
    .isLength({ min: 2, max: 100 }),
  body('lastName').optional().trim().notEmpty().withMessage('Last name cannot be empty')
    .isLength({ min: 2, max: 100 }),
  body('phone').optional().trim().isLength({ max: 20 }),
  body('schoolName').optional().trim().notEmpty().withMessage('School name cannot be empty'),
  body('address').optional().trim().notEmpty().withMessage('Address cannot be empty'),
  body('province').optional().trim().notEmpty().withMessage('Province cannot be empty'),
  body('schoolPhone').optional().trim().isLength({ max: 20 }),
];
exports.validateUpdateSchool = [
  body('name').optional().trim().notEmpty().withMessage('School name cannot be empty')
    .isLength({ min: 2, max: 150 }),
  body('address').optional().trim().notEmpty().withMessage('Address cannot be empty'),
  body('province').optional().trim().notEmpty().withMessage('Province cannot be empty')
    .isLength({ max: 100 }),
  body('phone').optional().trim().notEmpty().withMessage('Phone cannot be empty')
    .isLength({ max: 20 }),
  body('email').optional().trim().isEmail().withMessage('Invalid email').normalizeEmail(),
];

exports.validateSetPassword = [
  body('token').trim().notEmpty().withMessage('Token is required'),
  body('password').notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/\d/).withMessage('Must contain at least one number')
    .matches(/[a-zA-Z]/).withMessage('Must contain at least one letter'),
];

exports.validateVerifyEmail = [
  query('token').trim().notEmpty().withMessage('Verification token is required'),
];

exports.validateResendVerification = [
  body('email').trim().notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email').normalizeEmail(),
];

exports.validateIdParam = [
  param('id').isUUID().withMessage('Invalid id'),
];

exports.validateCreateStaff = [
  body('firstName').trim().notEmpty().withMessage('First name is required')
    .isLength({ min: 2, max: 100 }).withMessage('First name must be 2-100 characters'),
  body('lastName').trim().notEmpty().withMessage('Last name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Last name must be 2-100 characters'),
  body('email').trim().notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email').normalizeEmail(),
  body('phone').optional({ checkFalsy: true }).trim().isLength({ max: 20 }).withMessage('Phone max 20 characters'),
  body('role').optional().isIn(['admin', 'headmaster', 'teacher']).withMessage('Invalid role'),
  body('classId').optional({ checkFalsy: true }).isUUID().withMessage('Invalid class id'),
];

exports.validateUpdateStaff = [
  param('id').isUUID().withMessage('Invalid staff id'),
  body('firstName').optional().trim().notEmpty().withMessage('First name cannot be empty')
    .isLength({ min: 2, max: 100 }).withMessage('First name must be 2-100 characters'),
  body('lastName').optional().trim().notEmpty().withMessage('Last name cannot be empty')
    .isLength({ min: 2, max: 100 }).withMessage('Last name must be 2-100 characters'),
  body('phone').optional({ checkFalsy: true }).trim().isLength({ max: 20 }).withMessage('Phone max 20 characters'),
  body('role').optional().isIn(['admin', 'headmaster', 'teacher']).withMessage('Invalid role'),
  body('classId').optional({ checkFalsy: true }).isUUID().withMessage('Invalid class id'),
];

exports.validateCreateParent = [
  body('firstName').trim().notEmpty().withMessage('First name is required')
    .isLength({ min: 2, max: 100 }).withMessage('First name must be 2-100 characters'),
  body('lastName').trim().notEmpty().withMessage('Last name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Last name must be 2-100 characters'),
  body('email').trim().notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email').normalizeEmail(),
  body('phone').optional({ checkFalsy: true }).trim().isLength({ max: 20 }).withMessage('Phone max 20 characters'),
];

exports.validateUpdateParent = [
  param('id').isUUID().withMessage('Invalid parent id'),
  body('firstName').optional().trim().notEmpty().withMessage('First name cannot be empty')
    .isLength({ min: 2, max: 100 }).withMessage('First name must be 2-100 characters'),
  body('lastName').optional().trim().notEmpty().withMessage('Last name cannot be empty')
    .isLength({ min: 2, max: 100 }).withMessage('Last name must be 2-100 characters'),
  body('phone').optional({ checkFalsy: true }).trim().isLength({ max: 20 }).withMessage('Phone max 20 characters'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
];