require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');
const Student = require('../models/Student');

const excelPath = "C:\\Users\\vinee\\Downloads\\cash receipts 2026-27.xls";
const outputPath = "C:\\Users\\vinee\\Desktop\\AG Projects\\school-management\\6500_paid_students.txt";

// Helper to convert Excel date serial to readable date string
function excelDateToJSDate(serial) {
    if (!serial || isNaN(serial)) return serial;
    const utc_days = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400;                                        
    const date_info = new Date(utc_value * 1000);
    const fractional_day = serial - Math.floor(serial) + 0.0000001;
    let total_seconds = Math.floor(86400 * fractional_day);
    const seconds = total_seconds % 60;
    total_seconds -= seconds;
    const hours = Math.floor(total_seconds / (60 * 60));
    const minutes = Math.floor(total_seconds / 60) % 60;
    date_info.setHours(hours, minutes, seconds);
    return date_info.toLocaleDateString('en-GB'); // dd/mm/yyyy
}

async function runMatch() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB.");

        const workbook = xlsx.readFile(excelPath);
        const sheetName = workbook.SheetNames[0];
        const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });

        const students6500 = [];

        // Skip header row
        for (let i = 1; i < data.length; i++) {
            const row = data[i];
            if (!row || row.length < 4) continue;

            const dateSerial = row[0];
            const nameStr = row[1];
            const type = row[2];
            const amount = row[3];

            if (Number(amount) === 6500) {
                let name = String(nameStr).trim();
                let admnMatch = name.match(/\(\s*(\d+)\s*\)?/);
                let admnFromExcel = admnMatch ? admnMatch[1] : null;
                
                if (admnMatch) {
                    name = name.replace(/\(\s*\d+\s*\)?/, '').trim();
                }

                students6500.push({
                    originalStr: nameStr,
                    name: name,
                    date: excelDateToJSDate(dateSerial),
                    admnFromExcel: admnFromExcel,
                    amount: amount
                });
            }
        }

        console.log(`Found ${students6500.length} entries with amount exactly 6500.`);

        const outputLines = [];
        outputLines.push("STUDENTS WHO PAID EXACTLY 6500");
        outputLines.push("---------------------------------------------------------");
        outputLines.push(String("NAME").padEnd(30) + String("DATE").padEnd(15) + "ADMISSION NO");
        outputLines.push("---------------------------------------------------------");

        let matchedCount = 0;
        let unmatchedCount = 0;

        for (const record of students6500) {
            let query = {};
            const escapedName = record.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            
            if (record.admnFromExcel) {
                query.admissionNo = record.admnFromExcel;
            } else {
                query.name = new RegExp('^' + escapedName + '$', 'i');
            }

            const dbStudent = await Student.findOne(query);

            let finalAdmn = 'NOT FOUND IN DB';
            if (dbStudent) {
                finalAdmn = dbStudent.admissionNo;
                matchedCount++;
            } else {
                const nameMatch = await Student.findOne({ name: new RegExp(escapedName, 'i') });
                if (nameMatch) {
                    finalAdmn = nameMatch.admissionNo;
                    matchedCount++;
                } else {
                    unmatchedCount++;
                }
            }

            outputLines.push(String(record.name).padEnd(30) + String(record.date).padEnd(15) + finalAdmn);
        }

        outputLines.push("---------------------------------------------------------");
        outputLines.push(`Total Processed: ${students6500.length}`);
        outputLines.push(`Matched in DB: ${matchedCount}`);
        outputLines.push(`Not Found in DB: ${unmatchedCount}`);

        fs.writeFileSync(outputPath, outputLines.join('\n'));
        console.log(`Report generated successfully at ${outputPath}`);

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

runMatch();
