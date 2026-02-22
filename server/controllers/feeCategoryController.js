const FeeCategory = require('../models/FeeCategory');

// @desc    Get all fee categories
// @route   GET /api/fee-categories
// @access  Private
const getFeeCategories = async (req, res) => {
    try {
        const categories = await FeeCategory.find().sort({ name: 1 });
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create new fee category
// @route   POST /api/fee-categories
// @access  Private (Admin only)
const createFeeCategory = async (req, res) => {
    try {
        const { name, amounts, description, isActive, hasSlabs, baseAmount, slabMultiplier, months } = req.body;

        const categoryExists = await FeeCategory.findOne({ name });
        if (categoryExists) {
            return res.status(400).json({ message: 'Fee category with this name already exists' });
        }

        const category = await FeeCategory.create({
            name,
            amounts: amounts || [],
            description,
            isActive: isActive !== undefined ? isActive : true,
            hasSlabs: hasSlabs || false,
            baseAmount: Number(baseAmount) || 0,
            slabMultiplier: Number(slabMultiplier) || 0,
            months: Number(months) || 10
        });

        res.status(201).json(category);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update fee category
// @route   PUT /api/fee-categories/:id
// @access  Private (Admin only)
const updateFeeCategory = async (req, res) => {
    try {
        const { name, amounts, description, isActive, hasSlabs, baseAmount, slabMultiplier, months } = req.body;

        const category = await FeeCategory.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ message: 'Fee category not found' });
        }

        if (name && name !== category.name) {
            const categoryExists = await FeeCategory.findOne({ name });
            if (categoryExists) {
                return res.status(400).json({ message: 'Fee category with this name already exists' });
            }
            category.name = name;
        }

        if (amounts !== undefined) category.amounts = amounts;
        if (description !== undefined) category.description = description;
        if (isActive !== undefined) category.isActive = isActive;
        if (hasSlabs !== undefined) category.hasSlabs = hasSlabs;
        if (baseAmount !== undefined) category.baseAmount = Number(baseAmount);
        if (slabMultiplier !== undefined) category.slabMultiplier = Number(slabMultiplier);
        if (months !== undefined) category.months = Number(months);

        const updatedCategory = await category.save();
        res.json(updatedCategory);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete fee category
// @route   DELETE /api/fee-categories/:id
// @access  Private (Admin only)
const deleteFeeCategory = async (req, res) => {
    try {
        const category = await FeeCategory.findById(req.params.id);

        if (!category) {
            return res.status(404).json({ message: 'Fee category not found' });
        }

        await category.deleteOne();
        res.json({ message: 'Fee category removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getFeeCategories,
    createFeeCategory,
    updateFeeCategory,
    deleteFeeCategory
};
