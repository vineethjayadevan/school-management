const mongoose = require('mongoose');

const examMarkSchema = new mongoose.Schema({
    examSchedule: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ExamSchedule',
        required: true
    },
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    marksObtained: {
        type: Number,
        default: null // null implies marks not yet entered
    },
    grade: {
        type: String,
    },
    remarks: {
        type: String,
        maxlength: 250
    },
    status: {
        type: String,
        enum: ['Present', 'Absent', 'Excused'],
        default: 'Present'
    },
    enteredBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Staff', // usually the teacher
        required: true
    }
}, {
    timestamps: true
});

// A student can only have one mark entry per exam schedule
examMarkSchema.index({ examSchedule: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('ExamMark', examMarkSchema);
