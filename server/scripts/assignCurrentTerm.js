const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Student = require('../models/Student');
const AcademicYear = require('../models/AcademicYear');

dotenv.config();

const migrateStudentsToActiveYear = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected.');

        // 1. Find the currently active Academic Year
        const activeYear = await AcademicYear.findOne({ isActive: true });

        if (!activeYear) {
            console.error('ERROR: No active Academic Year found!');
            console.log('Please create an active Academic Year from the Admin UI first (e.g., "2024-2025").');
            process.exit(1);
        }

        console.log(`\nFound Active Academic Year: ${activeYear.name}`);

        // 2. Find all active students who do NOT have a currentAcademicYear assigned
        const studentsToMigrate = await Student.find({
            isActive: true,
            currentAcademicYear: { $exists: false }
        });

        if (studentsToMigrate.length === 0) {
            console.log('All active students already have an academic year assigned. No migration needed.');
            process.exit(0);
        }

        console.log(`Found ${studentsToMigrate.length} active students missing an Academic Year assignment.`);

        // 3. Update them
        console.log('Migrating students...');

        const result = await Student.updateMany(
            { isActive: true, currentAcademicYear: { $exists: false } },
            { $set: { currentAcademicYear: activeYear._id, promotionStatus: 'Active' } }
        );

        console.log(`\nSuccess!`);
        console.log(`${result.modifiedCount} students have been assigned to ${activeYear.name}.`);
        console.log('They are now ready to be processed by the Promotion Wizard.\n');

        process.exit(0);

    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

migrateStudentsToActiveYear();
