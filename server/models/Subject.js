const mongoose = require('mongoose');

const subjectSchema = mongoose.Schema({
    name: { type: String, required: true }, // e.g., "Mathematics"
    code: { type: String, required: true, unique: true }, // e.g., "MATH101"
    type: {
        type: String,
        required: true,
        enum: ['Core', 'Elective', 'Co-Curricular'],
        default: 'Core'
    },
    description: { type: String },
}, {
    timestamps: true,
});

const Subject = mongoose.model('Subject', subjectSchema);

module.exports = Subject;
