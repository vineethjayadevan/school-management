const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function checkImport() {
    try {
        const client = await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to database:', client.connection.name);
        
        const collections = await client.connection.db.listCollections().toArray();
        let totalDocs = 0;

        console.log(`\n=== Collections in ${client.connection.name} ===`);
        for (const col of collections) {
            const count = await client.connection.db.collection(col.name).countDocuments();
            console.log(`- ${col.name}: ${count} documents`);
            totalDocs += count;
        }

        console.log(`\nTotal documents after migration: ${totalDocs}`);
        process.exit(0);
    } catch (error) {
        console.error('Check failed:', error.message);
        process.exit(1);
    }
}

checkImport();
