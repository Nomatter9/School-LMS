const { body } = require('express-validator');

exports.validateCreateClass = [
  body('name').trim().notEmpty().withMessage('Class name is required')
    .isLength({ max: 100 }).withMessage('Name max 100 characters'),
  body('gradeId').notEmpty().withMessage('Grade is required')
    .isUUID().withMessage('Invalid grade ID'),
  body('academicYearId').notEmpty().withMessage('Academic year is required')
    .isUUID().withMessage('Invalid academic year ID'),
  body('teacherId').optional({ nullable: true }).isUUID().withMessage('Invalid teacher ID'),
  body('capacity').optional({ nullable: true }).isInt({ min: 1 }).withMessage('Capacity must be positive'),
];

exports.validateUpdateClass = [
  body('name').optional().trim().notEmpty().withMessage('Class name cannot be empty'),
  body('gradeId').optional().isUUID().withMessage('Invalid grade ID'),
  body('academicYearId').optional().isUUID().withMessage('Invalid academic year ID'),
  body('teacherId').optional({ nullable: true }).isUUID().withMessage('Invalid teacher ID'),
  body('capacity').optional({ nullable: true }).isInt({ min: 1 }).withMessage('Capacity must be positive'),
];