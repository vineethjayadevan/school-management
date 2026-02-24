const mongoose = require('mongoose');

const promotionLogSchema = mongoose.Schema({
    academicYearFrom: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AcademicYear',
        required: true
    },
    academicYearTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AcademicYear',
        required: true
    },
    fromClass: { type: String, required: true },
    toClass: { type: String, required: true },
    totalStudentsProcessed: { type: Number, required: true },
    promotedCount: { type: Number, default: 0 },
    detainedCount: { type: Number, default: 0 },
    graduatedCount: { type: Number, default: 0 },
    onHoldCount: { type: Number, default: 0 },
    executedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

const PromotionLog = mongoose.model('PromotionLog', promotionLogSchema);

module.exports = PromotionLog;
