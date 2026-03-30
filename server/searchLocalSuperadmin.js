const mongoose = require('mongoose');

async function searchLocalSuperadmin() {
    try {
        const uriString = 'mongodb://127.0.0.1:27017/school_management';
        const client = await mongoose.createConnection(uriString).asPromise();
        const User = require('./models/User');
        const UserModel = client.model('User', User.schema);
        
        const superadmins = await UserModel.find({
            $or: [
                { email: { $regex: 'superadmin', $options: 'i' } },
                { username: { $regex: 'superadmin', $options: 'i' } },
                { role: 'superadmin' },
                { role: 'superuser' }
            ]
        });

        console.log(`\n=== Found Potential Superadmins in Local DB ===`);
        if (superadmins.length === 0) {
            console.log("No superadmins found.");
        } else {
            superadmins.forEach(u => {
                console.log(`Email: ${u.email} | Username: ${u.username} | Role: ${u.role}`);
            });
        }

        await client.close();
    } catch (error) {
        console.error(`Failed to inspect local DB:`, error.message);
    }
    process.exit(0);
}

searchLocalSuperadmin();
