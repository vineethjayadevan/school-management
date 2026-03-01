const express = require('express');
const router = express.Router();
const {
    getStudents,
    getStudentById,
    createStudent,
    updateStudent,
    deleteStudent,
    issueTC,
    checkTCEligibility,
    getStudentProfile,
} = require('../controllers/studentController');

const { protect, admin } = require('../middleware/authMiddleware');

// Apply protect middleware to all routes
router.route('/me').get(protect, getStudentProfile);
router.route('/').get(protect, getStudents).post(protect, createStudent);
router.route('/:id').get(protect, getStudentById).put(protect, updateStudent).delete(protect, admin, deleteStudent);
router.route('/:id/issue-tc').post(protect, admin, issueTC);
router.route('/:id/tc-eligibility').get(protect, admin, checkTCEligibility);

module.exports = router;
