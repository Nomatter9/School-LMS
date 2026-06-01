const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { uploadFile, handleUploadError } = require('../middleware/upload.middleware');
const lessonController = require('../controllers/lesson.controller');

const teacherOnly = (req, res, next) => {
  if (!['teacher', 'headmaster', 'admin'].includes(req.user?.role)) {
    return res.status(403).json({ message: 'Access denied' });
  }
  next();
};

router.get('/',     authenticate, lessonController.getAll);
router.get('/:id',  authenticate, lessonController.getOne);
router.post('/',    authenticate, teacherOnly, uploadFile, handleUploadError, lessonController.create);
router.put('/:id',  authenticate, teacherOnly, uploadFile, handleUploadError, lessonController.update);
router.delete('/:id', authenticate, teacherOnly, lessonController.remove);

// Teacher views all student progress/responses for a lesson
router.get('/:id/progress', authenticate, teacherOnly, lessonController.getLessonProgress);

module.exports = router;
