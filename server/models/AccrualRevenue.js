const mongoose = require('mongoose');

const accrualRevenueSchema = mongoose.Schema({
    date: { type: Date, default: Date.now },
    customer: { type: String, required: true }, // Name of Student, Donor, or Sponsor
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' }, // Optional link if it is a student
    category: { type: String, required: true },
    subcategory: { type: String },
    amount: { type: Number, required: true },
    dueDate: { type: Date },
    description: { type: String },

    // Link to the Asset (Receivable)
    linkedReceivable: { type: mongoose.Schema.Types.ObjectId, ref: 'Receivable' },

    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
    timestamps: true
});

module.exports = mongoose.model('AccrualRevenue', accrualRevenueSchema);
