const express = require('express');
const userController = require('../controllers/user-controller');
const authenticate = require('../middlewares/authenticate');

const router = express.Router();

router.get('/preferences', authenticate, userController.getPreferences);
router.patch('/preferences', authenticate, userController.updatePreferences);

module.exports = router;
