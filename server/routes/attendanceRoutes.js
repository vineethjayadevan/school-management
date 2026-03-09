const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
    markAttendance,
    getAttendanceByClass,
    getStudentAttendance,
    getClassAttendanceSummary,
    notifyAbsentees
} = require('../controllers/attendanceController');

// All attendance routes are protected
router.use(protect);

// Teachers can mark and view class attendance
router.post('/mark', authorize('teacher', 'admin', 'superuser'), markAttendance);
router.post('/notify', authorize('teacher', 'admin', 'superuser'), notifyAbsentees);
router.get('/report/:className/:section', authorize('teacher', 'admin', 'superuser'), getClassAttendanceSummary);
router.get('/class/:className/:section', authorize('teacher', 'admin', 'superuser'), getAttendanceByClass);

// Students and teachers can view student-specific attendance
router.get('/student/:studentId', getStudentAttendance);

module.exports = router;
