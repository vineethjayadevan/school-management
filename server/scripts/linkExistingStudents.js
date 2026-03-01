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
            // 2. Try matching by admissionNo (extracted from username/email)
            // 3. Try matching by name (case-insensitive)

            let student = null;
            const normalize = (val) => val ? val.toLowerCase().replace(/[^a-z0-9]/g, '').trim() : '';

            // 1. Try Email Match
            if (user.email) {
                student = await Student.findOne({ email: user.email });
            }

            // 2. Try Admission No Match (if username contains something like UN-2025-001)
            if (!student && user.username) {
                // Look for UN-XXXX-XXX pattern
                const admissionMatch = user.username.match(/UN-\d{4}-\d+/i);
                if (admissionMatch) {
                    student = await Student.findOne({ admissionNo: admissionMatch[0].toUpperCase() });
                }
            }

            // 3. Try Normalized Name Match
            if (!student) {
                const normalizedUserName = normalize(user.name);
                const allStudents = await Student.find({});
                student = allStudents.find(s => normalize(s.name) === normalizedUserName);
            }

            // Specific fallbacks for known test data
            if (!student) {
                const searchName = user.name.toLowerCase();
                if (searchName.includes('ayisha azrin')) student = await Student.findOne({ name: /Ayisha Azrin/i });
                else if (searchName.includes('aizam hazin')) student = await Student.findOne({ name: /Aizam Hazin/i });
                else if (searchName.includes('joshua mathew')) student = await Student.findOne({ name: /Joshua Mathew/i });
            }

            if (student) {
                user.profileId = student._id;
                await user.save();
                console.log(`✅ Linked User ${user.username || user.name} -> Student ${student.name} (${student.admissionNo})`);
            } else {
                console.warn(`❌ No match for User: ${user.name} (${user.username || 'no username'})`);
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
