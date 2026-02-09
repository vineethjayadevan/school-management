const mongoose = require('mongoose');
const Student = require('./models/Student');
require('dotenv').config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const students = await Student.find({ 'documents.0': { $exists: true } }).limit(5);

        console.log('--- Students with Documents ---');
        students.forEach(s => {
            console.log(`Student: ${s.name} (${s._id})`);
            console.log('Documents:', JSON.stringify(s.documents, null, 2));
            console.log('---------------------------');
        });

        process.exit();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

connectDB();
