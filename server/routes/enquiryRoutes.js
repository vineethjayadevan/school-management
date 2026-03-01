const express = require('express');
const router = express.Router();
const {
    createEnquiry,
    getEnquiries,
    updateEnquiryStatus,
    createSummerEnquiry,
    getSummerEnquiries
} = require('../controllers/enquiryController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/', createEnquiry);
router.post('/summer', createSummerEnquiry);
router.get('/', protect, authorize('superuser', 'office_staff', 'admin'), getEnquiries);
router.get('/summer', protect, authorize('superuser', 'office_staff', 'admin'), getSummerEnquiries);
router.put('/:id', protect, authorize('superuser', 'office_staff', 'admin'), updateEnquiryStatus);

module.exports = router;
