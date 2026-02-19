const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const { getSalariesByMonth, paySalary, getSalarySummary, getSalarySlip } = require('../controllers/salaryController');

router.get('/', protect, admin, getSalariesByMonth);
router.get('/summary', protect, admin, getSalarySummary);
router.put('/:id/pay', protect, admin, paySalary);
router.get('/:id/download', protect, admin, getSalarySlip);

module.exports = router;
