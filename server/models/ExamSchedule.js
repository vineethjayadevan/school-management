const mongoose = require('mongoose');

const examScheduleSchema = new mongoose.Schema({
    examCategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ExamCategory',
        required: true
    },
    class: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
        required: true
    },
    section: {
        type: String,
        required: true
    },
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    startTime: {
        type: String, // HH:mm format
    },
    endTime: {
        type: String, // HH:mm format
    },
    maxMarks: {
        type: Number,
        required: true,
        default: 100
    },
    passingMarks: {
        type: Number,
        required: true,
        default: 35
    },
    scheduledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Staff',
        required: true
    },
    status: {
        type: String,
        enum: ['Scheduled', 'Completed', 'Results Published'],
        default: 'Scheduled'
    }
}, {
    timestamps: true
});

// Ensure a compound index so we don't schedule the same subject twice for the same section in the same exam category
examScheduleSchema.index({ examCategory: 1, class: 1, section: 1, subject: 1 }, { unique: true });

module.exports = mongoose.model('ExamSchedule', examScheduleSchema);
