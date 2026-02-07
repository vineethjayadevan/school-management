const mongoose = require('mongoose');

const adjustmentSchema = mongoose.Schema({
    type: {
        type: String,
        enum: ['Outstanding Expense', 'Prepaid Expense', 'Accrued Income', 'Unearned Income'],
        required: true
    },
    date: { type: Date, required: true }, // The "As of" date for the adjustment
    amount: { type: Number, required: true },
    description: { type: String },
    relatedCategory: { type: String }, // Optional, linking to Expense/Income categories logic
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
    timestamps: true
});

module.exports = mongoose.model('Adjustment', adjustmentSchema);
