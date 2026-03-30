const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function listDatabases() {
    try {
        const client = await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');
        
        const admin = client.connection.db.admin();
        const dbs = await admin.listDatabases();
        console.log('Databases in cluster:');
        dbs.databases.forEach(db => {
            console.log(` - ${db.name}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('List databases failed:', error);
        process.exit(1);
    }
}

listDatabases();
