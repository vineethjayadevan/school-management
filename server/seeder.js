const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

dotenv.config();

const users = [
    {
        name: 'Super User',
        email: 'super@school.com',
        password: 'password123',
        role: 'superuser'
    },
    {
        name: 'Admin User',
        email: 'admin@school.com',
        password: 'password123',
        role: 'admin'
    },
    {
        name: 'Office Staff',
        email: 'office@school.com',
        password: 'password123',
        role: 'office_staff'
    },
    {
        name: 'Teacher User',
        email: 'teacher@school.com',
        password: 'password123',
        role: 'teacher'
    },
    {
        name: 'Student User',
        email: 'student@school.com',
        password: 'password123',
        role: 'student'
    }
];

const seedUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        for (const user of users) {
            // Delete if exists to ensure clean state and correct password
            await User.deleteOne({ email: user.email });

            // Create fresh
            await User.create(user);
            console.log(`Created user ${user.email}`);
        }

        console.log('Seeding complete!');
        process.exit();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

seedUsers();
