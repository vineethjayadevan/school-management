const express = require('express');
const router = express.Router();
const Class = require('../models/Class');
const Subject = require('../models/Subject');
const { protect, admin } = require('../middleware/authMiddleware');

// ===========================
// CLASS ROUTES
// ===========================

// @desc    Get all classes
// @route   GET /api/academics/classes
// @access  Public (or Private?) - Let's keep it public for now or protected
router.get('/classes', async (req, res) => {
    try {
        // Sort by name nicely? Or maybe just return all
        // Native sort might be tricky with "Class 10" vs "Class 2" strings, but basic sort for now
        const classes = await Class.find({}).sort({ name: 1 });
        res.json(classes);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Create a new class
// @route   POST /api/academics/classes
// @access  Private/Admin
router.post('/classes', protect, admin, async (req, res) => {
    try {
        const { name, sections, subjects } = req.body;

        const classExists = await Class.findOne({ name });
        if (classExists) {
            return res.status(400).json({ message: 'Class already exists' });
        }

        const newClass = await Class.create({
            name,
            sections: sections || [],
            subjects: subjects || []
        });

        res.status(201).json(newClass);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// @desc    Update a class (e.g. add section)
// @route   PUT /api/academics/classes/:id
// @access  Private/Admin
router.put('/classes/:id', protect, admin, async (req, res) => {
    try {
        const { name, sections, subjects } = req.body;
        const cls = await Class.findById(req.params.id);

        if (cls) {
            cls.name = name || cls.name;
            if (sections) cls.sections = sections;
            if (subjects) cls.subjects = subjects;

            const updatedClass = await cls.save();
            res.json(updatedClass);
        } else {
            res.status(404).json({ message: 'Class not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Delete a class
// @route   DELETE /api/academics/classes/:id
// @access  Private/Admin
router.delete('/classes/:id', protect, admin, async (req, res) => {
    try {
        const cls = await Class.findById(req.params.id);
        if (cls) {
            await cls.deleteOne();
            res.json({ message: 'Class removed' });
        } else {
            res.status(404).json({ message: 'Class not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// ===========================
// SUBJECT ROUTES
// ===========================

// @desc    Get all subjects
// @route   GET /api/academics/subjects
// @access  Public
router.get('/subjects', async (req, res) => {
    try {
        const subjects = await Subject.find({}).sort({ name: 1 });
        res.json(subjects);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

// @desc    Create a new subject
// @route   POST /api/academics/subjects
// @access  Private/Admin
router.post('/subjects', protect, admin, async (req, res) => {
    try {
        const { name, code, type, description } = req.body;

        const subjectExists = await Subject.findOne({ code });
        if (subjectExists) {
            return res.status(400).json({ message: 'Subject code already exists' });
        }

        const subject = await Subject.create({
            name,
            code,
            type,
            description
        });

        res.status(201).json(subject);
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// @desc    Delete a subject
// @route   DELETE /api/academics/subjects/:id
// @access  Private/Admin
router.delete('/subjects/:id', protect, admin, async (req, res) => {
    try {
        const subject = await Subject.findById(req.params.id);
        if (subject) {
            await subject.deleteOne();
            res.json({ message: 'Subject removed' });
        } else {
            res.status(404).json({ message: 'Subject not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
