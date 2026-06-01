const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware'); 
const studentController = require('../controllers/student.controller');
const { validateCreateStudent, validateUpdateStudent } = require('../validators/student.validator');

router.use(authenticate);

// ─── Student portal (logged-in student viewing their own data) ─
router.get('/me/subjects',     studentController.getMySubjects);
router.get('/me/homework',      studentController.getMyHomework);
router.get('/me/homework/:id',  studentController.getMyHomeworkOne);
router.get('/me/submissions',      studentController.getMySubmissions);
router.get('/me/submissions/:id',  studentController.getMySubmissionOne);
router.get('/me/lessons',             studentController.getMyLessons);
router.get('/me/lessons/:id',         studentController.getMyLesson);
router.post('/me/lessons/:id/read',   studentController.markLessonRead);
router.post('/me/lessons/:id/respond', studentController.respondToLesson);
router.get('/me/results',       studentController.getMyResults);
router.get('/me/results/:id',  studentController.getMyResultOne);
router.get('/me/attendance',      studentController.getMyAttendance);
router.get('/me/attendance/:id',  studentController.getMyAttendanceOne);

// ─── Admin/teacher: view a specific student's academic data ───
router.get('/:id/subjects',    studentController.getStudentSubjects);
router.get('/:id/results',     studentController.getStudentResults);
router.get('/:id/attendance',  studentController.getStudentAttendance);
router.get('/:id/homework',    studentController.getStudentHomework);

// ─── Admin / teacher management ───────────────────────────────
router.get('/', studentController.getAll);
router.get('/:id', studentController.getOne);
router.post('/', validateCreateStudent, studentController.create);
router.put('/:id', validateUpdateStudent, studentController.update);
router.delete('/:id', studentController.remove);

module.exports = router;