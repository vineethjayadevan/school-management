const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
    slotNumber: { type: Number, required: true },
    label: { type: String, required: true }, // "Period 1", "Lunch Break", "Assembly"
    startTime: { type: String, required: true }, // "09:00"
    endTime: { type: String, required: true },   // "09:45"
    isBreak: { type: Boolean, default: false }    // true = Lunch/Break (no subject assigned)
}, { _id: false });

const periodTemplateSchema = new mongoose.Schema({
    name: { type: String, required: true },       // "Standard School Day"
    academicYear: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear', required: true },
    workingDays: {
        type: [String],
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    },
    slots: { type: [slotSchema], required: true }
}, { timestamps: true });

// Only one template per academic year (can extend to multiple named templates later)
periodTemplateSchema.index({ academicYear: 1 }, { unique: true });

const PeriodTemplate = mongoose.model('PeriodTemplate', periodTemplateSchema);
module.exports = PeriodTemplate;
