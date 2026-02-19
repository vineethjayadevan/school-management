const mongoose = require('mongoose');

const staffCategorySchema = mongoose.Schema({
    name: { type: String, required: true, unique: true }, // e.g., "Teacher", "Non-Teaching"
    subcategories: [{ type: String }], // e.g., ["Math", "Science"] or ["Driver", "Cleaner"]
    isTeaching: { type: Boolean, default: false }, // If true, show Subject selection in UI
    isActive: { type: Boolean, default: true }
}, {
    timestamps: true,
});

const StaffCategory = mongoose.model('StaffCategory', staffCategorySchema);

module.exports = StaffCategory;
