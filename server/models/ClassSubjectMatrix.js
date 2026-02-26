const mongoose = require('mongoose');

const classSubjectMatrixSchema = new mongoose.Schema({
    academicYear: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear', required: true },
    className: { type: String, required: true },  // "Grade 2"
    subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }]
}, { timestamps: true });

// One mapping per class per academic year
classSubjectMatrixSchema.index({ academicYear: 1, className: 1 }, { unique: true });

const ClassSubjectMatrix = mongoose.model('ClassSubjectMatrix', classSubjectMatrixSchema);
module.exports = ClassSubjectMatrix;
