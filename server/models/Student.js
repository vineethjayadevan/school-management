const mongoose = require('mongoose');

const studentSchema = mongoose.Schema({
    admissionNo: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    rollNo: { type: String },
    className: { type: String, required: true },
    section: { type: String, required: true },
    gender: { type: String, enum: ['Male', 'Female', 'Other'] },
    dob: { type: Date },

    // Parents Info
    guardian: { type: String, required: true }, // Main contact person
    fatherName: { type: String },
    motherName: { type: String },
    primaryPhone: { type: String, required: true },
    email: { type: String },
    address: { type: String },

    // Media
    photoUrl: { type: String, default: '' }, // Path to uploaded image
    documents: [{
        name: { type: String },
        url: { type: String },
        type: { type: String } // e.g., 'pdf', 'jpg'
    }],

    // Status
    feesStatus: { type: String, enum: ['Paid', 'Pending', 'Overdue', 'Partially Paid'], default: 'Pending' },
    isActive: { type: Boolean, default: true },
}, {
    timestamps: true,
});

const Student = mongoose.model('Student', studentSchema);

module.exports = Student;
