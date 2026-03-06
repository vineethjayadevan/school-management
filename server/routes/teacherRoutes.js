const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
    getTeacherStats,
    getTeacherClasses,
    getClassStudents,
    getTeacherSalaryHistory,
    getTeacherProfile,
    getClassMarks
} = require('../controllers/teacherController');

// All routes are protected and for teachers only
router.use(protect);
router.use(authorize('teacher'));

router.get('/stats', getTeacherStats);
router.get('/classes', getTeacherClasses);
router.get('/classes/:className/:sectionName/students', getClassStudents);
router.get('/classes/:className/:sectionName/marks', getClassMarks);
router.get('/salary-history', getTeacherSalaryHistory);
router.get('/profile', getTeacherProfile);

module.exports = router;
