const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
    getFeeCategories,
    createFeeCategory,
    updateFeeCategory,
    deleteFeeCategory
} = require('../controllers/feeCategoryController');

// All fee categories routes require authentication
router.use(protect);

// Allow specific roles to manage fees instead of just 'admin'
const feeAdmin = authorize('admin', 'superuser', 'office');

router.route('/')
    .get(getFeeCategories)
    .post(feeAdmin, createFeeCategory);

router.route('/:id')
    .put(feeAdmin, updateFeeCategory)
    .delete(feeAdmin, deleteFeeCategory);

module.exports = router;
