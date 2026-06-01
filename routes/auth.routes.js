const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const authController   = require('../controllers/auth.controller');
const schoolController = require('../controllers/school.controller');
const staffController  = require('../controllers/staff.controller');
const parentController = require('../controllers/parent.controller');

// ─── Rate Limiters ────────────────────────────────────────────
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Too many login attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const passwordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { message: 'Too many requests. Please try again in an hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const {
  validateRegisterSchool,
  validateLogin,
  validateChangePassword,
  validateForgotPassword,
  validateResetPassword,
  validateUpdateProfile,
  validateUpdateSchool,
} = require('../validators/auth.validator');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { uploadLogo, uploadAvatar, handleUploadError } = require('../middleware/upload.middleware');

// ─── Public Routes ────────────────────────────────────────────
router.post('/school/register', uploadLogo, handleUploadError, validateRegisterSchool, authController.registerSchool);
router.post('/login',              loginLimiter,    validateLogin,          authController.login);
router.post('/forgot-password',    passwordLimiter, validateForgotPassword, authController.forgotPassword);
router.post('/reset-password',     passwordLimiter, validateResetPassword,  authController.resetPassword);
router.post('/set-password',       passwordLimiter,                         authController.setPassword);
router.get('/verify-email',                                                  authController.verifyEmail);
router.post('/resend-verification', passwordLimiter,                        authController.resendVerification);

// ─── Auth / Profile ───────────────────────────────────────────
router.get('/me',              authenticate, authController.getMe);
router.put('/me',              authenticate, authController.updateMe);
router.post('/logout',         authenticate, authController.logout);
router.put('/change-password', authenticate, validateChangePassword,  authController.changePassword);
router.put('/update-profile',  authenticate, uploadLogo, handleUploadError, validateUpdateProfile, authController.updateProfile);
router.get('/users',           authenticate, authController.getUsers);

// ─── School ───────────────────────────────────────────────────
router.get('/school/me', authenticate, schoolController.getMySchool);
router.put('/school/me', authenticate, uploadLogo, handleUploadError, validateUpdateSchool, schoolController.updateMySchool);
router.put('/school/me/logo', authenticate, authorize('headmaster', 'admin'), uploadLogo, handleUploadError, schoolController.updateSchoolLogo);

// ─── Staff ────────────────────────────────────────────────────
router.get('/staff',        authenticate, authorize('headmaster', 'admin', 'teacher'), staffController.getStaff);
router.post('/staff',       authenticate, authorize('headmaster', 'admin'),            staffController.createStaff);
router.put('/staff/:id',    authenticate, authorize('headmaster', 'admin'),            staffController.updateStaff);
router.delete('/staff/:id', authenticate, authorize('headmaster', 'admin'),            staffController.deleteStaff);

// ─── Parents ──────────────────────────────────────────────────
router.get('/parents',        authenticate, authorize('headmaster', 'admin', 'teacher'), parentController.getParents);
router.post('/parents',       authenticate, authorize('headmaster', 'admin'),            parentController.createParent);
router.put('/parents/:id',    authenticate, authorize('headmaster', 'admin'),            parentController.updateParent);
router.delete('/parents/:id', authenticate, authorize('headmaster', 'admin'),            parentController.deleteParent);

// ─── Avatar / Logo uploads ────────────────────────────────────
router.put('/me/avatar',           authenticate,                              uploadAvatar, handleUploadError, authController.updateMyAvatar);
router.put('/staff/:id/avatar',    authenticate, authorize('headmaster', 'admin'), uploadAvatar, handleUploadError, staffController.updateStaffAvatar);
router.put('/students/:id/avatar', authenticate, authorize('headmaster', 'admin'), uploadAvatar, handleUploadError, staffController.updateStudentAvatar);
router.put('/parents/:id/avatar',  authenticate, authorize('headmaster', 'admin'), uploadAvatar, handleUploadError, parentController.updateParentAvatar);

module.exports = router;
