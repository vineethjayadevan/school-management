const mongoose = require('mongoose');
const dotenv = require('dotenv');
const dns = require('dns');

dotenv.config({ path: 'server/.env' });

if (process.env.NODE_ENV === 'development') {
    dns.setServers(['8.8.8.8']);
}

async function seedStudents() {
    console.log('Using MONGO_URI:', process.env.MONGO_URI);

    try {
        const client = await mongoose.connect(process.env.MONGO_URI);
        const db = mongoose.connection.db;
        console.log(`Connected to Database: ${db.databaseName}`);

        const academicYearsCol = db.collection('academicyears');
        const classesCol = db.collection('classes');
        const studentsCol = db.collection('students');

        const targetYear = await academicYearsCol.findOne({ name: '2026-2027' });
        if (!targetYear) {
            console.error('Academic Year 2026-2027 not found.');
            const years = await academicYearsCol.find({}).toArray();
            console.log('Available years:', years.map(y => y.name));
            process.exit(1);
        }

        const classes = await classesCol.find({}).toArray();
        console.log(`Found ${classes.length} classes. Target Year: ${targetYear.name}`);

        let totalCreated = 0;
        const timestamp = Date.now();

        for (const cls of classes) {
            if (!cls.sections || cls.sections.length === 0) continue;

            for (const section of cls.sections) {
                console.log(`Creating 10 students for ${cls.name} - ${section.name}...`);

                const studentsBatch = [];
                for (let i = 1; i <= 10; i++) {
                    const uniqueSuffix = `${timestamp}-${cls._id.toString().slice(-4)}-${section.name}-${i}`;
                    const admissionNo = `TEST-${uniqueSuffix}`;
                    const applicationNo = `APP-${uniqueSuffix}`;

                    studentsBatch.push({
                        admissionNo,
                        applicationNo,
                        name: `Test Student ${cls.name} ${section.name} ${i}`,
                        className: cls.name,
                        section: section.name,
                        guardian: 'Vineeth Jay',
                        fatherName: 'Vineeth Jay',
                        fatherMobile: '9562251492',
                        fatherEmail: 'vineethjay1998@gmail.com',
                        primaryPhone: '9562251492',
                        submissionDate: new Date(),
                        currentAcademicYear: targetYear._id,
                        studentStatus: 'Active',
                        promotionStatus: 'Active',
                        isActive: true,
                        feesStatus: 'Pending',
                        financialClearance: true,
                        academicHistory: [],
                        discounts: [],
                        siblings: [],
                        transportation: { mode: 'Walking' },
                        createdAt: new Date(),
                        updatedAt: new Date()
                    });
                }
                await studentsCol.insertMany(studentsBatch);
                totalCreated += 10;
            }
        }

        console.log(`Successfully created ${totalCreated} students using native driver.`);
        process.exit(0);
    } catch (error) {
        console.error('Error seeding students:', error);
        process.exit(1);
    }
}

seedStudents();
