const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const termController = require('../controllers/term.controller');
const adminOnly = (req, res, next) => {
  if (!['headmaster', 'admin'].includes(req.user?.role)) {
    return res.status(403).json({ message: 'Access denied' });
  }
  next();
};

router.get('/', authenticate, termController.getAll);
router.post('/',     authenticate, adminOnly, termController.create);
router.put('/:id',   authenticate, adminOnly, termController.update);
router.delete('/:id',authenticate, adminOnly, termController.delete);

module.exports = router;