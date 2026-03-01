const mongoose = require('mongoose');

const summerEnquirySchema = mongoose.Schema({
    name: { type: String, required: true },
    age: { type: String },
    occupation: { type: String }, // 'Student' or 'Working'
    interestedCourses: [{ type: String }],
    email: { type: String }, // Can be student or working mail id
    phoneNumber: { type: String, required: true },
    message: { type: String },
    status: {
        type: String,
        enum: ['New', 'Contacted', 'Closed'],
        default: 'New'
    }
}, {
    timestamps: true,
});

const SummerEnquiry = mongoose.model('SummerEnquiry', summerEnquirySchema);

module.exports = SummerEnquiry;
