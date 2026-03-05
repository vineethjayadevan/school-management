const express = require('express');
const router = express.Router();
const {
    markStaffAttendance,
    getDayStaffAttendance,
    getStaffAttendanceSummary,
    getMyStaffAttendance
} = require('../controllers/staffAttendanceController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/my-attendance', protect, getMyStaffAttendance);
router.post('/mark', protect, admin, markStaffAttendance);
router.get('/day', protect, admin, getDayStaffAttendance);
router.get('/summary', protect, admin, getStaffAttendanceSummary);

module.exports = router;
