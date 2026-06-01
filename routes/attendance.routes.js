const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const attendanceController = require('../controllers/attendance.controller');

const teacherOnly = (req, res, next) => {
  if (!['teacher', 'headmaster', 'admin'].includes(req.user?.role)) {
    return res.status(403).json({ message: 'Access denied' });
  }
  next();
};

router.get('/class/:classId', authenticate, attendanceController.getByClass);
router.get('/report',         authenticate, attendanceController.getReport);
router.post('/',              authenticate, teacherOnly, attendanceController.save);

module.exports = router;
