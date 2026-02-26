const mongoose = require('mongoose');

const slotEntrySchema = new mongoose.Schema({
    slotNumber: { type: Number, required: true },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', default: null },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', default: null },
    note: { type: String, default: '' }
}, { _id: false });

const dayScheduleSchema = new mongoose.Schema({
    day: {
        type: String,
        required: true,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    },
    slots: [slotEntrySchema]
}, { _id: false });

const timetableSchema = new mongoose.Schema({
    academicYear: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear', required: true },
    className: { type: String, required: true },
    section: { type: String, required: true },
    periodTemplate: { type: mongoose.Schema.Types.ObjectId, ref: 'PeriodTemplate', required: true },
    schedule: [dayScheduleSchema]
}, { timestamps: true });

// Unique timetable per class + section + academic year
timetableSchema.index({ academicYear: 1, className: 1, section: 1 }, { unique: true });

const Timetable = mongoose.model('Timetable', timetableSchema);
module.exports = Timetable;
