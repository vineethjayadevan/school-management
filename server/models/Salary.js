const mongoose = require('mongoose');

const salarySchema = mongoose.Schema({
    staff: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Staff',
        required: true
    },
    month: {
        type: String,
        required: true
    }, // Format: "YYYY-MM"
    amount: {
        type: Number,
        required: true
    }, // Snapshot of salary at that time
    status: {
        type: String,
        enum: ['Pending', 'Paid'],
        default: 'Pending'
    },
    paymentDate: {
        type: Date
    },
    paymentMode: {
        type: String
    },
    remarks: {
        type: String
    },
    paidBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true,
});

// Prevent duplicate salary records for the same staff in the same month
salarySchema.index({ staff: 1, month: 1 }, { unique: true });

const Salary = mongoose.model('Salary', salarySchema);

module.exports = Salary;
