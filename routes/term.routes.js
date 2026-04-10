const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware'); 
const termController = require('../controllers/term.controller');

router.use(authenticate);
router.get('/', termController.getAllForSchool);
router.get('/:yearId', termController.getAll);
router.post('/', termController.create);
router.put('/:id', termController.update);
router.delete('/:id', termController.remove);

module.exports = router;