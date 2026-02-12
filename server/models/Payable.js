const mongoose = require('mongoose');

const payableSchema = mongoose.Schema({
    source: { type: mongoose.Schema.Types.ObjectId, ref: 'AccrualExpense', required: true },
    vendor: { type: String, required: true },
    amount: { type: Number, required: true }, // Original Amount
    paidAmount: { type: Number, default: 0 },
    balance: { type: Number, required: true }, // Outstanding Balance
    dueDate: { type: Date },
    status: {
        type: String,
        enum: ['Unpaid', 'Partial', 'Paid'],
        default: 'Unpaid'
    },
    description: { type: String }
}, {
    timestamps: true
});

module.exports = mongoose.model('Payable', payableSchema);
