const mongoose = require('mongoose');

const staffAttendanceSchema = mongoose.Schema({
    staff: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Staff'
    },
    date: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        required: true,
        enum: ['Present', 'Absent', 'Late', 'Half Day'],
        default: 'Present'
    },
    remarks: {
        type: String
    },
    markedBy: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Ensure a staff member can only have one attendance record per day
staffAttendanceSchema.index({ staff: 1, date: 1 }, { unique: true });

const StaffAttendance = mongoose.model('StaffAttendance', staffAttendanceSchema);

module.exports = StaffAttendance;
