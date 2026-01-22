const mongoose = require('mongoose');

const classSchema = mongoose.Schema({
    name: { type: String, required: true, unique: true }, // e.g., "Class X"
    sections: [{ type: String }], // e.g., ["A", "B", "C"]
    subjects: [{ type: String }], // e.g., ["Math", "Science"] linked to this class
}, {
    timestamps: true,
});

const Class = mongoose.model('Class', classSchema);

module.exports = Class;
