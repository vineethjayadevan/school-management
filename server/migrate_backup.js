const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function migrateBackup() {
    try {
        const uri = process.env.MONGO_URI;
        if (!uri) {
            console.error("ERROR: MONGO_URI not found in .env.");
            process.exit(1);
        }

        console.log("Connecting to source database:", uri.split('@')[1] || uri); // Hide credentials
        
        await mongoose.connect(uri);
        const dbName = mongoose.connection.name;
        console.log('Connected to database:', dbName);
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupDir = path.join(__dirname, 'backup', `migration_backup_${timestamp}`);
        
        if (!fs.existsSync(backupDir)){
            fs.mkdirSync(backupDir, { recursive: true });
        }

        console.log(`Creating backup in: ${backupDir}`);
        const collections = await mongoose.connection.db.listCollections().toArray();
        let totalDocs = 0;

        for (const col of collections) {
            const collectionName = col.name;
            // Skip system collections
            if (collectionName.startsWith('system.')) continue;
            
            console.log(`- Backing up ${collectionName}...`);
            const documents = await mongoose.connection.db.collection(collectionName).find({}).toArray();
            
            if (documents.length > 0) {
                const filePath = path.join(backupDir, `${collectionName}.json`);
                fs.writeFileSync(filePath, JSON.stringify(documents, null, 2));
                console.log(`  Done: ${documents.length} records`);
                totalDocs += documents.length;
            } else {
                console.log(`  Empty collection, skipping file creation.`);
            }
        }

        console.log(`\nBackup Complete!`);
        console.log(`Total records: ${totalDocs}`);
        console.log(`Backup Folder: ${backupDir}`);
        
        // Save the backup directory path for the restore script
        fs.writeFileSync(path.join(__dirname, 'backup', 'latest_backup.txt'), backupDir);
        
        process.exit(0);
    } catch (error) {
        console.error('Backup failed:', error.message);
        process.exit(1);
    }
}

migrateBackup();
