const express = require('express');
const router = express.Router();
const { getStaff, addStaff } = require('../controllers/staffController');

const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getStaff).post(protect, addStaff);

module.exports = router;
