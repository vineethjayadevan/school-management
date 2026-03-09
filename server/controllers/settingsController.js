const GlobalSettings = require('../models/GlobalSettings');

// @desc    Get global settings
// @route   GET /api/settings
// @access  Private (Admin)
const getSettings = async (req, res) => {
    try {
        let settings = await GlobalSettings.findById('SYSTEM_SETTINGS');

        if (!settings) {
            // Create default settings if none exist
            settings = await GlobalSettings.create({
                _id: 'SYSTEM_SETTINGS',
                promotionRequiresFullFee: true
            });
        }
        res.status(200).json(settings);
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ message: 'Server error fetching settings' });
    }
};

// @desc    Update global settings
// @route   PUT /api/settings
// @access  Private (Admin)
const updateSettings = async (req, res) => {
    try {
        const { promotionRequiresFullFee, notificationSettings } = req.body;

        let settings = await GlobalSettings.findById('SYSTEM_SETTINGS');

        if (!settings) {
            settings = new GlobalSettings({ _id: 'SYSTEM_SETTINGS' });
        }

        if (promotionRequiresFullFee !== undefined) {
            settings.promotionRequiresFullFee = promotionRequiresFullFee;
        }

        if (notificationSettings !== undefined) {
            settings.notificationSettings = notificationSettings;
        }

        settings.lastUpdatedBy = req.user._id;

        const updatedSettings = await settings.save();
        res.status(200).json(updatedSettings);
    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({ message: 'Server error updating settings' });
    }
};

module.exports = {
    getSettings,
    updateSettings
};
