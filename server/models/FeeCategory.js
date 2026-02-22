const mongoose = require('mongoose');

const feeCategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Fee category name is required'],
        trim: true,
        unique: true
    },
    // Array mapping class name to amount
    amounts: [{
        className: {
            type: String,
            required: true
        },
        amount: {
            type: Number,
            required: true,
            min: 0
        }
    }],
    hasSlabs: {
        type: Boolean,
        default: false
    },
    baseAmount: {
        type: Number,
        default: 0
    },
    slabMultiplier: {
        type: Number,
        default: 0
    },
    months: {
        type: Number,
        default: 10
    },
    isActive: {
        type: Boolean,
        default: true
    },
    description: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

const FeeCategory = mongoose.model('FeeCategory', feeCategorySchema);

module.exports = FeeCategory;
