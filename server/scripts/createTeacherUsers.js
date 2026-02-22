const mongoose = require('mongoose');
const Staff = require('../models/Staff');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: 'server/.env' });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error.message);
        process.exit(1);
    }
};

const createTeacherUsers = async () => {
    await connectDB();
    try {
        // Find all staff who are teachers
        const teachers = await Staff.find({
            $or: [
                { role: 'Teacher' },
                { category: 'Teacher' }
            ]
        });

        console.log(`Found ${teachers.length} teachers.`);

        for (const teacher of teachers) {
            // Generate base username from name (lowercase, no spaces)
            const baseName = teacher.name.toLowerCase().replace(/\s+/g, '');
            const email = `${baseName}@mystemgps.com`;
            const password = `${baseName}@stem`;

            // Check if user already exists
            let user = await User.findOne({ email });

            if (user) {
                console.log(`User already exists for ${teacher.name} (${email})`);
                // Optional: Update profileId if missing
                if (!user.profileId) {
                    user.profileId = teacher._id;
                    user.role = 'teacher';
                    await user.save();
                    console.log(`Updated profileId for ${teacher.name}`);
                }
                continue;
            }

            // Create new user
            user = new User({
                name: teacher.name,
                email: email,
                password: password, // Will be hashed by pre-save hook
                role: 'teacher',
                profileId: teacher._id,
                avatar: teacher.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(teacher.name)}&background=random`
            });

            await user.save();
            console.log(`Created user for ${teacher.name}: Email: ${email}, Password: ${password}`);
        }

        console.log('Teacher user creation process completed.');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        mongoose.disconnect();
    }
};

createTeacherUsers();
