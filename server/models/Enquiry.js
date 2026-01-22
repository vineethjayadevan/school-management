const mongoose = require('mongoose');

const enquirySchema = mongoose.Schema({
    name: { type: String, required: true },
    studentName: { type: String, required: true },
    studentGrade: { type: String, required: true },
    contactNumber: { type: String, required: true },
    email: { type: String },
    message: { type: String },
    status: {
        type: String,
        enum: ['New', 'Contacted', 'Closed'],
        default: 'New'
    },
    notes: { type: String }
}, {
    timestamps: true,
});

const Enquiry = mongoose.model('Enquiry', enquirySchema);

module.exports = Enquiry;
