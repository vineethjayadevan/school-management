const mongoose = require('mongoose');

const staffSchema = mongoose.Schema({
    employeeId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    role: { type: String, required: true }, // Teacher, Admin, Driver, etc.
    qualification: { type: String },
    email: { type: String, unique: true },
    phone: { type: String, required: true },
    joiningDate: { type: Date },
    salary: { type: Number }, // Fixed monthly salary

    // New fields for Salary Module
    category: {
        type: String,
        required: true,
        enum: ['Teacher', 'Non-Teaching', 'Vehicle In-Charge'],
        default: 'Teacher'
    },
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
    subjects: [{ type: String }],
}, {
    timestamps: true,
});

const Staff = mongoose.model('Staff', staffSchema);

module.exports = Staff;
