const express = require('express');
const router = express.Router();
const { getTeacherAssignments, createAssignment, getStudentAssignments } = require('../controllers/assignmentController');
const { protect } = require('../middleware/authMiddleware');

router.get('/teacher', protect, getTeacherAssignments);
router.get('/student', protect, getStudentAssignments);
router.post('/', protect, createAssignment);

module.exports = router;
