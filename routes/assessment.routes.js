const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const assessmentController = require('../controllers/assessment.controller');

const teacherOnly = (req, res, next) => {
  if (!['teacher', 'headmaster', 'admin'].includes(req.user?.role)) {
    return res.status(403).json({ message: 'Access denied' });
  }
  next();
};

router.get('/',     authenticate, assessmentController.getAll);
router.get('/:id',  authenticate, assessmentController.getOne);
router.post('/',    authenticate, teacherOnly, assessmentController.create);
router.put('/:id',  authenticate, teacherOnly, assessmentController.update);
router.delete('/:id', authenticate, teacherOnly, assessmentController.remove);

// Save/update student results for an assessment
router.post('/:id/results', authenticate, teacherOnly, assessmentController.saveResults);

module.exports = router;
