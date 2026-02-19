const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const StaffCategory = require('../models/StaffCategory');

const seedCategories = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const categories = [
            {
                name: 'Teacher',
                isTeaching: true,
                subcategories: ['Primary', 'Secondary', 'Senior Secondary', 'Head of Department']
            },
            {
                name: 'Non-Teaching',
                isTeaching: false,
                subcategories: ['Admin', 'Clerk', 'Accountant', 'Librarian', 'Lab Assistant', 'Peon', 'Cleaner', 'Security']
            },
            {
                name: 'Vehicle In-Charge',
                isTeaching: false,
                subcategories: ['Driver', 'Helper', 'Conductor']
            }
        ];

        for (const cat of categories) {
            const exists = await StaffCategory.findOne({ name: cat.name });
            if (!exists) {
                await StaffCategory.create(cat);
                console.log(`Created category: ${cat.name}`);
            } else {
                console.log(`Category exists: ${cat.name}`);
                // Update isTeaching if needed?
                if (cat.isTeaching !== exists.isTeaching) {
                    exists.isTeaching = cat.isTeaching;
                    await exists.save();
                    console.log(`Updated isTeaching for ${cat.name}`);
                }
            }
        }

        console.log('Seeding complete.');
    } catch (e) {
        console.error(e);
    } finally {
        mongoose.disconnect();
    }
};

seedCategories();
