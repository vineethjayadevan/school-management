const express = require('express');
const router = express.Router();
const { getTemplate, getAllTemplates, upsertTemplate, deleteTemplate } = require('../controllers/periodTemplateController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/all', protect, admin, getAllTemplates);
router.get('/', protect, getTemplate);
router.post('/', protect, admin, upsertTemplate);
router.delete('/:id', protect, admin, deleteTemplate);

module.exports = router;
