require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Student = require('../models/Student');

async function deleteDuplicate() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB.");

        const result = await Student.deleteOne({ admissionNo: '2509' });
        
        if (result.deletedCount === 1) {
            console.log("Successfully deleted the duplicate Raiza Rashid (Admn No: 2509).");
        } else {
            console.log("Record not found or already deleted.");
        }

        process.exit(0);
    } catch (e) {
        console.error("Error deleting student:", e);
        process.exit(1);
    }
}

deleteDuplicate();
