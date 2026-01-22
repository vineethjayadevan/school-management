const express = require('express');
const router = express.Router();
const { getFees, addFee, getStudentFees } = require('../controllers/feeController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getFees);
router.get('/student', protect, getStudentFees); // Important: Place before generic /:id routes if any (though here we don't have them yet)
router.post('/', protect, addFee);

module.exports = router;
