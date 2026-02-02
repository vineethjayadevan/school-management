const mongoose = require('mongoose');

const incomeCategorySchema = mongoose.Schema({
    name: { type: String, required: true, unique: true }, // e.g., "Donations", "Grants"
    description: { type: String },
    isActive: { type: Boolean, default: true }
}, {
    timestamps: true
});

const IncomeCategory = mongoose.model('IncomeCategory', incomeCategorySchema);

module.exports = IncomeCategory;
