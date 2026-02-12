const express = require('express');
const router = express.Router();
const {
    createRevenue,
    createExpense,
    getRevenueEntries,
    getExpenseEntries,
    getReceivables,
    getPayables,
    getAccrualProfitAndLoss,
    getAccrualBalanceSheet
} = require('../controllers/accrualController');
const {
    createSettlement,
    getSettlements
} = require('../controllers/settlementController');
const { protect, authorize } = require('../middleware/authMiddleware');

const allowedRoles = authorize('board_member', 'superuser', 'admin');

// Revenue & Expense Recognition
router.route('/revenue')
    .get(protect, allowedRoles, getRevenueEntries)
    .post(protect, allowedRoles, createRevenue);

router.route('/expense')
    .get(protect, allowedRoles, getExpenseEntries)
    .post(protect, allowedRoles, createExpense);

// Receivables & Payables
router.route('/receivables')
    .get(protect, allowedRoles, getReceivables);

router.route('/payables')
    .get(protect, allowedRoles, getPayables);

// Settlements
router.route('/settlements')
    .get(protect, allowedRoles, getSettlements)
    .post(protect, allowedRoles, createSettlement);

// Reports
router.route('/pnl')
    .get(protect, allowedRoles, getAccrualProfitAndLoss);

router.route('/balance-sheet')
    .get(protect, allowedRoles, getAccrualBalanceSheet);

module.exports = router;
