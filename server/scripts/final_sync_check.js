require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const xlsx = require('xlsx');
const path = require('path');
const Student = require('../models/Student');

const excelPath = "C:\\Users\\vinee\\Desktop\\AG Projects\\Stemgps_Data\\final Student List\\All Students details 2026-27.xlsx";

async function runCheck() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB.");

        const workbook = xlsx.readFile(excelPath);
        const sheets = workbook.SheetNames;
        const excelStudents = [];

        sheets.forEach(sheetName => {
            const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, defval: '' });
            
            if (rows.length > 1) {
                // Find column indexes by inspecting row 0 (headers)
                // Since they use weird bold unicode, we can just strip non-ascii or use regex
                let headers = rows[0].map(h => String(h).normalize("NFKD").replace(/[^\x20-\x7E]/g, "").toLowerCase());
                
                // Fallback column indices if headers are totally empty/weird: usually Admn is col 2, Name is col 3
                let admnIdx = headers.findIndex(h => h.includes('admn') || h.includes('admission'));
                let nameIdx = headers.findIndex(h => h.includes('name') || h.includes('student'));
                
                // If not found using normalized text, assume standard columns: 2 for Admn, 3 for Name
                if (admnIdx === -1) admnIdx = 2;
                if (nameIdx === -1) nameIdx = 3;

                // Process data rows
                for (let i = 1; i < rows.length; i++) {
                    let row = rows[i];
                    let admn = String(row[admnIdx] || '').trim();
                    let name = String(row[nameIdx] || '').trim();

                    // Skip empty rows
                    if (!name && !admn) continue;

                    // Handle Grade 2 swap if it's still present in the file
                    if (sheetName === "Grade 2" && /[a-zA-Z]/.test(admn) && /^\d+$/.test(name)) {
                        let temp = name;
                        name = admn;
                        admn = temp;
                    }

                    if (name && admn && admn !== 'Admn. no') {
                        excelStudents.push({ name, admn, sheet: sheetName });
                    }
                }
            }
        });

        console.log(`\nFound ${excelStudents.length} students in Excel.`);

        // Read Active DB Students
        const dbStudents = await Student.find({
            isActive: { $ne: false },
            studentStatus: { $nin: ['Transferred', 'Archived'] }
        });
        console.log(`Found ${dbStudents.length} ACTIVE students in DB.`);

        // Find discrepancies
        let missingInDb = [];
        let missingInExcel = [];
        
        let dbAdmnSet = new Set(dbStudents.map(s => String(s.admissionNo).trim()));
        let exAdmnSet = new Set(excelStudents.map(s => String(s.admn).trim()));

        excelStudents.forEach(ex => {
            if (!dbAdmnSet.has(ex.admn)) missingInDb.push(ex);
        });

        dbStudents.forEach(db => {
            if (!exAdmnSet.has(String(db.admissionNo).trim())) missingInExcel.push(db);
        });

        console.log("\n=== REPORT ===");
        if (missingInDb.length === 0) {
            console.log("✅ All Excel students exist in DB as Active.");
        } else {
            console.log(`❌ ${missingInDb.length} Excel students missing from DB active records:`);
            missingInDb.forEach(s => console.log(` - [${s.sheet}] ${s.name} (Admn: ${s.admn})`));
        }

        if (missingInExcel.length === 0) {
            console.log("✅ All active DB students exist in Excel.");
        } else {
            console.log(`❌ ${missingInExcel.length} Active DB students are NOT in Excel:`);
            missingInExcel.forEach(s => console.log(` - ${s.name} (Admn: ${s.admissionNo})`));
        }

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

runCheck();
