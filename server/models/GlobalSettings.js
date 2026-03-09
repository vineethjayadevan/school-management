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
    },

    // Notification Settings
    notificationSettings: {
        feeReceipt: {
            email: { type: Boolean, default: true },
            whatsapp: { type: Boolean, default: false },
            sms: { type: Boolean, default: false }
        },
        admissionEnquiry: {
            email: { type: Boolean, default: true },
            whatsapp: { type: Boolean, default: false },
            sms: { type: Boolean, default: false }
        },
        summerEnquiry: {
            email: { type: Boolean, default: true },
            whatsapp: { type: Boolean, default: false },
            sms: { type: Boolean, default: false }
        },
        attendanceReport: {
            email: { type: Boolean, default: false },
            whatsapp: { type: Boolean, default: false },
            sms: { type: Boolean, default: false }
        },
        staffAttendanceReport: {
            email: { type: Boolean, default: false },
            whatsapp: { type: Boolean, default: false },
            sms: { type: Boolean, default: false }
        }
    }
}, {
    timestamps: true
});

const GlobalSettings = mongoose.model('GlobalSettings', globalSettingsSchema);

module.exports = GlobalSettings;
