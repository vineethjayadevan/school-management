const express = require('express');
const router = express.Router();
const {
    getFinancialSummary,
    getExpenses,
    addExpense,
    deleteExpense,
    getOtherIncome,
    addOtherIncome,
    deleteOtherIncome
} = require('../controllers/financeController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Protection: Only 'board_member' and 'superuser' can access these routes. 
// 'admin' can also be allowed if transparency is required for school admins.
const allowedRoles = authorize('board_member', 'superuser', 'admin');

router.route('/summary').get(protect, allowedRoles, getFinancialSummary);

router.route('/expenses')
    .get(protect, allowedRoles, getExpenses)
    .post(protect, allowedRoles, addExpense);

router.route('/expenses/:id')
    .delete(protect, allowedRoles, deleteExpense);

router.route('/income')
    .get(protect, allowedRoles, getOtherIncome)
    .post(protect, allowedRoles, addOtherIncome);

router.route('/income/:id')
    .delete(protect, allowedRoles, deleteOtherIncome);

module.exports = router;
