const express = require('express');
const authController = require('../controllers/auth-controller');
const authenticate = require('../middlewares/authenticate');

const router = express.Router();

router.post('/supabase', authController.supabaseLogin);
router.post('/google', authController.googleLogin);
router.post('/resend-confirmation', authController.resendConfirmation);
router.get('/me', authenticate, authController.getProfile);
router.post('/logout', authenticate, authController.logout);

module.exports = router;
