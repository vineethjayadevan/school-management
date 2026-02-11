const mongoose = require('mongoose');

const otherIncomeSchema = mongoose.Schema({
    category: { type: String, required: true }, // Store category name directly for simplicity or ObjectId if strict relation needed. Using String as per "configurable not hardcoded" req effectively means list based.
    subcategory: { type: String },
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    description: { type: String },
    receiptNo: { type: String }, // Optional
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
    timestamps: true
});

const OtherIncome = mongoose.model('OtherIncome', otherIncomeSchema);

module.exports = OtherIncome;
