const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Student = require('../models/Student');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const migrateData = async () => {
    await connectDB();

    try {
        // Update KG 1 -> KG1
        const kg1Result = await Student.updateMany(
            { className: 'KG 1' },
            { $set: { className: 'KG1' } }
        );
        console.log(`Updated KG 1 students: ${kg1Result.modifiedCount}`);

        // Update KG 2 -> KG2
        const kg2Result = await Student.updateMany(
            { className: 'KG 2' },
            { $set: { className: 'KG2' } }
        );
        console.log(`Updated KG 2 students: ${kg2Result.modifiedCount}`);

        // Also check if any 'class' legacy field exists and update that too if necessary
        const kg1Legacy = await Student.updateMany(
            { class: 'KG 1' },
            { $set: { class: 'KG1' } }
        );
        if (kg1Legacy.modifiedCount > 0) console.log(`Updated legacy 'class' field for KG 1: ${kg1Legacy.modifiedCount}`);

        const kg2Legacy = await Student.updateMany(
            { class: 'KG 2' },
            { $set: { class: 'KG2' } }
        );
        if (kg2Legacy.modifiedCount > 0) console.log(`Updated legacy 'class' field for KG 2: ${kg2Legacy.modifiedCount}`);


        console.log('Migration Completed Successfully');
        process.exit();
    } catch (error) {
        console.error('Error with migration', error);
        process.exit(1);
    }
};

migrateData();
