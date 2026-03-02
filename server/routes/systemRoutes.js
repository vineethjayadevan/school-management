const express = require('express');
const router = express.Router();
const {
    loginSuperAdmin,
    getUsers,
    createUser,
    resetUserPassword,
    updateUser
} = require('../controllers/systemController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Super Admin Authentication
router.post('/login', loginSuperAdmin);

// Super Admin Capabilities (Protected)
router.route('/users')
    .get(protect, authorize('superadmin'), getUsers)
    .post(protect, authorize('superadmin'), createUser);

router.route('/users/:id')
    .patch(protect, authorize('superadmin'), updateUser);

router.route('/users/:id/reset-password')
    .put(protect, authorize('superadmin'), resetUserPassword);

module.exports = router;
