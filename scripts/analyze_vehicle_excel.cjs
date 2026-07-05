const mongoose = require('mongoose');
const XLSX = require('xlsx');

// MongoDB Connection URI
const MONGODB_URI = 'mongodb+srv://vineethjay1998_db_user:vineeth_school_management@cluster0.k6cxmia.mongodb.net/school_management?appName=Cluster0';

const studentSchema = new mongoose.Schema({
    admissionNo: String,
    name: String,
    status: String
}, { strict: false });

const Student = mongoose.model('Student', studentSchema);

async function analyze() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const workbook = XLSX.readFile('C:\\Users\\vinee\\Downloads\\VEHICLE LIST FULL 26-27.xlsx');
        
        let currentBusNumber = null;
        const studentsInExcel = [];
        const newStudents = [];
        const matchingStudents = [];

        for (const sheetName of workbook.SheetNames) {
            const sheet = workbook.Sheets[sheetName];
            const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

            for (const row of data) {
                if (row.length === 0 || !row[0]) continue;
                
                const col1 = String(row[0]).trim();
                
                if (col1.toUpperCase().startsWith('BUS NO')) {
                    currentBusNumber = col1;
                    continue;
                }

                // If it looks like a student row (has admission number in parenthesis)
                const match = col1.match(/(.*?)\s*\(\s*(\d+)\s*\)/);
                if (match) {
                    const name = match[1].trim();
                    const admissionNo = match[2].trim();
                    const monthlyFee = Number(row[1]) || 0;
                    
                    studentsInExcel.push({
                        name,
                        admissionNo,
                        monthlyFee,
                        busNumber: currentBusNumber
                    });
                }
            }
        }

        console.log(`Found ${studentsInExcel.length} students in Excel.`);

        for (const s of studentsInExcel) {
            const dbStudent = await Student.findOne({ admissionNo: s.admissionNo });
            
            if (dbStudent) {
                matchingStudents.push({
                    ...s,
                    dbName: dbStudent.name
                });
            } else {
                newStudents.push(s);
            }
        }

        console.log(`\nMatches found in DB: ${matchingStudents.length}`);
        console.log(`New students NOT in DB: ${newStudents.length}`);

        if (newStudents.length > 0) {
            console.log('\n--- NEW STUDENTS ---');
            newStudents.forEach(s => {
                console.log(`${s.name} (Adm: ${s.admissionNo}) - Bus: ${s.busNumber} - Fee: ${s.monthlyFee}`);
            });
        }

        // Output some stats
        const fs = require('fs');
        fs.writeFileSync('C:\\Users\\vinee\\.gemini\\antigravity\\brain\\efc261d2-2dd7-4efb-9266-d70312d7223d\\scratch\\analysis_results.json', JSON.stringify({
            totalExcel: studentsInExcel.length,
            matchingCount: matchingStudents.length,
            newCount: newStudents.length,
            newStudents
        }, null, 2));

    } catch (error) {
        console.error('Error during analysis:', error);
    } finally {
        await mongoose.disconnect();
    }
}

analyze();
