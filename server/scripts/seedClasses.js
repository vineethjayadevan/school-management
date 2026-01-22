const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Class = require('../models/Class');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const seedData = async () => {
    await connectDB();

    const classesToSeed = [
        { name: 'KG1', sections: ['A'] },
        { name: 'KG2', sections: ['A'] },
        { name: 'Class 1', sections: ['A'] },
        { name: 'Class 2', sections: ['A'] },
        { name: 'Class 3', sections: ['A'] },
        { name: 'Class 4', sections: ['A'] },
        { name: 'Class 5', sections: ['A'] },
    ];

    try {
        for (const cls of classesToSeed) {
            const exists = await Class.findOne({ name: cls.name });
            if (!exists) {
                await Class.create(cls);
                console.log(`Created: ${cls.name}`);
            } else {
                console.log(`Skipped (Exists): ${cls.name}`);
                // Optional: Ensure 'A' section exists even if class exists?
                // For now, let's respect existing data, maybe user deleted it intentionally.
                // But user asked "by default add...". Let's assume just existence check is enough.
            }
        }

        console.log('Class Seeding Completed');
        process.exit();
    } catch (error) {
        console.error('Error with seeding', error);
        process.exit(1);
    }
};

seedData();
