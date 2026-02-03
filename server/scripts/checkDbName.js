const mongoose = require('mongoose');
const dotenv = require('dotenv');
const colors = require('colors');
const User = require('../models/User');

dotenv.config({ path: './server/.env' });

const checkDbName = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);

        console.log(`MongoDB Connected: ${conn.connection.host}`.cyan.underline);
        console.log(`Database Name: ${conn.connection.name}`.yellow.bold);

        const userCount = await User.countDocuments();
        console.log(`User Count in '${conn.connection.name}': ${userCount}`.magenta);

        if (userCount > 0) {
            const users = await User.find().select('email');
            console.log('Existing Users:', users.map(u => u.email));
        }

        process.exit();
    } catch (error) {
        console.error(`Error: ${error.message}`.red.underline.bold);
        process.exit(1);
    }
};

checkDbName();
