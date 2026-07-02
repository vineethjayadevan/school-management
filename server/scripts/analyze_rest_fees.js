require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const xlsx = require('xlsx');
const fs = require('fs');
const Student = require('../models/Student');
const Fee = require('../models/Fee');

const excelPath = "C:\\Users\\vinee\\Downloads\\cash receipts 2026-27.xls";
const outputPath = "C:\\Users\\vinee\\Desktop\\AG Projects\\school-management\\remaining_fees_analysis.txt";

function excelDateToJSDate(serial) {
    if (!serial || isNaN(serial)) return serial;
    const utc_days = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400;                                        
    const date_info = new Date(utc_value * 1000);
    return date_info.toLocaleDateString('en-GB'); // dd/mm/yyyy
}

async function analyze() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB.");

        const outputLines = [];

        // 1. Verify already entered 6500 entries have no duplicates in DB
        const recentFees = await Fee.find({ amount: 6500, status: 'Paid' }).populate('student', 'admissionNo name');
        const dbCounts = {};
        let duplicateInDb = false;

        for (const fee of recentFees) {
            if (!fee.student) continue;
            const key = `${fee.student.admissionNo}_${fee.paymentDate.toISOString().split('T')[0]}`;
            if (!dbCounts[key]) dbCounts[key] = 0;
            dbCounts[key]++;
            if (dbCounts[key] > 1) {
                if (!duplicateInDb) {
                    outputLines.push("=== WARNING: DUPLICATE 6500 ENTRIES FOUND IN DB ===");
                    duplicateInDb = true;
                }
                outputLines.push(`Duplicate found for Admn: ${fee.student.admissionNo}, Date: ${fee.paymentDate.toLocaleDateString()}`);
            }
        }
        
        if (!duplicateInDb) {
            outputLines.push("=== DB VERIFICATION ===");
            outputLines.push("✅ Verified: No duplicate 6500 entries exist for the same student on the same date in the DB.");
            outputLines.push("");
        }

        // 2. Parse Excel
        const workbook = xlsx.readFile(excelPath);
        const sheetName = workbook.SheetNames[0];
        const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });

        const restEntries = [];
        const studentGroups = {};

        // Skip header row
        for (let i = 1; i < data.length; i++) {
            const row = data[i];
            if (!row || row.length < 4) continue;

            const dateSerial = row[0];
            const nameStr = String(row[1]).trim();
            const type = row[2];
            const amount = Number(row[3]);

            if (isNaN(amount) || amount === 6500) {
                continue; // Skip 6500 entries as they are already done
            }

            let admnMatch = nameStr.match(/\(\s*(\d+)\s*\)?/);
            let admn = admnMatch ? admnMatch[1] : null;
            let name = nameStr;
            
            if (admnMatch) {
                name = nameStr.replace(/\(\s*\d+\s*\)?/, '').trim();
            }

            const record = {
                name: name,
                admn: admn || 'UNKNOWN',
                date: excelDateToJSDate(dateSerial),
                amount: amount
            };
            
            const groupKey = admn || name;
            
            if (!studentGroups[groupKey]) {
                studentGroups[groupKey] = [];
            }
            studentGroups[groupKey].push(record);
            restEntries.push(record);
        }

        // Categorize
        const multiplePayments = [];
        const singlePayments = [];

        for (const key in studentGroups) {
            if (studentGroups[key].length > 1) {
                multiplePayments.push(studentGroups[key]);
            } else {
                singlePayments.push(studentGroups[key][0]);
            }
        }

        outputLines.push("=== ANALYSIS OF REMAINING ENTRIES (Amount != 6500) ===");
        outputLines.push(`Total Remaining Entries: ${restEntries.length}`);
        outputLines.push("");
        
        outputLines.push("=== STUDENTS WITH MULTIPLE PAYMENTS ===");
        if (multiplePayments.length === 0) {
            outputLines.push("None found.");
        } else {
            multiplePayments.forEach(group => {
                outputLines.push(`Student: ${group[0].name} (Admn: ${group[0].admn}) -> ${group.length} Payments`);
                group.forEach(p => {
                    outputLines.push(`    - Date: ${p.date.padEnd(12)} Amount: ₹${p.amount}`);
                });
                outputLines.push("");
            });
        }

        outputLines.push("");
        outputLines.push("=== STUDENTS WITH SINGLE PAYMENT ===");
        if (singlePayments.length === 0) {
            outputLines.push("None found.");
        } else {
            outputLines.push(String("NAME").padEnd(30) + String("ADMISSION NO").padEnd(15) + String("DATE").padEnd(15) + "AMOUNT");
            outputLines.push("----------------------------------------------------------------------");
            singlePayments.forEach(p => {
                outputLines.push(String(p.name).padEnd(30) + String(p.admn).padEnd(15) + String(p.date).padEnd(15) + `₹${p.amount}`);
            });
        }

        fs.writeFileSync(outputPath, outputLines.join('\n'));
        console.log(`Analysis complete. Report generated at ${outputPath}`);

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

analyze();
