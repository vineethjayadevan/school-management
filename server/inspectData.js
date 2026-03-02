const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');
const Staff = require('./models/Staff');

async function inspectData() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const fs = require('fs');
        let output = 'Connected to MongoDB\n';

        output += '\n--- ALL USERS ---\n';
        const allUsers = await User.find({});
        allUsers.forEach(u => {
            output += `User: ${u.username || u.name}, Email: ${u.email}, Role: ${u.role}, ProfileID: ${u.profileId}\n`;
        });

        output += '\n--- ALL STAFF ---\n';
        const allStaff = await Staff.find({});
        allStaff.forEach(t => {
            output += `Staff: ${t.name}, ID: ${t._id}, Role: ${t.role}, Status: ${t.status}, Category: ${t.category}\n`;
        });

        fs.writeFileSync('inspection_results.txt', output, 'utf8');
        console.log('Results written to inspection_results.txt');
        process.exit(0);
    } catch (error) {
        console.error('Inspection failed:', error);
        process.exit(1);
    }
}

inspectData();
