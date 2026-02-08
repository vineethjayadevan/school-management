const express = require('express');
const router = express.Router();
const {
    getProfitAndLoss,
    getBalanceSheet,
    addAsset,
    getAssets,
    addAdjustment,
    getAdjustments,
    deleteAdjustment
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

router.route('/adjustments')
    .get(protect, allowedRoles, getAdjustments)
    .post(protect, allowedRoles, addAdjustment);

router.route('/adjustments/:id')
    .delete(protect, allowedRoles, deleteAdjustment);

module.exports = router;
