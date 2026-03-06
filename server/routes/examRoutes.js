const express = require('express');
const router = express.Router();
const {
    getExamCategories,
    createExamCategory,
    updateExamCategory,
    deleteExamCategory,
    getExamSchedules,
    createExamSchedule,
    deleteExamSchedule,
    getExamMarks,
    saveExamMarks,
    getStudentMarks
} = require('../controllers/examController');
const { protect, admin } = require('../middleware/authMiddleware');

// Categories
router.route('/categories')
    .get(protect, getExamCategories)
    .post(protect, admin, createExamCategory);

router.route('/categories/:id')
    .put(protect, admin, updateExamCategory)
    .delete(protect, admin, deleteExamCategory);

// Schedules
router.route('/schedules')
    .get(protect, getExamSchedules)
    .post(protect, createExamSchedule);

router.route('/schedules/:id')
    .delete(protect, deleteExamSchedule);

// Marks
router.route('/schedules/:scheduleId/marks')
    .get(protect, getExamMarks)
    .post(protect, saveExamMarks);

// Student Portal View
router.route('/student/:studentId')
    .get(protect, getStudentMarks);

module.exports = router;
