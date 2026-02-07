const mongoose = require('mongoose');

const assetSchema = mongoose.Schema({
    name: { type: String, required: true },
    purchaseDate: { type: Date, required: true },
    purchaseCost: { type: Number, required: true },
    salvageValue: { type: Number, default: 0 },
    usefulLifeYears: { type: Number, required: true }, // In years
    depreciationMethod: {
        type: String,
        enum: ['Straight Line'],
        default: 'Straight Line'
    },
    description: { type: String },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for Calculated Depreciation (Annual)
assetSchema.virtual('annualDepreciation').get(function () {
    if (this.depreciationMethod === 'Straight Line') {
        return (this.purchaseCost - this.salvageValue) / this.usefulLifeYears;
    }
    return 0;
});

module.exports = mongoose.model('Asset', assetSchema);
