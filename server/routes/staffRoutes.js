const express = require('express');
const router = express.Router();
const { getStaff, addStaff, updateStaff, deleteStaff } = require('../controllers/staffController');

const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getStaff).post(protect, addStaff);
router.route('/:id').put(protect, updateStaff).delete(protect, deleteStaff);

module.exports = router;
