const express = require('express');
const router = express.Router();
const academicYearController = require('../controllers/academicYear.controller');
const { validateCreateAcademicYear, validateUpdateAcademicYear } = require('../validators/academicYear.validator');
const termController = require('../controllers/term.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/', academicYearController.getAll);
router.post('/', validateCreateAcademicYear,academicYearController.create);
router.put('/:id',validateUpdateAcademicYear, academicYearController.update);
router.delete('/:id', academicYearController.remove);

// Terms nested under academic years
router.get('/:yearId/terms', termController.getAll);
router.post('/:yearId/terms', termController.create);

module.exports = router;