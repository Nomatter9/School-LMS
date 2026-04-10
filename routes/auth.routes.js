const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const {
  validateRegisterSchool,
  validateLogin,
  validateChangePassword,
  validateForgotPassword,
  validateResetPassword,
  validateUpdateProfile,
  validateUpdateSchool,
} = require('../validators/auth.validator');
const { authenticate } = require('../middleware/auth.middleware');
const { uploadLogo,uploadAvatar, handleUploadError } = require('../middleware/upload.middleware');


// ─── Public Routes ────────────────────────────────────────────
router.post('/school/register', uploadLogo, handleUploadError, validateRegisterSchool, authController.registerSchool);
router.post('/login', validateLogin, authController.login);
router.post('/forgot-password', validateForgotPassword, authController.forgotPassword);
router.post('/reset-password', validateResetPassword, authController.resetPassword);
router.get('/verify-email', authController.verifyEmail); 
router.post('/resend-verification', authController.resendVerification);

// ─── Protected Routes ─────────────────────────────────────────
router.get('/me', authenticate, authController.getMe);
router.post('/logout', authenticate, authController.logout);
router.put('/change-password', authenticate, validateChangePassword, authController.changePassword);
router.put('/update-profile', authenticate, uploadLogo, handleUploadError, validateUpdateProfile, authController.updateProfile);
router.get('/school/me', authenticate, authController.getMySchool);
router.put('/school/me', authenticate, uploadLogo, handleUploadError, validateUpdateSchool, authController.updateMySchool);
router.get('/users', authenticate, authController.getUsers);

router.get('/staff', authenticate, authController.getStaff);
router.post('/staff', authenticate, authController.createStaff);
router.put('/staff/:id', authenticate, authController.updateStaff);
router.delete('/staff/:id', authenticate, authController.deleteStaff);
// ─── Parents ──────────────────────────────────────────────────
router.get('/parents', authenticate, authController.getParents);
router.post('/parents', authenticate, authController.createParent);
router.put('/parents/:id', authenticate, authController.updateParent);
router.delete('/parents/:id', authenticate, authController.deleteParent);

// ─── Avatar upload ────────────────────────────────────────────
router.put('/staff/:id/avatar',    authenticate, uploadAvatar, handleUploadError, authController.updateAvatar);
router.put('/students/:id/avatar', authenticate, uploadAvatar, handleUploadError, authController.updateAvatar);
router.put('/parents/:id/avatar',  authenticate, uploadAvatar, handleUploadError, authController.updateAvatar);
module.exports = router;
