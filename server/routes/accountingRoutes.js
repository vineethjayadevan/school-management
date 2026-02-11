const express = require('express');
const router = express.Router();
const {
    getBalanceSheet,
    addAsset,
    getAssets,
    addAdjustment,
    getAdjustments,
    getProfitAndLoss,
    deleteAdjustment
} = require('../controllers/accountingController');
const { protect, authorize } = require('../middleware/authMiddleware');

const allowedRoles = authorize('board_member', 'superuser', 'admin');

router.get('/pnl', protect, allowedRoles, getProfitAndLoss);
router.get('/balance-sheet', protect, allowedRoles, getBalanceSheet);

router.route('/assets')
    .get(protect, allowedRoles, getAssets)
    .post(protect, allowedRoles, addAsset);

router.route('/adjustments')
    .get(protect, allowedRoles, getAdjustments)
    .post(protect, allowedRoles, addAdjustment);

router.route('/adjustments/:id')
    .delete(protect, allowedRoles, deleteAdjustment);

module.exports = router;
