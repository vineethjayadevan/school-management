const express = require('express');
const router = express.Router();
const StaffCategory = require('../models/StaffCategory');
const { protect } = require('../middleware/authMiddleware');

// @desc    Get all staff categories
// @route   GET /api/staff-categories
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const categories = await StaffCategory.find({ isActive: true });
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Create a new staff category
// @route   POST /api/staff-categories
// @access  Private
router.post('/', protect, async (req, res) => {
    try {
        const { name, subcategories, isTeaching } = req.body;
        const categoryExists = await StaffCategory.findOne({ name });

        if (categoryExists) {
            return res.status(400).json({ message: 'Category already exists' });
        }

        const category = await StaffCategory.create({
            name,
            subcategories,
            isTeaching
        });

        res.status(201).json(category);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// @desc    Update a staff category
// @route   PUT /api/staff-categories/:id
// @access  Private
router.put('/:id', protect, async (req, res) => {
    try {
        const category = await StaffCategory.findById(req.params.id);

        if (category) {
            category.name = req.body.name || category.name;
            category.subcategories = req.body.subcategories || category.subcategories;
            category.isTeaching = req.body.isTeaching !== undefined ? req.body.isTeaching : category.isTeaching;

            const updatedCategory = await category.save();
            res.json(updatedCategory);
        } else {
            res.status(404).json({ message: 'Category not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// @desc    Delete a staff category
// @route   DELETE /api/staff-categories/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
    try {
        const category = await StaffCategory.findById(req.params.id);

        if (category) {
            await category.deleteOne();
            res.json({ message: 'Category removed' });
        } else {
            res.status(404).json({ message: 'Category not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
