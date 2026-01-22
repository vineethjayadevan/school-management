const mongoose = require('mongoose');

const feeSchema = mongoose.Schema({
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    feeType: { type: String, required: true }, // e.g., "Monthly Tuition", "Exam Fee"
    amount: { type: Number, required: true },
    dueDate: { type: Date },

    status: { type: String, enum: ['Paid', 'Pending', 'Overdue'], default: 'Pending' },

    // Payment Details
    paymentDate: { type: Date },
    paymentMode: { type: String }, // Cash, Online, Cheque
    receiptNo: { type: String },

    remarks: { type: String }
}, {
    timestamps: true,
});

const Fee = mongoose.model('Fee', feeSchema);

module.exports = Fee;
