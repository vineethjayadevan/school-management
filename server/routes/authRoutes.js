const express = require('express');
const router = express.Router();
const { loginUser, logoutUser, getMe, updatePassword } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.get('/me', protect, getMe);
router.put('/change-password', protect, updatePassword);

module.exports = router;
