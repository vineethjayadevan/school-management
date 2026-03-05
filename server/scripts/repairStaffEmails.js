const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const repair = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/school_management');
        console.log('Connected to database');

        const Staff = mongoose.model('Staff', new mongoose.Schema({ email: String }, { strict: false }));

        // 1. Convert all empty string emails to undefined
        const result = await Staff.updateMany(
            { email: "" },
            { $unset: { email: 1 } }
        );
        console.log(`Updated ${result.modifiedCount} records (converted "" to undefined)`);

        // 2. Drop the existing email index to allow Mongoose to recreate it as sparse
        try {
            await mongoose.connection.collection('staffs').dropIndex('email_1');
            console.log('Successfully dropped index: email_1');
        } catch (e) {
            if (e.codeName === 'IndexNotFound') {
                console.log('Index email_1 not found, skipping drop.');
            } else {
                console.error('Error dropping index:', e.message);
            }
        }

        console.log('Repair complete. Please restart the server to let Mongoose recreate the sparse index.');
        process.exit(0);
    } catch (error) {
        console.error('Repair failed:', error);
        process.exit(1);
    }
};

repair();
