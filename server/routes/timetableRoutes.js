const express = require('express');
const router = express.Router();
const {
    saveTimetable,
    getTimetable,
    getAllTimetables,
    deleteTimetable,
    getStudentTimetable,
    getTeacherSchedule
} = require('../controllers/timetableController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/all', protect, getAllTimetables);
router.get('/student/:studentId', protect, getStudentTimetable);
router.get('/teacher/:staffId', protect, getTeacherSchedule);
router.get('/', protect, getTimetable);
router.post('/', protect, admin, saveTimetable);
router.delete('/:id', protect, admin, deleteTimetable);

module.exports = router;
