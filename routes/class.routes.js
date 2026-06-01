const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const classController = require('../controllers/class.controller');  // ✅ actual import

const adminOnly = (req, res, next) => {
  if (!['headmaster', 'admin'].includes(req.user?.role)) {
    return res.status(403).json({ message: 'Access denied' });
  }
  next();
};

router.get('/',      authenticate, classController.getAll);
router.post('/',     authenticate, adminOnly, classController.create);
router.put('/:id',   authenticate, adminOnly, classController.update);
router.delete('/:id',authenticate, adminOnly, classController.remove);

module.exports = router;