const express = require('express');
const router = express.Router();
const { createEnquiry, getEnquiries, updateEnquiryStatus } = require('../controllers/enquiryController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/', createEnquiry);
router.get('/', protect, authorize('superuser', 'office_staff', 'admin'), getEnquiries);
router.put('/:id', protect, authorize('superuser', 'office_staff', 'admin'), updateEnquiryStatus);

module.exports = router;
