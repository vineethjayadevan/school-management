const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Student = require('../models/Student');
const Enquiry = require('../models/Enquiry');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
};

const clearData = async () => {
    await connectDB();
    try {
        const studentResult = await Student.deleteMany({});
        console.log(`Students removed: ${studentResult.deletedCount}`);

        const enquiryResult = await Enquiry.deleteMany({});
        console.log(`Enquiries removed: ${enquiryResult.deletedCount}`);

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

clearData();
