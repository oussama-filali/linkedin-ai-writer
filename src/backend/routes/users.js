const express = require('express');
const userController = require('../controllers/user-controller');
const authenticate = require('../middlewares/authenticate');

const router = express.Router();

router.get('/preferences', authenticate, userController.getPreferences);
router.patch('/preferences', authenticate, userController.updatePreferences);

// RGPD : export des données + suppression du compte (protégés par auth)
router.get('/export', authenticate, userController.exportData);
router.delete('/me', authenticate, userController.deleteAccount);

module.exports = router;
