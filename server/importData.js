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

            const cleanedData = data.map(doc => {
                 // Restore ObjectIds
                 if (doc._id) doc._id = new mongoose.Types.ObjectId(doc._id);
                 
                 // Restore Date objects
                 if (doc.createdAt) doc.createdAt = new Date(doc.createdAt);
                 if (doc.updatedAt) doc.updatedAt = new Date(doc.updatedAt);
                 
                 return doc;
            });

            // Attempt to drop existing collection to start fresh
            try {
                await client.connection.db.dropCollection(collectionName);
                console.log(`Dropped existing collection: ${collectionName}`);
            } catch (err) {
                 // Ignore error if collection does not exist yet
            }

            // Insert new data
            await client.connection.db.collection(collectionName).insertMany(cleanedData);
            console.log(`Successfully imported ${cleanedData.length} records into ${collectionName}`);
            totalInserted += cleanedData.length;
        }

        console.log(`\nImport Complete! Unified total of ${totalInserted} records successfully copied to school_management database.`);
        process.exit(0);

    } catch (error) {
        console.error('Import failed:', error);
        process.exit(1);
    }
}

importDatabase();
