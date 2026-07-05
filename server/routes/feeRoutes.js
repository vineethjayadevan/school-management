const express = require('express');
const router = express.Router();
const { getFees, addFee, getStudentFees, downloadReceipt } = require('../controllers/feeController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getFees);
router.get('/student', protect, getStudentFees);
router.get('/:id/receipt', protect, downloadReceipt);
router.post('/', protect, addFee);

// @desc    Get fees for a specific student (Admin view)
router.get('/student/:id', protect, require('../controllers/feeController').getStudentFeesAdmin); // Use 'require' inline or destructured above

// @desc    Get vehicle fee balance
router.get('/vehicle-balance/:id', protect, require('../controllers/feeController').getVehicleFeeBalance);

module.exports = router;
