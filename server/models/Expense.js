const mongoose = require('mongoose');

const expenseSchema = mongoose.Schema({
    title: { type: String }, // Optional, can be derived from category/subcategory
    category: { type: String, required: true },
    subcategory: { type: String, required: true },
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    description: { type: String },
    receiptUrl: { type: String }, // Optional path to uploaded receipt image
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
    timestamps: true
});

const Expense = mongoose.model('Expense', expenseSchema);

module.exports = Expense;
