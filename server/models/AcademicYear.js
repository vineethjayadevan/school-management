const mongoose = require('mongoose');

const academicYearSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        // Example: "2024-2025"
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    isActive: {
        type: Boolean,
        default: false
    },
    isLocked: {
        type: Boolean,
        default: false
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Pre-save middleware to ensure only one active year
academicYearSchema.pre('save', async function (next) {
    if (this.isModified('isActive') && this.isActive) {
        await mongoose.model('AcademicYear').updateMany(
            { _id: { $ne: this._id } },
            { $set: { isActive: false } }
        );
    }
    next();
});

const AcademicYear = mongoose.model('AcademicYear', academicYearSchema);

module.exports = AcademicYear;
