const express = require('express');
const router = express.Router();
const { getMatrix, upsertMatrix, deleteMatrix } = require('../controllers/classSubjectMatrixController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/', protect, getMatrix);
router.post('/', protect, admin, upsertMatrix);
router.delete('/:id', protect, admin, deleteMatrix);

module.exports = router;
