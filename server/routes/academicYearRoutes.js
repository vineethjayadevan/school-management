const express = require('express');
const router = express.Router();
const {
    getAcademicYears,
    createAcademicYear,
    updateAcademicYear,
    deleteAcademicYear
} = require('../controllers/academicYearController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, getAcademicYears)
    .post(protect, admin, createAcademicYear);

router.route('/:id')
    .put(protect, admin, updateAcademicYear)
    .delete(protect, admin, deleteAcademicYear);

module.exports = router;
