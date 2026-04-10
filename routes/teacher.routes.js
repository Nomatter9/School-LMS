const express = require('express');
const router = express.Router();
// teacher.routes.js — complete
const { authenticate } = require('../middleware/auth.middleware');
const { uploadFile, handleUploadError } = require('../middleware/upload.middleware');

const teacherController    = require('../controllers/teacher.controller');
const lessonController     = require('../controllers/lesson.controller');
const homeworkController   = require('../controllers/homework.controller');
const attendanceController = require('../controllers/attendance.controller');
const assessmentController = require('../controllers/assessment.controller');

const { validateCreateLesson, validateUpdateLesson }          = require('../validators/lesson.validator');
const { validateCreateHomework, validateUpdateHomework, validateGradeSubmission } = require('../validators/homework.validator');
const { validateSaveAttendance }                              = require('../validators/attendance.validator');
const { validateCreateAssessment, validateUpdateAssessment, validateSaveResults } = require('../validators/assessment.validator');

router.use(authenticate);

// ── Teacher overview ──────────────────────────────────────────
router.get('/overview',                     teacherController.getOverview);
router.get('/classes',                      teacherController.getMyClasses);
router.get('/classes/:classId/students',    teacherController.getClassStudents);
router.get('/subjects',                     teacherController.getMySubjects);

// ── Lessons ───────────────────────────────────────────────────
router.get('/lessons',        lessonController.getAll);
router.get('/lessons/:id',    lessonController.getOne);
router.post('/lessons',       uploadFile, handleUploadError, validateCreateLesson,  lessonController.create);
router.put('/lessons/:id',    uploadFile, handleUploadError, validateUpdateLesson,  lessonController.update);
router.delete('/lessons/:id', lessonController.remove);

// ── Homework ──────────────────────────────────────────────────
router.get('/homework',       homeworkController.getAll);
router.get('/homework/:id',   homeworkController.getOne);
router.post('/homework',      uploadFile, handleUploadError, validateCreateHomework, homeworkController.create);
router.put('/homework/:id',   uploadFile, handleUploadError, validateUpdateHomework, homeworkController.update);
router.delete('/homework/:id',homeworkController.remove);
router.put('/homework/:hwId/submissions/:subId/grade', validateGradeSubmission, homeworkController.gradeSubmission);

// ── Attendance ────────────────────────────────────────────────
router.get('/attendance/:classId',          attendanceController.getByClass);
router.get('/attendance/:classId/report',   attendanceController.getReport);
router.post('/attendance',                  validateSaveAttendance, attendanceController.save);

// ── Assessments ───────────────────────────────────────────────
router.get('/assessments',          assessmentController.getAll);
router.get('/assessments/:id',      assessmentController.getOne);
router.post('/assessments',         validateCreateAssessment, assessmentController.create);
router.put('/assessments/:id',      validateUpdateAssessment, assessmentController.update);
router.delete('/assessments/:id',   assessmentController.remove);
router.post('/assessments/:id/results', validateSaveResults,  assessmentController.saveResults);

module.exports = router;