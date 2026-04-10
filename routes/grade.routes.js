const express = require('express');
const router = express.Router();
const gradeController = require('../controllers/grade.controller');
const { validateCreateGrade ,validateUpdateGrade } = require('../validators/grade.validator');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/', gradeController.getAll);
router.post('/',validateCreateGrade, gradeController.create);
router.put('/:id',validateUpdateGrade, gradeController.update);
router.delete('/:id', gradeController.remove);

module.exports = router;