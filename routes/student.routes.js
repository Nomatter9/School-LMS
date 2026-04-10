const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware'); 
const studentController = require('../controllers/student.controller');
const { validateCreateStudent, validateUpdateStudent } = require('../validators/student.validator');

router.use(authenticate);

router.get('/', studentController.getAll);
router.get('/:id', studentController.getOne);
router.post('/', validateCreateStudent, studentController.create);
router.put('/:id', validateUpdateStudent, studentController.update);
router.delete('/:id', studentController.remove);

module.exports = router;