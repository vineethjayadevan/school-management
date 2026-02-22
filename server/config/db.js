const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        if (process.env.NODE_ENV === 'development') {
            require('dns').setServers(['8.8.8.8']);
        }
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
