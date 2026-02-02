const IncomeCategory = require('./server/models/IncomeCategory');
const connectDB = require('./server/config/db');
const dotenv = require('dotenv');

dotenv.config({ path: './server/.env' });

async function checkIncomeCats() {
    try {
        await connectDB();
        console.log('Connected DB');

        const categories = await IncomeCategory.find({});
        console.log('Existing Income Categories:');
        categories.forEach(c => console.log(`- ${c.name}`));

        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

checkIncomeCats();
