const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const User = require('./models/User');

async function inspectDb(dbName) {
    try {
        const uri = process.env.MONGO_URI.replace('?', `${dbName}?`);
        const client = await mongoose.createConnection(uri).asPromise();
        console.log(`Connected to ${dbName}`);
        
        const UserModel = client.model('User', User.schema);
        const users = await UserModel.find({});
        console.log(`--- USERS IN ${dbName} ---`);
        users.forEach(u => {
            console.log(`User: ${u.email}, Role: ${u.role}`);
        });

        await client.close();
    } catch (error) {
        console.error(`Inspect ${dbName} failed:`, error);
    }
}

async function run() {
    await inspectDb('school_management');
    await inspectDb('school_management_prod');
    process.exit(0);
}

run();
