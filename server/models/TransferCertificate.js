const mongoose = require('mongoose');

const transferCertificateSchema = new mongoose.Schema({
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true
    },
    admissionNo: { type: String, required: true },
    studentName: { type: String, required: true },
    tcNo: { type: String, required: true, unique: true },
    issueDate: { type: Date, required: true },
    academicYear: { type: String, required: true }, // e.g., "2024-2025"

    // Exit Information
    exitDetails: {
        dateOfLeaving: { type: Date },
        reasonForLeaving: { type: String, required: true },
        lastStudiedClass: { type: String }, // Can be different from current if they failed/withdrawn mid-year
        resultStatus: { type: String, enum: ['Pass', 'Fail', 'Not Applicable'], default: 'Not Applicable' }, // Pass/Fail
        conduct: { type: String, default: 'Good' },
        remarks: { type: String }
    },

    // Financial Snapshot at the time of TC
    financialSnapshot: {
        totalFeesPaid: { type: Number, default: 0 },
        pendingAtTC: { type: Number, default: 0 },
        isCleared: { type: Boolean, default: false }
    },

    issuedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

const TransferCertificate = mongoose.model('TransferCertificate', transferCertificateSchema);

module.exports = TransferCertificate;
