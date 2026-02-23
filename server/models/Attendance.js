const mongoose = require('mongoose');

const attendanceSchema = mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Student'
    },
    date: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        required: true,
        enum: ['Present', 'Absent', 'Late'],
        default: 'Present'
    },
    remarks: {
        type: String
    },
    markedBy: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Staff'
    },
    className: {
        type: String,
        required: true
    },
    section: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

// Ensure a student can only have one attendance record per day
attendanceSchema.index({ student: 1, date: 1 }, { unique: true });

const Attendance = mongoose.model('Attendance', attendanceSchema);

module.exports = Attendance;
