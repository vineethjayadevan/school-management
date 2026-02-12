const mongoose = require('mongoose');

const settlementSchema = mongoose.Schema({
    date: { type: Date, default: Date.now },
    type: {
        type: String,
        enum: ['Receipt', 'Payment', 'Capital Injection', 'Loan Movement'],
        required: true
    },
    amount: { type: Number, required: true },

    // Linking logic: Either a Receivable (for Receipt) or Payable (for Payment) is linked
    relatedReceivable: { type: mongoose.Schema.Types.ObjectId, ref: 'Receivable' },
    relatedPayable: { type: mongoose.Schema.Types.ObjectId, ref: 'Payable' },

    paymentMode: { type: String, default: 'Cash' }, // Cash, Bank Transfer, Cheque, etc.
    description: { type: String },

    // Audit
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
    timestamps: true
});

module.exports = mongoose.model('Settlement', settlementSchema);
