const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function countCollections(dbName) {
    try {
        let uri = process.env.MONGO_URI;
        if (uri.includes('?')) {
            uri = uri.replace('?', `${dbName}?`);
        } else {
            uri = `${uri}/${dbName}`;
        }
        
        const client = await mongoose.createConnection(uri).asPromise();
        console.log(`\n=== Collections in ${dbName} ===`);
        
        const collections = await client.db.listCollections().toArray();
        for (const col of collections) {
            const count = await client.db.collection(col.name).countDocuments();
            console.log(`- ${col.name}: ${count} documents`);
        }

        await client.close();
    } catch (error) {
        console.error(`Failed to inspect ${dbName}:`, error.message);
    }
}

async function run() {
    await countCollections('test');
    await countCollections('school_management');
    await countCollections('school_management_prod');
    process.exit(0);
}

run();
