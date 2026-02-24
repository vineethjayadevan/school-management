const express = require('express');
const router = express.Router();
const {
    getPromotionPreview,
    executePromotion
} = require('../controllers/promotionController');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/preview', protect, admin, getPromotionPreview);
router.post('/execute', protect, admin, executePromotion);

module.exports = router;
