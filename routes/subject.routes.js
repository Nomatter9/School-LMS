const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware'); 
const subjectController = require('../controllers/subject.controller');
const { validateCreateSubject ,validateUpdateSubject } = require('../validators/subject.validator');

router.use(authenticate);

router.get('/', subjectController.getAll);
router.post('/',validateCreateSubject, subjectController.create);
router.put('/:id',validateUpdateSubject, subjectController.update);
router.delete('/:id', subjectController.remove);

module.exports = router;