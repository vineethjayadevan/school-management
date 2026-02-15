
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const Student = require('../models/Student');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB connected');
    } catch (err) {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    }
};

const run = async () => {
    await connectDB();

    try {
        const students = await Student.find({
            'transportation.mode': 'School Bus'
        });

        console.log(`\nFound ${students.length} students using School Bus.`);
        console.log('------------------------------------------------');

        for (const s of students) {
            let needsSave = false;

            // Fix invalid Previous Class if present
            const validClasses = ['Mont 1', 'Mont 2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5'];
            if (s.previousClass && !validClasses.includes(s.previousClass)) {
                console.log(`Fixing invalid previousClass for ${s.name}: ${s.previousClass} -> removed`);
                s.previousClass = undefined;
                needsSave = true;
            }

            // Fix invalid Transportation Mode if present
            if (s.transportation && s.transportation.mode === 'Private Transport') {
                s.transportation.mode = 'Private';
                needsSave = true;
            }

            const currentSlab = s.conveyanceSlab || 0;
            // Only update if no slab is set (or force update for testing if needed, here we update if 0)
            if (currentSlab === 0) {
                const newSlab = Math.floor(Math.random() * 5) + 1; // 1 to 5
                s.conveyanceSlab = newSlab;
                needsSave = true;

                const monthlyFee = 200 + (newSlab * 100);
                console.log(`Updated: ${s.name} (${s.admissionClass || s.className}) -> Slab ${newSlab} (₹${monthlyFee}/mo)`);
            } else {
                console.log(`Skipped: ${s.name} (Already has Slab ${currentSlab})`);
            }

            if (needsSave) {
                await s.save({ validateBeforeSave: false }); // Bypass validation for other potential legacy issues, or use regular save if confident
            }
        }

    } catch (err) {
        console.error(err);
    } finally {
        mongoose.connection.close();
    }
};

run();
