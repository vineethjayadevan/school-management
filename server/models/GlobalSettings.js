const mongoose = require('mongoose');

const globalSettingsSchema = mongoose.Schema({
    // Using a fixed string ID since there will only ever be one settings doc
    _id: { type: String, default: 'SYSTEM_SETTINGS' },

    // Academic & Promotion Settings
    promotionRequiresFullFee: {
        type: Boolean,
        default: true
    },

    lastUpdatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

const GlobalSettings = mongoose.model('GlobalSettings', globalSettingsSchema);

module.exports = GlobalSettings;
