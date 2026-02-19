const mongoose = require('mongoose');

const classSchema = mongoose.Schema({
    name: { type: String, required: true, unique: true }, // e.g., "Class X"
    sections: [{
        name: { type: String, required: true },
        classTeacher: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' },
        nanny: { type: mongoose.Schema.Types.ObjectId, ref: 'Staff' }
    }],
    subjects: [{ type: String }], // e.g., ["Math", "Science"] linked to this class
}, {
    timestamps: true,
});

const Class = mongoose.model('Class', classSchema);

module.exports = Class;
