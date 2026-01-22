const mongoose = require('mongoose');

const timetableSchema = mongoose.Schema({
    className: { type: String, required: true }, // e.g., 'Class 10'
    section: { type: String, required: true }, // e.g., 'A'
    dayOfWeek: {
        type: String,
        required: true,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    },
    periods: [{
        startTime: { type: String, required: true }, // e.g., "09:00"
        endTime: { type: String, required: true },   // e.g., "09:45"
        subject: { type: String, required: true },
        teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' }
    }]
}, {
    timestamps: true,
});

// Compound index to prevent duplicate schedules for same class/day
timetableSchema.index({ className: 1, section: 1, dayOfWeek: 1 }, { unique: true });

const Timetable = mongoose.model('Timetable', timetableSchema);

module.exports = Timetable;
