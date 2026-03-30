const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const backupPath = path.join(__dirname, 'backup', 'test_db_backup_1774881928949');

async function importDatabase() {
    try {
        console.log("Connecting to:", process.env.MONGO_URI);
        const client = await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to database:', client.connection.name);

        if (client.connection.name !== 'school_management') {
           console.log("WARNING: Not connected to school_management! Currently connected to: " + client.connection.name);
           console.log("Please make sure your .env is exactly correct. Aborting out of caution.");
           process.exit(1);
        }

        if (!fs.existsSync(backupPath)) {
            console.error(`Backup folder not found at ${backupPath}.`);
            process.exit(1);
        }

        const files = fs.readdirSync(backupPath).filter(f => f.endsWith('.json'));
        let totalInserted = 0;

        for (const file of files) {
            const collectionName = file.replace('.json', '');
            const filePath = path.join(backupPath, file);
            const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

            if (data.length === 0) continue;

            // Many collections might have relational IDs that also need tracking if we want perfect data integrity, 
            // but just passing raw hex strings to MongoDB is completely valid if we use the underlying MongoDB Node JS drivers.
            // Using `client.connection.db.collection(col).insertMany(data)` does not strictly enforce BSON ObjectIds, 
            // which could cause 'Cannot read properties of undefined' or similar if querying with strictly Mongoose later, 
            // SO we must convert where possible!
            
            const cleanedData = [];
            for (const doc of data) {
                 try {
                     if (doc._id && typeof doc._id === 'string' && doc._id.length === 24) {
                         doc._id = new mongoose.Types.ObjectId(doc._id);
                     }
                     // Let's also parse typical dates
                     if (doc.createdAt) doc.createdAt = new Date(doc.createdAt);
                     if (doc.updatedAt) doc.updatedAt = new Date(doc.updatedAt);
                     
                     cleanedData.push(doc);
                 } catch (e) {
                     console.error("Error parsing doc in collection", collectionName, "Document _id:", doc._id);
                     console.error(e.message);
                 }
            }

            // Attempt to drop existing collection to prevent duplicates and start fresh
            try {
                await client.connection.db.dropCollection(collectionName);
                console.log(`Dropped existing collection: ${collectionName}`);
            } catch (err) {
                 // Ignore error if collection does not exist yet
            }

            // Insert new data
            if (cleanedData.length > 0) {
                 await client.connection.db.collection(collectionName).insertMany(cleanedData);
                 console.log(`Successfully imported ${cleanedData.length} records into ${collectionName}`);
                 totalInserted += cleanedData.length;
            }
        }

        console.log(`\nImport Complete! Unified total of ${totalInserted} records successfully copied to school_management database.`);
        process.exit(0);

    } catch (error) {
        console.error('Import failed:', error);
        process.exit(1);
    }
}

importDatabase();
