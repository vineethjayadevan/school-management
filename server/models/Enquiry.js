const mongoose = require('mongoose');

const enquirySchema = mongoose.Schema({
    // Student Details
    studentFirstName: { type: String, required: true },
    studentMiddleName: { type: String },
    studentLastName: { type: String, required: true },
    studentGrade: { type: String, required: true },
    dob: { type: Date, required: true },

    // Parent Details
    fatherName: { type: String, required: true },
    motherName: { type: String, required: true },

    // Contact Details
    contactNumber: { type: String, required: true },
    email: { type: String },

    // Other
    message: { type: String }, // Remarks
    status: {
        type: String,
        enum: ['New', 'Contacted', 'Closed', 'Rejected', 'Admitted', 'Enrolled'],
        default: 'New'
    },
    notes: { type: String }
}, {
    timestamps: true,
});

const Enquiry = mongoose.model('Enquiry', enquirySchema);

module.exports = Enquiry;
