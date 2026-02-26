const ClassSubjectMatrix = require('../models/ClassSubjectMatrix');

// @desc  Get subject matrix for a class + academic year
// @route GET /api/class-subject-matrix?academicYear=:id&className=:name
const getMatrix = async (req, res) => {
    try {
        const { academicYear, className } = req.query;
        const filter = {};
        if (academicYear) filter.academicYear = academicYear;
        if (className) filter.className = className;

        const matrix = await ClassSubjectMatrix.find(filter)
            .populate('subjects', 'name code type')
            .populate('academicYear', 'name');
        res.json(matrix);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Save (upsert) subject list for a class + academic year
// @route POST /api/class-subject-matrix
const upsertMatrix = async (req, res) => {
    try {
        const { academicYear, className, subjects } = req.body;
        if (!academicYear || !className) {
            return res.status(400).json({ message: 'Academic year and class name are required.' });
        }

        const matrix = await ClassSubjectMatrix.findOneAndUpdate(
            { academicYear, className },
            { academicYear, className, subjects: subjects || [] },
            { upsert: true, new: true, runValidators: true }
        ).populate('subjects', 'name code type');

        res.status(200).json(matrix);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Delete matrix entry
// @route DELETE /api/class-subject-matrix/:id
const deleteMatrix = async (req, res) => {
    try {
        await ClassSubjectMatrix.findByIdAndDelete(req.params.id);
        res.json({ message: 'Subject matrix entry deleted.' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { getMatrix, upsertMatrix, deleteMatrix };
