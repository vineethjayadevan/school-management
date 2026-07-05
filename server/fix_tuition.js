const mongoose = require('mongoose');
const FeeCategory = require('./models/FeeCategory');
const Fee = require('./models/Fee');
const Student = require('./models/Student');
require('dns').setServers(['8.8.8.8']);

const uri = 'mongodb+srv://vineethjay1998_db_user:vineeth_school_management@cluster0.k6cxmia.mongodb.net/school_management?appName=Cluster0';

async function fixTuition() {
    try {
        await mongoose.connect(uri);
        console.log('Connected to DB');

        const cats = await FeeCategory.find();
        console.log('Categories:', cats.map(c => c.name));
        
        const feesToUpdate = await Fee.find({ feeType: 'Tuition Fee' }).populate('student');
        console.log('Found', feesToUpdate.length, 'records with Tuition Fee');
        
        let studentsNames = [];

        for(let fee of feesToUpdate) {
            if (fee.student) {
                studentsNames.push(fee.student.name + ' (' + fee.student.admissionNo + ')');
            }
            fee.feeType = 'Tution Fee';
            if (fee.breakdown && fee.breakdown.length > 0) {
                fee.breakdown.forEach(b => { 
                    if(b.feeType === 'Tuition Fee') b.feeType = 'Tution Fee' 
                });
            }
            await fee.save();
        }

        console.log('Updated to Tution Fee successfully!');
        const uniqueStudents = [...new Set(studentsNames)];
        
        require('fs').writeFileSync('tuition_students.txt', uniqueStudents.join('\n'));
        console.log('Saved student names to tuition_students.txt');
    } catch(e) {
        console.error('Error:', e);
    } finally {
        await mongoose.disconnect();
    }
}

fixTuition();
