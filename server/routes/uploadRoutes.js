const express = require('express');
const router = express.Router();
const multer = require('multer');
const { uploadFile, deleteFile, getSignedUrl } = require('../controllers/uploadController');
const { protect } = require('../middleware/authMiddleware');

// Configure Multer for memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
});

router.post('/', protect, upload.single('file'), uploadFile);
router.delete('/', protect, deleteFile);
router.get('/signed-url', protect, getSignedUrl);

module.exports = router;
