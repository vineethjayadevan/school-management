const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Student = require('../models/Student');

async function updateStudentContacts() {
    try {
        console.log('Connecting to MongoDB...');
        if (!process.env.MONGO_URI) {
            throw new Error('MONGO_URI not found in environment variables');
        }
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const newEmail = 'vineethjay1998@gmail.com';
        const newPhone = '9562251492';

        console.log(`Updating all students with Email: ${newEmail} and Phone: ${newPhone}...`);

        const result = await Student.updateMany({}, {
            $set: {
                fatherEmail: newEmail,
                motherEmail: newEmail,
                email: newEmail,
                fatherMobile: newPhone,
                motherMobile: newPhone,
                primaryPhone: newPhone
            }
        });

        console.log(`Successfully matched ${result.matchedCount} and updated ${result.modifiedCount} students.`);
        process.exit(0);
    } catch (error) {
        console.error('Update failed:', error);
        process.exit(1);
    }
}

updateStudentContacts();
