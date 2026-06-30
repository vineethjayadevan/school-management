require('dotenv').config();
const mongoose = require('mongoose');
const Student = require('../models/Student');
const fs = require('fs');
const path = require('path');

async function checkSwapped() {
    console.log("Connecting to Database...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected.");
    
    // Find students where name is purely digits (e.g., '2521')
    // or admissionNo is purely alphabetical/not a standard number.
    const allStudents = await Student.find({}, 'admissionNo name className applicationNo');
    
    let swapped = [];
    
    for (const st of allStudents) {
        // A simple check: if 'name' is just digits, it's likely an admission number
        const isNameNumber = /^\d+$/.test(st.name.trim());
        const isAdmnString = /^[a-zA-Z\s\.]+$/.test(st.admissionNo.trim());
        
        if (isNameNumber || isAdmnString || st.admissionNo === st.name || st.applicationNo === st.name) {
            swapped.push(st);
        }
    }
    
    const outputPath = path.join(__dirname, '..', 'data');
    let reportTxt = `=== STUDENTS WITH SWAPPED/INVALID ADMISSION NUMBERS ===\n\n`;
    
    swapped.forEach(st => {
        reportTxt += `Admn No: ${st.admissionNo} | Name: ${st.name} | Application No: ${st.applicationNo} | Class: ${st.className}\n`;
    });
    
    fs.writeFileSync(path.join(outputPath, 'swapped_students.txt'), reportTxt);
    
    console.log(`Found ${swapped.length} students with swapped or invalid admission numbers.`);
    
    mongoose.disconnect();
}

checkSwapped().catch(err => {
    console.error(err);
    mongoose.disconnect();
});
