const mongoose = require('mongoose');

const assignmentSchema = mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    className: { type: String, required: true }, // e.g., 'Class 10'
    section: { type: String, required: true }, // e.g., 'A'
    subject: { type: String, required: true }, // e.g., 'Mathematics'
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true },
    dueDate: { type: Date, required: true },
    assignedDate: { type: Date, default: Date.now },
    status: { type: String, enum: ['Active', 'Closed'], default: 'Active' },
}, {
    timestamps: true,
});

const Assignment = mongoose.model('Assignment', assignmentSchema);

module.exports = Assignment;
