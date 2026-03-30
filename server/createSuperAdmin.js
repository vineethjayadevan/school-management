const mongoose = require('mongoose');
const User = require('./models/User');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function createSuperAdmin() {
    try {
        console.log("Connecting to:", process.env.MONGO_URI);
        const client = await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to database:', client.connection.name);
        
        // Remove any existing superadmin just in case, to prevent duplication errors
        await User.deleteOne({ username: 'superadmin' });
        
        // Mongoose User model pre-save hook will automatically hash the 'Vineethsuper@stem' password for us
        const admin = await User.create({
            name: 'System Admin',
            username: 'superadmin',
            email: 'superadmin@mystemgps.com',
            password: 'Vineethsuper@stem',
            role: 'superadmin',
            isActive: true
        });

        console.log(`Successfully created System User:`);
        console.log(`Username: ${admin.username}`);
        console.log(`Role: ${admin.role}`);
        console.log(`ID: ${admin._id}`);
        
        process.exit(0);
    } catch (e) {
        console.error('Failed to create superadmin:', e.message);
        process.exit(1);
    }
}

createSuperAdmin();
