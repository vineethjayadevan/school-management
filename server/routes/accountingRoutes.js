const express = require('express');
const router = express.Router();
const {
    getProfitAndLoss,
    getBalanceSheet,
    addAsset,
    getAssets
} = require('../controllers/accountingController');
const { protect, authorize } = require('../middleware/authMiddleware');

const allowedRoles = authorize('board_member', 'superuser', 'admin');

router.route('/pnl')
    .get(protect, allowedRoles, getProfitAndLoss);

router.route('/balance-sheet')
    .get(protect, allowedRoles, getBalanceSheet);

router.route('/assets')
    .get(protect, allowedRoles, getAssets)
    .post(protect, allowedRoles, addAsset);

module.exports = router;
