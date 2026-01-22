const express = require('express');
const router = express.Router();
const {
    getStudents,
    getStudentById,
    createStudent,
    updateStudent,
    deleteStudent,
} = require('../controllers/studentController');

const { protect, admin } = require('../middleware/authMiddleware');

// Apply protect middleware to all routes
router.route('/').get(protect, getStudents).post(protect, createStudent);
router.route('/:id').get(protect, getStudentById).put(protect, updateStudent).delete(protect, admin, deleteStudent);

module.exports = router;
