const xlsx = require('xlsx');
const mongoose = require('mongoose');
const Student = require('../models/Student');
const Fee = require('../models/Fee');
require('dns').setServers(['8.8.8.8']);

const MONGODB_URI = 'mongodb+srv://vineethjay1998_db_user:vineeth_school_management@cluster0.k6cxmia.mongodb.net/school_management?appName=Cluster0';

async function auditExcel() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to DB');

        const excelPath = 'C:\\Users\\vinee\\Downloads\\cash receipts 2026-27.xls';
        const workbook = xlsx.readFile(excelPath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = xlsx.utils.sheet_to_json(sheet);

        const students = await Student.find();
        const studentMap = new Map();
        students.forEach(s => studentMap.set(s.admissionNo, s));

        let missingAdmNo = [];
        let studentNotFound = [];
        let amountIsOne = [];
        let missingVehicleFee = []; // We tried to process partial vehicle fee but they had no vehicle fee assigned
        let validRows = 0;

        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            const rowNum = i + 2;
            const particulars = row['__EMPTY'] || row['PARTICULARS'] || row['Particulars'];
            let amount = row[' Debit '] || row['Credit'] || row['AMOUNT'] || row['Amount'];
            
            if (typeof amount === 'string') amount = parseFloat(amount.replace(/[^0-9.-]+/g, ''));

            if (!particulars || typeof particulars !== 'string') continue;

            let admNo = null;
            const matchParen = particulars.match(/\(\s*(\d+)\s*\)/);
            const matchAd = particulars.match(/AD\.?NO\s*:?\s*(\d+)/i);
            
            if (matchParen) admNo = matchParen[1];
            else if (matchAd) admNo = matchAd[1];
            
            if (!admNo) {
                missingAdmNo.push(`Row ${rowNum}: ${particulars} - Amt: ${amount}`);
                continue;
            }

            validRows++;
            const student = studentMap.get(admNo);
            if (!student) {
                studentNotFound.push(`Row ${rowNum}: Adm No: ${admNo} - Amt: ${amount}`);
                continue;
            }

            if (amount === 1) {
                amountIsOne.push(`Row ${rowNum}: Adm No: ${admNo} - Amt: ${amount}`);
                continue;
            }

            // Rules we processed:
            // 6500 (done)
            // >= 2000 (done)
            // vehicle fee partial or full (done)
            let isProcessed = false;
            if (amount === 6500 || amount >= 2000) {
                isProcessed = true;
            } else if (student.monthlyConveyanceFee > 0) {
                isProcessed = true; // partial or full vehicle fee processed
            } else {
                missingVehicleFee.push(`Row ${rowNum}: Adm No: ${admNo} (${student.name}) - Amt: ${amount} (No vehicle fee assigned but amount < 2000)`);
            }
        }

        console.log('\n--- AUDIT RESULTS ---');
        console.log(`Total data rows in Excel: ${data.length}`);
        console.log(`Total valid rows with Admission No: ${validRows}`);
        console.log(`\n1. Rows where amount is 1 (Skipped by request): ${amountIsOne.length}`);
        console.log(`2. Rows with missing/unparseable Admission No: ${missingAdmNo.length}`);
        if(missingAdmNo.length > 0) console.log(missingAdmNo.slice(0, 10).join('\n'));
        console.log(`\n3. Rows where Student Adm No was not found in DB: ${studentNotFound.length}`);
        if(studentNotFound.length > 0) console.log(studentNotFound.slice(0, 10).join('\n'));
        console.log(`\n4. Rows under 2000 where student has NO vehicle fee assigned (Couldn't process): ${missingVehicleFee.length}`);
        if(missingVehicleFee.length > 0) console.log(missingVehicleFee.join('\n'));

        // Output to text file for user
        const report = `
AUDIT REPORT
============
Total rows in Excel: ${data.length}
Rows with parseable Adm No: ${validRows}

Pending / Unprocessed Items:
---------------------------
1. Amount is 1 (Intentionally Skipped): ${amountIsOne.length} rows
2. Unparseable Admission No: ${missingAdmNo.length} rows
${missingAdmNo.join('\n')}

3. Student Not Found in Database: ${studentNotFound.length} rows
${studentNotFound.join('\n')}

4. Amount < 2000 but student has NO vehicle fee assigned: ${missingVehicleFee.length} rows
${missingVehicleFee.join('\n')}
        `;
        require('fs').writeFileSync('excel_audit_report.txt', report);
        console.log('\nSaved full report to server/excel_audit_report.txt');

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

auditExcel();
