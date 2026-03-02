const express = require('express');
const router = express.Router();
const {
    markStaffAttendance,
    getDayStaffAttendance,
    getStaffAttendanceSummary
} = require('../controllers/staffAttendanceController');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/mark', protect, admin, markStaffAttendance);
router.get('/day', protect, admin, getDayStaffAttendance);
router.get('/summary', protect, admin, getStaffAttendanceSummary);

module.exports = router;
