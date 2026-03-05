const express = require('express');
const router = express.Router();
const { createUser, getUsers, getUsersList, getUnlinkedProfiles, updateUser } = require('../controllers/userController');
const { protect, superuser, authorize } = require('../middleware/authMiddleware');

router.route('/')
    .post(protect, superuser, createUser)
    .get(protect, superuser, getUsers);

router.route('/list')
    .get(protect, authorize('superuser', 'admin', 'board_member'), getUsersList);

router.route('/unlinked-profiles')
    .get(protect, authorize('superuser', 'superadmin'), getUnlinkedProfiles);

router.route('/:id')
    .patch(protect, superuser, updateUser);

module.exports = router;
