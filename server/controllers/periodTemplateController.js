const PeriodTemplate = require('../models/PeriodTemplate');

// @desc  Get template for an academic year
// @route GET /api/period-template?academicYear=:id
const getTemplate = async (req, res) => {
    try {
        const { academicYear } = req.query;
        const template = await PeriodTemplate.findOne({ academicYear }).populate('academicYear', 'name');
        res.json(template || null);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Get all templates
// @route GET /api/period-template/all
const getAllTemplates = async (req, res) => {
    try {
        const templates = await PeriodTemplate.find().populate('academicYear', 'name').sort({ createdAt: -1 });
        res.json(templates);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Create or update template for an academic year (upsert)
// @route POST /api/period-template
const upsertTemplate = async (req, res) => {
    try {
        const { academicYear, name, workingDays, slots } = req.body;
        if (!academicYear || !slots || slots.length === 0) {
            return res.status(400).json({ message: 'Academic year and at least one slot are required.' });
        }

        // Validate slot numbers are unique and sequential
        const slotNumbers = slots.map(s => s.slotNumber);
        if (new Set(slotNumbers).size !== slotNumbers.length) {
            return res.status(400).json({ message: 'Slot numbers must be unique.' });
        }

        const template = await PeriodTemplate.findOneAndUpdate(
            { academicYear },
            { name: name || 'Standard School Day', academicYear, workingDays, slots },
            { upsert: true, new: true, runValidators: true }
        );

        res.status(200).json(template);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Delete template
// @route DELETE /api/period-template/:id
const deleteTemplate = async (req, res) => {
    try {
        await PeriodTemplate.findByIdAndDelete(req.params.id);
        res.json({ message: 'Period template deleted.' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { getTemplate, getAllTemplates, upsertTemplate, deleteTemplate };
