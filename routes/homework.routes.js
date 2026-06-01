const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { uploadFile, handleUploadError } = require('../middleware/upload.middleware');
const homeworkController = require('../controllers/homework.controller');

const teacherOnly = (req, res, next) => {
  if (!['teacher', 'headmaster', 'admin'].includes(req.user?.role)) {
    return res.status(403).json({ message: 'Access denied' });
  }
  next();
};

const pupilOnly = (req, res, next) => {
  if (req.user?.role !== 'pupil') {
    return res.status(403).json({ message: 'Access denied' });
  }
  next();
};

router.get('/',     authenticate, homeworkController.getAll);
router.get('/:id',  authenticate, homeworkController.getOne);
router.post('/',    authenticate, teacherOnly, uploadFile, handleUploadError, homeworkController.create);
router.put('/:id',  authenticate, teacherOnly, uploadFile, handleUploadError, homeworkController.update);
router.delete('/:id', authenticate, teacherOnly, homeworkController.remove);

// Student submits homework
router.post('/:id/submit', authenticate, pupilOnly, uploadFile, handleUploadError, homeworkController.submitHomework);

// Teacher views all submissions for a homework
router.get('/:id/submissions', authenticate, teacherOnly, homeworkController.getSubmissions);

// Teacher views a single submission
router.get('/:hwId/submissions/:subId', authenticate, teacherOnly, homeworkController.getSubmission);

// Teacher deletes a submission
router.delete('/:hwId/submissions/:subId', authenticate, teacherOnly, homeworkController.deleteSubmission);

// Grade a student submission
router.put('/:hwId/submissions/:subId/grade', authenticate, teacherOnly, homeworkController.gradeSubmission);

module.exports = router;
