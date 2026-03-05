const mongoose = require('mongoose');

const staffSchema = mongoose.Schema({
    employeeId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    role: { type: String, required: true }, // Teacher, Admin, Driver, etc.
    qualification: { type: String },
    email: { type: String, unique: true, sparse: true },
    phone: { type: String, required: true },
    joiningDate: { type: Date },
    salary: { type: Number }, // Fixed monthly salary

    // New fields for Salary Module
    category: {
        type: String,
        required: true,
        default: 'Teacher'
    },
    subcategory: { type: String },
    paymentMode: {
        type: String,
        enum: ['Cash', 'Bank Transfer', 'UPI', 'Cheque'],
        default: 'Cash'
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive'],
        default: 'Active'
    },

    avatar: { type: String },

    // For teachers
    subjects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }],

    // New Fields for expanded profile
    isMarried: { type: Boolean, default: false },
    spouseName: { type: String },
    spousePhone: { type: String },
    spouseEmail: { type: String },
    address: { type: String },
    idCardNumber: { type: String },
    idCardImage: { type: String }, // URL to storage
    photoUrl: { type: String, default: '' }, // Profile photo URL (GCS)
}, {
    timestamps: true,
});

const Staff = mongoose.model('Staff', staffSchema);

module.exports = Staff;
