const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function migrateRestore() {
    try {
        const uri = process.env.MONGO_URI;
        if (!uri) {
            console.error("ERROR: MONGO_URI not found in .env.");
            process.exit(1);
        }

        // Safety check: Ensure we are NOT on the test db if we think we are in prod
        // But the user will manually change the URI, so we just report where we are connecting.
        console.log("Connecting to target database:", uri.split('@')[1] || uri);

        await mongoose.connect(uri);
        const dbName = mongoose.connection.name;
        console.log('Connected to database:', dbName);

        // Get the latest backup folder
        const latestBackupFile = path.join(__dirname, 'backup', 'latest_backup.txt');
        if (!fs.existsSync(latestBackupFile)) {
            console.error("ERROR: latest_backup.txt not found. Please run migrate_backup.js first.");
            process.exit(1);
        }

        const backupDir = fs.readFileSync(latestBackupFile, 'utf8').trim();
        if (!fs.existsSync(backupDir)) {
            console.error(`ERROR: Backup directory not found: ${backupDir}`);
            process.exit(1);
        }

        console.log(`Restoring from: ${backupDir}`);
        const files = fs.readdirSync(backupDir).filter(f => f.endsWith('.json'));
        let totalInserted = 0;

        for (const file of files) {
            const collectionName = file.replace('.json', '');
            const filePath = path.join(backupDir, file);
            const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

            if (data.length === 0) {
                console.log(`- Skipping empty collection: ${collectionName}`);
                continue;
            }

            console.log(`- Restoring ${collectionName} (${data.length} records)...`);

            // Clean and convert data
            const cleanedData = data.map(doc => {
                // Restore ObjectIds
                const traverseAndConvert = (obj) => {
                    if (!obj || typeof obj !== 'object') return obj;
                    
                    for (let key in obj) {
                        if (key === '_id' && typeof obj[key] === 'string' && obj[key].length === 24) {
                            try { obj[key] = new mongoose.Types.ObjectId(obj[key]); } catch(e) {}
                        } else if (typeof obj[key] === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(obj[key])) {
                            // Basic ISO date detection
                            const date = new Date(obj[key]);
                            if (!isNaN(date.getTime())) obj[key] = date;
                        } else if (typeof obj[key] === 'object') {
                            traverseAndConvert(obj[key]);
                        }
                    }
                    return obj;
                };
                
                return traverseAndConvert(doc);
            });

            // Drop existing collection
            try {
                await mongoose.connection.db.dropCollection(collectionName);
                console.log(`  Dropped existing ${collectionName}`);
            } catch (err) {
                // Ignore if doesn't exist
            }

            // Insert data
            await mongoose.connection.db.collection(collectionName).insertMany(cleanedData);
            console.log(`  Successfully restored ${cleanedData.length} records.`);
            totalInserted += cleanedData.length;
        }

        console.log(`\nRestore Complete!`);
        console.log(`Total records restored: ${totalInserted}`);
        
        process.exit(0);
    } catch (error) {
        console.error('Restore failed:', error.message);
        process.exit(1);
    }
}

migrateRestore();
