const express = require('express');
const router = express.Router();
const gradeController = require('../controllers/grade.controller');
const { validateCreateGrade ,validateUpdateGrade } = require('../validators/grade.validator');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);
const adminOnly = (req, res, next) => {
  if (!['headmaster', 'admin'].includes(req.user?.role)) {
    return res.status(403).json({ message: 'Access denied' });
  }
  next();
};

// GET open to all authenticated users
router.get('/', authenticate, gradeController.getAll);
// Write operations admin only
router.post('/',     authenticate, adminOnly, gradeController.create);
router.put('/:id',   authenticate, adminOnly, gradeController.update);
router.delete('/:id',authenticate, adminOnly, gradeController.remove);

module.exports = router;