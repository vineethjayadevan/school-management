const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const migrateSections = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const classesCollection = mongoose.connection.collection('classes');
        const classes = await classesCollection.find({}).toArray();

        let updatedCount = 0;

        for (const cls of classes) {
            let needsUpdate = false;
            let newSections = [];

            if (cls.sections && cls.sections.length > 0) {
                // Check if first element is a string
                if (typeof cls.sections[0] === 'string') {
                    console.log(`Migrating class: ${cls.name}`);
                    newSections = cls.sections.map(secName => ({
                        name: secName,
                        classTeacher: null,
                        nanny: null
                    }));
                    needsUpdate = true;
                } else {
                    console.log(`Class ${cls.name} already in new format or empty.`);
                }
            }

            if (needsUpdate) {
                await classesCollection.updateOne(
                    { _id: cls._id },
                    { $set: { sections: newSections } }
                );
                console.log(`Updated ${cls.name}`);
                updatedCount++;
            }
        }

        console.log(`Migration complete. Updated ${updatedCount} classes.`);

    } catch (e) {
        console.error(e);
    } finally {
        mongoose.disconnect();
    }
};

migrateSections();
