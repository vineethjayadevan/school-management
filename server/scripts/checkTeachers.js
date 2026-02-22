const mongoose = require('mongoose');
const Staff = require('../models/Staff');
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

const checkTeachers = async () => {
    await connectDB();
    try {
        const staff = await Staff.find({});
        console.log(`Found ${staff.length} staff members.`);

        staff.forEach(s => {
            console.log(`Name: ${s.name}, Role: ${s.role}, Category: ${s.category}, Email: ${s.email}`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        mongoose.disconnect();
    }
};

checkTeachers();
