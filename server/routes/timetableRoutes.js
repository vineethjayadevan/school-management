const express = require('express');
const router = express.Router();
const { getTeacherSchedule, getStudentSchedule } = require('../controllers/timetableController');
const { protect } = require('../middleware/authMiddleware');

router.get('/teacher', protect, getTeacherSchedule);
router.get('/student', protect, getStudentSchedule);

module.exports = router;
