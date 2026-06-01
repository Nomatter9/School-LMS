const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const subjectController = require('../controllers/subject.controller');

const adminOnly = (req, res, next) => {
  if (!['headmaster', 'admin'].includes(req.user?.role)) {
    return res.status(403).json({ message: 'Access denied' });
  }
  next();
};

// ✅ GET open to all
router.get('/',      authenticate, subjectController.getAll);
router.post('/',     authenticate, adminOnly, subjectController.create);
router.put('/:id',   authenticate, adminOnly, subjectController.update);
router.delete('/:id',authenticate, adminOnly, subjectController.deleteSubject);

module.exports = router;