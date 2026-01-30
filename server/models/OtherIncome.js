const mongoose = require('mongoose');

const otherIncomeSchema = mongoose.Schema({
    title: { type: String, required: true },
    amount: { type: Number, required: true },
    source: { type: String, required: true }, // e.g. "Donation", "Investment", "Grant"
    date: { type: Date, default: Date.now },
    description: { type: String },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
    timestamps: true
});

const OtherIncome = mongoose.model('OtherIncome', otherIncomeSchema);

module.exports = OtherIncome;
