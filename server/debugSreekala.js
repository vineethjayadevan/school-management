const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');
const Staff = require('./models/Staff');
const Class = require('./models/Class');

async function debugSreekala() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        console.log('\n--- ALL STAFF MEMBERS ---');
        const allStaff = await Staff.find({});
        allStaff.forEach(s => {
            console.log(`Staff: "${s.name}", ID: ${s._id}, Role: ${s.role}, Email: ${s.email}`);
        });

        console.log('\n--- ALL USERS ---');
        const allUsers = await User.find({});
        allUsers.forEach(u => {
            console.log(`User: "${u.name}", Username: "${u.username}", Email: "${u.email}", Role: ${u.role}, ProfileId: ${u.profileId}`);
        });

        const sreekalaStaff = allStaff.find(s => s.name.includes('Sreekala'));
        if (sreekalaStaff) {
            console.log(`\nFound Sreekala Staff: ${sreekalaStaff._id}`);
            const classes = await Class.find({ "sections.classTeacher": sreekalaStaff._id });
            console.log(`Assigned Classes Count: ${classes.length}`);
            classes.forEach(c => console.log(` - Class: ${c.name}`));
        }

        process.exit(0);
    } catch (error) {
        console.error('Debug failed:', error);
        process.exit(1);
    }
}

debugSreekala();
