const express = require('express');
const router = express.Router();
const {
    createQuestionPaper,
    getQuestionPapers,
    getQuestionPaperById,
    updateQuestionPaper,
    deleteQuestionPaper
} = require('../controllers/questionPaperController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
    .post(protect, createQuestionPaper)
    .get(protect, getQuestionPapers);

router.route('/:id')
    .get(protect, getQuestionPaperById)
    .put(protect, updateQuestionPaper)
    .delete(protect, deleteQuestionPaper);

module.exports = router;
