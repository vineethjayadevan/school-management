const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Student = require('../models/Student');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const studentsData = [
    {
        applicationNo: "APP2024-001",
        submissionDate: "2024-03-10",
        admissionNo: "ADM2024-001",
        firstName: "Aarav",
        lastName: "Menon",
        dob: "2020-05-14",
        gender: "Male",
        className: "Mont 1",
        placeOfBirth: "Palakkad",
        nationality: "Indian",
        fatherName: "Ramesh Menon",
        fatherMobile: "9876543210",
        motherName: "Anitha Menon",
        motherMobile: "9898765432",
        address: "Menon House, Ottapalam, Palakkad, Kerala"
    },
    {
        applicationNo: "APP2024-002",
        submissionDate: "2024-03-12",
        admissionNo: "ADM2024-002",
        firstName: "Diya",
        lastName: "Nair",
        dob: "2020-08-22",
        gender: "Female",
        className: "Mont 1",
        placeOfBirth: "Kozhikode",
        nationality: "Indian",
        fatherName: "Suresh Nair",
        fatherMobile: "9847012345",
        motherName: "Kavitha Nair",
        motherMobile: "9847098765",
        address: "Nair Villa, Nadakkavu, Kozhikode, Kerala"
    },
    {
        applicationNo: "APP2024-003",
        submissionDate: "2024-03-15",
        admissionNo: "ADM2024-003",
        firstName: "Arjun",
        lastName: "Krishnan",
        dob: "2019-04-03",
        gender: "Male",
        className: "Mont 2",
        placeOfBirth: "Thrissur",
        nationality: "Indian",
        fatherName: "Pradeep Krishnan",
        fatherMobile: "9961456789",
        motherName: "Smitha Krishnan",
        motherMobile: "9961498765",
        address: "Krishnan Bhavan, Punkunnam, Thrissur, Kerala"
    },
    {
        applicationNo: "APP2024-004",
        submissionDate: "2024-03-16",
        admissionNo: "ADM2024-004",
        firstName: "Meera",
        lastName: "Pillai",
        dob: "2019-09-11",
        gender: "Female",
        className: "Mont 2",
        placeOfBirth: "Alappuzha",
        nationality: "Indian",
        fatherName: "Rajeev Pillai",
        fatherMobile: "9447123456",
        motherName: "Deepa Pillai",
        motherMobile: "9447198765",
        address: "Pillai House, Punnapra, Alappuzha, Kerala"
    },
    {
        applicationNo: "APP2024-005",
        submissionDate: "2024-03-18",
        admissionNo: "ADM2024-005",
        firstName: "Karthik",
        lastName: "Varma",
        dob: "2018-06-25",
        gender: "Male",
        className: "Grade 1",
        placeOfBirth: "Ernakulam",
        nationality: "Indian",
        fatherName: "Sanjay Varma",
        fatherMobile: "9895012345",
        motherName: "Neethu Varma",
        motherMobile: "9895098765",
        address: "Varma Residency, Kakkanad, Ernakulam, Kerala"
    },
    {
        applicationNo: "APP2024-006",
        submissionDate: "2024-03-19",
        admissionNo: "ADM2024-006",
        firstName: "Ananya",
        lastName: "Das",
        dob: "2018-11-02",
        gender: "Female",
        className: "Grade 1",
        placeOfBirth: "Kannur",
        nationality: "Indian",
        fatherName: "Mahesh Das",
        fatherMobile: "9567456789",
        motherName: "Radhika Das",
        motherMobile: "9567498765",
        address: "Das Nivas, Talap, Kannur, Kerala"
    },
    {
        applicationNo: "APP2024-007",
        submissionDate: "2024-03-20",
        admissionNo: "ADM2024-007",
        firstName: "Rahul",
        lastName: "R",
        dob: "2017-07-14",
        gender: "Male",
        className: "Grade 2",
        placeOfBirth: "Malappuram",
        nationality: "Indian",
        fatherName: "Rajan R",
        fatherMobile: "9846456789",
        motherName: "Shalini R",
        motherMobile: "9846498765",
        address: "Rose Villa, Manjeri, Malappuram, Kerala"
    },
    {
        applicationNo: "APP2024-008",
        submissionDate: "2024-03-21",
        admissionNo: "ADM2024-008",
        firstName: "Sreelakshmi",
        lastName: "Mohan",
        dob: "2017-10-30",
        gender: "Female",
        className: "Grade 2",
        placeOfBirth: "Kottayam",
        nationality: "Indian",
        fatherName: "Mohan Kumar",
        fatherMobile: "9747012345",
        motherName: "Latha Mohan",
        motherMobile: "9747098765",
        address: "Lakshmi Nilayam, Changanassery, Kottayam, Kerala"
    },
    {
        applicationNo: "APP2024-009",
        submissionDate: "2024-03-22",
        admissionNo: "ADM2024-009",
        firstName: "Adithya",
        lastName: "Balakrishnan",
        dob: "2016-03-18",
        gender: "Male",
        className: "Grade 3",
        placeOfBirth: "Kollam",
        nationality: "Indian",
        fatherName: "Balakrishnan Nair",
        fatherMobile: "9446012345",
        motherName: "Sujatha Nair",
        motherMobile: "9446098765",
        address: "Nair Bhavan, Kavanad, Kollam, Kerala"
    },
    {
        applicationNo: "APP2024-010",
        submissionDate: "2024-03-23",
        admissionNo: "ADM2024-010",
        firstName: "Niveditha",
        lastName: "S",
        dob: "2016-12-09",
        gender: "Female",
        className: "Grade 3",
        placeOfBirth: "Thiruvananthapuram",
        nationality: "Indian",
        fatherName: "Sunil S",
        fatherMobile: "9633012345",
        motherName: "Remya Sunil",
        motherMobile: "9633098765",
        address: "Sreenilayam, Kazhakkoottam, Thiruvananthapuram, Kerala"
    }
];

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
};

const seedStudents = async () => {
    await connectDB();
    try {
        // Clear existing just in case (though we did it already)
        // await Student.deleteMany({}); 

        for (const s of studentsData) {
            const student = new Student({
                applicationNo: s.applicationNo,
                submissionDate: new Date(s.submissionDate),
                admissionNo: s.admissionNo,
                name: `${s.firstName} ${s.lastName}`,
                rollNo: "Not Assigned",
                className: s.className,
                section: "A",
                gender: s.gender,
                dob: new Date(s.dob),
                placeOfBirth: s.placeOfBirth,
                nationality: s.nationality,

                // Parent Info
                guardian: s.fatherName, // Default to Father
                fatherName: s.fatherName,
                fatherMobile: s.fatherMobile,
                motherName: s.motherName,
                motherMobile: s.motherMobile,

                primaryPhone: s.fatherMobile, // Required field
                address: s.address,

                feesStatus: 'Pending',
                isActive: true
            });

            await student.save();
            console.log(`Added student: ${student.name} (${student.admissionNo})`);
        }

        console.log('All students seeded successfully!');
        process.exit();
    } catch (error) {
        console.error('Error seeding students:', error);
        process.exit(1);
    }
};

seedStudents();
