const mongoose = require('mongoose');

const expenseSchema = mongoose.Schema({
    title: { type: String, required: true },
    amount: { type: Number, required: true },
    category: {
        type: String,
        required: true,
        enum: ['Salary', 'Infrastructure', 'Utilities', 'Events', 'Maintenance', 'Educational', 'Other']
    },
    description: { type: String },
    date: { type: Date, default: Date.now },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    receiptUrl: { type: String } // Optional link to stored receipt image
}, {
    timestamps: true
});

const Expense = mongoose.model('Expense', expenseSchema);

module.exports = Expense;
