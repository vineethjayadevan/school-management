const mongoose = require('mongoose');

const staffSchema = mongoose.Schema({
    employeeId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    role: { type: String, required: true }, // Teacher, Admin, Driver, etc.
    qualification: { type: String },
    email: { type: String, unique: true },
    phone: { type: String, required: true },
    joiningDate: { type: Date },
    salary: { type: Number },

    avatar: { type: String },

    // For teachers
    subjects: [{ type: String }],
}, {
    timestamps: true,
});

const Staff = mongoose.model('Staff', staffSchema);

module.exports = Staff;
