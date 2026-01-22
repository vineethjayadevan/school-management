const mongoose = require('mongoose');

const eventSchema = mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    date: {
        type: String, // Keeping as string to match existing UI format flexibility, or could use Date
        required: true,
    },
    desc: {
        type: String,
        required: true,
    },
    details: {
        type: String, // Longer description
    },
    color: {
        type: String,
        default: 'from-blue-500 to-cyan-500', // Default gradient
    },
}, {
    timestamps: true,
});

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;
