const mongoose = require('mongoose');
const Student = require('../models/Student');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const analyzeStudentData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const className = 'Mont 1';
        const sectionName = 'A';

        console.log(`Analyzing students for ${className} - ${sectionName}...`);

        // Exact controller query
        const statusQuery = await Student.find({
            className: className,
            section: sectionName,
            status: { $ne: 'Transferred' }
        }).sort({ name: 1 }).lean();

        console.log(`Found via controller query logic: ${statusQuery.length}`);

        statusQuery.forEach(s => {
            console.log(`- ${s.name} (ID: ${s._id}), status: ${s.status}`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.connection.close();
    }
};

analyzeStudentData();
