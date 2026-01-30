const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const photoMap = [
    { email: 'jayadevanv@mystemgps.com', photo: 'Jayadevan.jpeg' },
    { email: 'jayarajv@mystemgps.com', photo: 'Jayaraj.jpeg' },
    { email: 'shajip@mystemgps.com', photo: 'Shaji.jpeg' },
    { email: 'sitharasaj@mystemgps.com', photo: 'Sithara.jpeg' },
    { email: 'sabirats@mystemgps.com', photo: 'Sabira.jpeg' },
    { email: 'sabnap@mystemgps.com', photo: 'Sabna.jpeg' },
    { email: 'fathimat@mystemgps.com', photo: 'Fathima.jpeg' },
    { email: 'rameenaj@mystemgps.com', photo: 'Raameena.jpeg' },
    { email: 'regivgeorge@mystemgps.com', photo: 'Reji.jpeg' },
    // Shameer Ali skipped as per request
];

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const updatePhotos = async () => {
    try {
        await connectDB();
        console.log('Updating board member photos...');

        for (const item of photoMap) {
            const user = await User.findOne({ email: item.email });
            if (user) {
                // Determine full path or relative path. 
                // Since these are in public/images/boardmembers, we can store the path relative to public.
                // Assuming frontend just needs src="/images/boardmembers/Filename.jpeg"
                user.avatar = `/images/boardmembers/${item.photo}`;
                await user.save();
                console.log(`Updated photo for: ${item.email}`);
            } else {
                console.log(`User not found: ${item.email}`);
            }
        }

        console.log('Photo update complete.');
        process.exit();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

updatePhotos();
