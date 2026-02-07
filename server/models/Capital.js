const mongoose = require('mongoose');

const capitalSchema = mongoose.Schema({
    shareholder: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    type: {
        type: String,
        enum: ['Investment', 'Withdrawal'],
        required: true
    },
    description: { type: String },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
    timestamps: true
});

module.exports = mongoose.model('Capital', capitalSchema);
