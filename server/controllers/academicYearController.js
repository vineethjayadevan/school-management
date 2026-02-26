const AcademicYear = require('../models/AcademicYear');

// @desc    Get all academic years
// @route   GET /api/academic-years
// @access  Private (Admin)
const getAcademicYears = async (req, res) => {
    try {
        const years = await AcademicYear.find().sort({ startDate: -1 }).populate('createdBy', 'name');
        res.status(200).json(years);
    } catch (error) {
        console.error('Error fetching academic years:', error);
        res.status(500).json({ message: 'Server error fetching academic years' });
    }
};

// @desc    Create a new academic year
// @route   POST /api/academic-years
// @access  Private (Admin)
const createAcademicYear = async (req, res) => {
    try {
        const { name, startDate, endDate, isActive } = req.body;

        if (!name || !startDate || !endDate) {
            return res.status(400).json({ message: 'Please provide name, start date, and end date.' });
        }

        const existingYear = await AcademicYear.findOne({ name });
        if (existingYear) {
            return res.status(400).json({ message: 'Academic year with this name already exists.' });
        }

        const newYear = new AcademicYear({
            name,
            startDate,
            endDate,
            isActive: isActive || false,
            createdBy: req.user._id
        });

        const savedYear = await newYear.save();
        res.status(201).json(savedYear);
    } catch (error) {
        console.error('Error creating academic year:', error);
        res.status(500).json({ message: 'Server error creating academic year' });
    }
};

// @desc    Update academic year
// @route   PUT /api/academic-years/:id
// @access  Private (Admin)
const updateAcademicYear = async (req, res) => {
    try {
        const { name, startDate, endDate, isActive, isLocked, status } = req.body;
        const year = await AcademicYear.findById(req.params.id);

        if (!year) {
            return res.status(404).json({ message: 'Academic year not found' });
        }

        // Prevent editing a locked year's dates/name (status can still be changed by admin)
        if (year.isLocked && (name || startDate || endDate)) {
            return res.status(400).json({
                message: `"${year.name}" is locked after a promotion cycle. Core details cannot be edited. You can still update its status.`
            });
        }

        if (name) year.name = name;
        if (startDate) year.startDate = startDate;
        if (endDate) year.endDate = endDate;

        // Handle status field
        if (status !== undefined) {
            year.status = status;
            // If admin manually marks as Active, sync isActive
            if (status === 'Active') {
                year.isActive = true;
                year.isLocked = false; // un-lock if re-activating
            }
        }

        if (isActive !== undefined) year.isActive = isActive;
        if (isLocked !== undefined) year.isLocked = isLocked;

        const updatedYear = await year.save();
        res.status(200).json(updatedYear);
    } catch (error) {
        console.error('Error updating academic year:', error);
        res.status(500).json({ message: 'Server error updating academic year' });
    }
};

// @desc    Delete an academic year
// @route   DELETE /api/academic-years/:id
// @access  Private (Admin)
const deleteAcademicYear = async (req, res) => {
    try {
        const year = await AcademicYear.findById(req.params.id);

        if (!year) {
            return res.status(404).json({ message: 'Academic year not found' });
        }

        if (year.isLocked) {
            return res.status(400).json({ message: 'Cannot delete a locked academic year.' });
        }

        await year.deleteOne();
        res.status(200).json({ message: 'Academic year deleted successfully' });
    } catch (error) {
        console.error('Error deleting academic year:', error);
        res.status(500).json({ message: 'Server error deleting academic year' });
    }
};

module.exports = {
    getAcademicYears,
    createAcademicYear,
    updateAcademicYear,
    deleteAcademicYear
};
