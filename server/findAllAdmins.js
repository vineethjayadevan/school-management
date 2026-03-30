const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const User = require('./models/User');

async function printUsers(dbName, uriString) {
    try {
        const client = await mongoose.createConnection(uriString).asPromise();
        
        // Register schema on this connection explicitly so we can query
        const UserModel = client.model('User', User.schema);
        const users = await UserModel.find({});
        console.log(`\n\n=== USERS IN ${dbName} (${users.length} total) ===`);
        users.forEach(u => {
             console.log(`Email: ${u.email || 'N/A'} | Username: ${u.username || 'N/A'} | Role: ${u.role}`);
        });

        await client.close();
    } catch (error) {
        console.error(`Failed to inspect ${dbName}:`, error.message);
    }
}

async function run() {
    const defaultUri = 'mongodb+srv://vineethjay1998_db_user:vineeth_school_management@cluster0.k6cxmia.mongodb.net/test?appName=Cluster0';
    const prodUri = 'mongodb+srv://vineethjay1998_db_user_prod:vineeth_school_management_prod_1998@cluster0.k6cxmia.mongodb.net/school_management_prod?appName=Cluster0';
    const otherUri = 'mongodb+srv://vineethjay1998_db_user:vineeth_school_management@cluster0.k6cxmia.mongodb.net/school_management?appName=Cluster0';

    await printUsers('test', defaultUri);
    await printUsers('school_management', otherUri);
    await printUsers('school_management_prod', prodUri);
    process.exit(0);
}

run();
