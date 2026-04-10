const express = require('express');
const router = express.Router();
const classController = require('../controllers/class.controller');
const { validateCreateClass, validateUpdateClass } = require('../validators/class.validator');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/', classController.getAll);
router.get('/:id', classController.getOne);
router.post('/', validateCreateClass, classController.create);
router.put('/:id', validateUpdateClass, classController.update);
router.delete('/:id', classController.remove);

module.exports = router;