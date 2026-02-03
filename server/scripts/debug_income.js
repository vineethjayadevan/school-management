const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const OtherIncome = require('../models/OtherIncome');

const debugData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const recs = await OtherIncome.find({
            description: { $regex: 'Building owner|Annual Day|Donation Recieved', $options: 'i' }
        });
        console.log('Record Count:', recs.length);
        console.log(JSON.stringify(recs, null, 2));
        process.exit();
    } catch (e) { console.error(e); process.exit(1); }
};
debugData();
