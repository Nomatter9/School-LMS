const jwt = require('jsonwebtoken');
const db = require('../models');

exports.authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await db.User.findByPk(decoded.id, {
      attributes: ['id', 'role', 'schoolId', 'isActive'],
    });

    if (!user) return res.status(401).json({ message: 'User not found' });
    if (!user.isActive) return res.status(403).json({ message: 'Account deactivated' });

    req.user = { id: user.id, role: user.role, schoolId: user.schoolId };
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') return res.status(401).json({ message: 'Token expired' });
    if (error.name === 'JsonWebTokenError') return res.status(401).json({ message: 'Invalid token' });
    console.error('AUTH ERROR:', error);
    res.status(500).json({ message: 'Authentication failed' });
  }
};

exports.authorize = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
  if (!roles.includes(req.user.role)) return res.status(403).json({ message: 'Access denied' });
  next();
};

exports.isAdmin = (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
  next();
};

exports.isHeadmaster = (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
  if (!['headmaster', 'admin'].includes(req.user.role)) return res.status(403).json({ message: 'Headmaster access required' });
  next();
};

exports.isTeacher = (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
  if (!['teacher', 'headmaster', 'admin'].includes(req.user.role)) return res.status(403).json({ message: 'Teacher access required' });
  next();
};