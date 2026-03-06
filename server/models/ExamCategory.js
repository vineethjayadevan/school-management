const mongoose = require('mongoose');

const examCategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    academicYear: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AcademicYear',
        required: true
    },
    weightage: {
        type: Number,
        default: 100 // Out of 100% for final grade calculations if needed
    },
    status: {
        type: String,
        enum: ['Active', 'Completed', 'Draft'],
        default: 'Active'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('ExamCategory', examCategorySchema);
