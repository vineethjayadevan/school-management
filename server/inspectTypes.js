const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function checkType() {
    try {
        const client = await mongoose.connect(process.env.MONGO_URI);
        const doc = await client.connection.db.collection('otherincomes').findOne({ category: 'Capital Introduced' });
        console.log("Raw object from db:");
        console.dir(doc);
        console.log("typeof addedBy:", typeof doc.addedBy);
        console.log("Is ObjectId?", doc.addedBy instanceof mongoose.Types.ObjectId);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
checkType();
