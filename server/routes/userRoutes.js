const express = require('express');
const router = express.Router();
const { createUser, getUsers, getUsersList } = require('../controllers/userController');
const { protect, superuser, authorize } = require('../middleware/authMiddleware');

router.route('/')
    .post(protect, superuser, createUser)
    .get(protect, superuser, getUsers);

router.route('/list')
    .get(protect, authorize('superuser', 'admin', 'board_member'), getUsersList);

module.exports = router;
