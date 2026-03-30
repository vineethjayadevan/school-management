const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function backupDatabase() {
    try {
        // Use the hardcoded correct URI just in case .env hasn't been saved yet
        const uri = 'mongodb+srv://vineethjay1998_db_user:vineeth_school_management@cluster0.k6cxmia.mongodb.net/test?appName=Cluster0';
        console.log("Connecting to:", uri);
        
        const client = await mongoose.connect(uri);
        console.log('Connected to database:', client.connection.name);
        
        const backupDir = path.join(__dirname, 'backup', `test_db_backup_${Date.now()}`);
        if (!fs.existsSync(backupDir)){
            fs.mkdirSync(backupDir, { recursive: true });
        }

        console.log(`Creating backup in: ${backupDir}`);
        const collections = await client.connection.db.listCollections().toArray();
        let totalDocs = 0;

        for (const col of collections) {
            const collectionName = col.name;
            const documents = await client.connection.db.collection(collectionName).find({}).toArray();
            
            if (documents.length > 0) {
                const filePath = path.join(backupDir, `${collectionName}.json`);
                fs.writeFileSync(filePath, JSON.stringify(documents, null, 2));
                console.log(`- Backed up ${collectionName}: ${documents.length} records`);
                totalDocs += documents.length;
            }
        }

        console.log(`\nBackup Complete! Total records backed up: ${totalDocs}`);
        process.exit(0);
    } catch (error) {
        console.error('Backup failed:', error.message);
        process.exit(1);
    }
}

backupDatabase();
