const express = require('express');
const router = express.Router();
const { createUser, getUsers } = require('../controllers/userController');
const { protect, superuser } = require('../middleware/authMiddleware');

router.route('/')
    .post(protect, superuser, createUser)
    .get(protect, superuser, getUsers);

module.exports = router;
