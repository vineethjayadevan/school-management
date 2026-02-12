const mongoose = require('mongoose');

const accrualExpenseSchema = mongoose.Schema({
    date: { type: Date, default: Date.now },
    vendor: { type: String, required: true }, // Name of Vendor or Staff
    category: { type: String, required: true },
    subcategory: { type: String },
    amount: { type: Number, required: true },
    dueDate: { type: Date },
    description: { type: String },

    // Link to the Liability (Payable)
    linkedPayable: { type: mongoose.Schema.Types.ObjectId, ref: 'Payable' },

    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
    timestamps: true
});

module.exports = mongoose.model('AccrualExpense', accrualExpenseSchema);
