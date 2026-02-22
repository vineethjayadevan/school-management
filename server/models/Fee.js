const mongoose = require('mongoose');

const feeSchema = mongoose.Schema({
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    feeType: { type: String, required: true }, // e.g., "Admission Fee", "Tuition Fee", "Annual Fee"
    amount: { type: Number, required: true },
    academicYear: { type: String, required: true }, // e.g., "2025-2026"
    dueDate: { type: Date },

    status: { type: String, enum: ['Paid', 'Pending', 'Overdue'], default: 'Pending' },

    // Payment Details
    paymentDate: { type: Date },
    paymentMode: { type: String }, // Cash, Online, Cheque, UPI
    transactionId: { type: String }, // Reference Number for Non-Cash
    receiptNo: { type: String },

    // Split Payment Details Array
    breakdown: [{
        feeType: { type: String, required: true },
        amount: { type: Number, required: true }
    }],

    remarks: { type: String }
}, {
    timestamps: true,
});

const Fee = mongoose.model('Fee', feeSchema);

module.exports = Fee;
