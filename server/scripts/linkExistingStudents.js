const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars from server/.env
dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Student = require('../models/Student');

const linkStudents = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected successfully.');

        // Find all student users without a profileId
        const studentUsers = await User.find({
            role: 'student',
            $or: [{ profileId: { $exists: false } }, { profileId: null }]
        });

        console.log(`Found ${studentUsers.length} student users to link.`);

        for (const user of studentUsers) {
            // Logic to find the matching student:
            // 1. Try matching by email (if exists)
            // 2. Try matching by name (case-insensitive)

            const normalize = (name) => name.toLowerCase().replace(/\s+/g, ' ').trim();
            const normalizedUserName = normalize(user.name);

            let student = null;
            if (user.email) {
                student = await Student.findOne({ email: user.email });
            }

            if (!student) {
                // Try to find a student whose normalized name matches
                const allStudents = await Student.find({});
                student = allStudents.find(s => normalize(s.name) === normalizedUserName);
            }

            // Specific fallbacks for the users we know about
            if (!student && normalizedUserName.includes('ayisha azrin')) {
                student = await Student.findOne({ name: /Ayisha Azrin/i });
            }
            if (!student && normalizedUserName.includes('aizam hazin')) {
                student = await Student.findOne({ name: /Aizam Hazin/i });
            }

            if (student) {
                user.profileId = student._id;
                await user.save();
                console.log(`Successfully linked User ${user.username || user.name} to Student ${student.name} (Admission: ${student.admissionNo})`);
            } else {
                console.warn(`Could not find a matching Student record for User: ${user.name} (${user.username || 'no username'})`);
            }
        }

        console.log('Finished linking students.');
        process.exit(0);
    } catch (error) {
        console.error('Error linking students:', error);
        process.exit(1);
    }
};

linkStudents();
