const mongoose = require('mongoose');
const { ObjectId } = require('mongodb');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function convertStringsToObjectIds() {
    try {
        console.log("Connecting to database...");
        const client = await mongoose.connect(process.env.MONGO_URI);
        const db = client.connection.db;
        
        console.log('Connected to:', client.connection.name);

        const collections = await db.listCollections().toArray();
        let totalUpdated = 0;

        for (const col of collections) {
            const collectionName = col.name;
            const collection = db.collection(collectionName);
            
            const docs = await collection.find({}).toArray();
            
            for (const doc of docs) {
                const updates = {};
                
                // Function to recursively find 24-hex strings that look like object ids
                const findAndConvert = (obj, prefix = '') => {
                    for (const key in obj) {
                        // Skip system fields or already correct object ids
                        if (key === '_id' || obj[key] instanceof ObjectId) continue;
                        
                        if (typeof obj[key] === 'string' && obj[key].length === 24 && /^[0-9a-fA-F]{24}$/.test(obj[key])) {
                             updates[`${prefix}${key}`] = new ObjectId(obj[key]);
                        } else if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
                             findAndConvert(obj[key], `${prefix}${key}.`);
                        } else if (Array.isArray(obj[key])) {
                             obj[key].forEach((item, index) => {
                                 if (typeof item === 'string' && item.length === 24 && /^[0-9a-fA-F]{24}$/.test(item)) {
                                     updates[`${prefix}${key}.${index}`] = new ObjectId(item);
                                 } else if (item && typeof item === 'object') {
                                     findAndConvert(item, `${prefix}${key}.${index}.`);
                                 }
                             });
                        }
                    }
                };

                findAndConvert(doc);

                if (Object.keys(updates).length > 0) {
                    await collection.updateOne({ _id: doc._id }, { $set: updates });
                    totalUpdated++;
                }
            }
            console.log(`Processed ${collectionName}`);
        }

        console.log(`\nMigration Type Cleanup Complete: Updated ${totalUpdated} documents across all collections to use native MongoDB ObjectIds instead of pure strings.`);
        process.exit(0);

    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

convertStringsToObjectIds();
