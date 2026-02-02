const Expense = require('./server/models/Expense');
const User = require('./server/models/User');
const connectDB = require('./server/config/db');
const dotenv = require('dotenv');

dotenv.config({ path: './server/.env' });

async function verifyCounts() {
    try {
        await connectDB();

        console.log('--- User Expense Counts ---');
        const shaji = await User.findOne({ email: 'shajip@mystemgps.com' });
        const jayaraj = await User.findOne({ email: 'jayarajv@mystemgps.com' });

        if (shaji) {
            const shajiCount = await Expense.countDocuments({ addedBy: shaji._id });
            console.log(`Shaji P: ${shajiCount} (Expected ~309)`);
        }

        if (jayaraj) {
            const jayarajCount = await Expense.countDocuments({ addedBy: jayaraj._id });
            console.log(`Jayaraj V: ${jayarajCount} (Expected 30)`);
        }

        const total = await Expense.countDocuments();
        console.log(`Total Expenses: ${total}`);

        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

verifyCounts();
