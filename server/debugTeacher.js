const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');
const Staff = require('./models/Staff');
const Class = require('./models/Class');

async function debugTeacherStats() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const email = 'priyawarrier@mystemgps.com';
        const user = await User.findOne({ email });

        if (!user) {
            console.log(`User not found for email: ${email}`);
            process.exit(0);
        }

        console.log(`User ID: ${user._id}`);
        console.log(`User Role: ${user.role}`);
        console.log(`User ProfileID: ${user.profileId}`);

        const staff = await Staff.findById(user.profileId);
        if (!staff) {
            console.log(`Staff record not found for ProfileID: ${user.profileId}`);
        } else {
            console.log(`Staff Name: ${staff.name}`);
            console.log(`Staff ID: ${staff._id}`);
        }

        const classes = await Class.find({ "sections.classTeacher": user.profileId });
        console.log(`Classes found as Class Teacher: ${classes.length}`);
        classes.forEach(c => {
            console.log(`- Class: ${c.name}`);
            c.sections.forEach(s => {
                if (s.classTeacher?.toString() === user.profileId?.toString()) {
                    console.log(`  - Section: ${s.name} (Matched)`);
                }
            });
        });

        const Timetable = require('./models/Timetable');
        const timetableEntries = await Timetable.find({ "periods.teacher": user.profileId });
        console.log(`Classes found in Timetable: ${timetableEntries.length}`);

        process.exit(0);
    } catch (error) {
        console.error('Debug failed:', error);
        process.exit(1);
    }
}

debugTeacherStats();
