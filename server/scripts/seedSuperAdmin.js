const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config();

const seedSuperAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const superAdminExists = await User.findOne({ role: 'superadmin' });
        if (superAdminExists) {
            console.log('Superadmin already exists in the database.');
            process.exit(0);
        }

        const superadmin = new User({
            name: 'System Administrator',
            username: 'superadmin',
            password: 'superpassword123', // You MUST reset this upon first login
            role: 'superadmin',
            isActive: true
        });

        await superadmin.save();
        console.log('Successfully seeded superadmin user.');
        console.log('Username: superadmin');
        console.log('Password: superpassword123');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding superadmin:', error);
        process.exit(1);
    }
}

seedSuperAdmin();
