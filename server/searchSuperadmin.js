const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const User = require('./models/User');

async function searchSuperadmin(dbName, uriString) {
    try {
        const client = await mongoose.createConnection(uriString).asPromise();
        const UserModel = client.model('User', User.schema);
        
        const superadmins = await UserModel.find({
            $or: [
                { email: { $regex: 'superadmin', $options: 'i' } },
                { username: { $regex: 'superadmin', $options: 'i' } },
                { role: 'superadmin' },
                { role: 'superuser' }
            ]
        });

        console.log(`\n=== Found Potential Superadmins in ${dbName} ===`);
        if (superadmins.length === 0) {
            console.log("No superadmins found.");
        } else {
            superadmins.forEach(u => {
                console.log(`Email: ${u.email} | Username: ${u.username} | Role: ${u.role}`);
            });
        }

        await client.close();
    } catch (error) {
        console.error(`Failed to inspect ${dbName}:`, error.message);
    }
}

async function run() {
    const defaultUri = 'mongodb+srv://vineethjay1998_db_user:vineeth_school_management@cluster0.k6cxmia.mongodb.net/test?appName=Cluster0';
    const prodUri = 'mongodb+srv://vineethjay1998_db_user_prod:vineeth_school_management_prod_1998@cluster0.k6cxmia.mongodb.net/school_management_prod?appName=Cluster0';
    const otherUri = 'mongodb+srv://vineethjay1998_db_user:vineeth_school_management@cluster0.k6cxmia.mongodb.net/school_management?appName=Cluster0';

    await searchSuperadmin('test', defaultUri);
    await searchSuperadmin('school_management', otherUri);
    await searchSuperadmin('school_management_prod', prodUri);
    process.exit(0);
}

run();
