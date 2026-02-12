const express = require('express');
const router = express.Router();
const {
    getFinancialSummary,
    getExpenses,
    addExpense,
    deleteExpense,
    getOtherIncome,
    addOtherIncome,
    deleteOtherIncome,
    getIncomeCategories,
    addIncomeCategory,
    getExpenseCategories,
    addExpenseCategory,
    updateExpense,
    updateOtherIncome,
    getTransactions,
    getShareholdersData,
    addSubcategory
} = require('../controllers/financeController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Protection: Only 'board_member' and 'superuser' can access these routes. 
// 'admin' can also be allowed if transparency is required for school admins.
// Debug Log
console.log('Finance Routes Loaded');

// Debug Route
router.get('/debug', (req, res) => res.send('Finance Routes Operational'));

const allowedRoles = authorize('board_member', 'superuser', 'admin');

router.route('/shareholders').get(protect, allowedRoles, getShareholdersData);

router.route('/transactions').get(protect, allowedRoles, getTransactions);

router.route('/summary').get(protect, allowedRoles, getFinancialSummary);

router.route('/expenses')
    .get(protect, allowedRoles, getExpenses)
    .post(protect, allowedRoles, addExpense);

router.route('/expenses/:id')
    .put(protect, allowedRoles, updateExpense)
    .delete(protect, allowedRoles, deleteExpense);

router.route('/income')
    .get(protect, allowedRoles, getOtherIncome)
    .post(protect, allowedRoles, addOtherIncome);

router.route('/income/:id')
    .put(protect, allowedRoles, updateOtherIncome)
    .delete(protect, allowedRoles, deleteOtherIncome);

router.route('/categories')
    .get(protect, allowedRoles, getIncomeCategories)
    .post(protect, allowedRoles, addIncomeCategory);

router.route('/expense-categories')
    .get(protect, allowedRoles, getExpenseCategories)
    .post(protect, allowedRoles, addExpenseCategory);

router.route('/categories/:type/:id/subcategories')
    .post(protect, allowedRoles, addSubcategory);

module.exports = router;
