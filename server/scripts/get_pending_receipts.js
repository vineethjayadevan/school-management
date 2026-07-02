const xlsx = require('xlsx');
const mongoose = require('mongoose');
const fs = require('fs');
const Student = require('../models/Student');

const MONGODB_URI = 'mongodb+srv://vineethjay1998_db_user:vineeth_school_management@cluster0.k6cxmia.mongodb.net/school_management?appName=Cluster0';

async function getPendingReceipts() {
    try {
        require('dns').setServers(['8.8.8.8']);
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to DB');

        const excelPath = 'C:\\Users\\vinee\\Downloads\\cash receipts 2026-27.xls';
        const workbook = xlsx.readFile(excelPath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet);

        const students = await Student.find();
        const studentMap = new Map();
        students.forEach(s => studentMap.set(s.admissionNo, s));

        const pendingRows = [];

        data.forEach((row, index) => {
            const particulars = row['__EMPTY'] || row['PARTICULARS'] || row['Particulars'];
            let amount = row[' Debit '] || row['Credit'] || row['AMOUNT'] || row['Amount'];
            
            if (typeof amount === 'string') {
                amount = parseFloat(amount.replace(/[^0-9.-]+/g, ''));
            }

            if (particulars && typeof particulars === 'string') {
                let admNo = null;
                const matchParen = particulars.match(/\(\s*(\d+)\s*\)/);
                const matchAd = particulars.match(/AD\.?NO\s*:?\s*(\d+)/i);
                
                if (matchParen) {
                    admNo = matchParen[1];
                } else if (matchAd) {
                    admNo = matchAd[1];
                }
                
                if (admNo) {
                    let isProcessed = false;
                    
                    // Rule 1: 6500 entries are processed
                    if (amount === 6500) {
                        isProcessed = true;
                    } else {
                        // Rule 2: Exact vehicle fee matches are processed
                        const student = studentMap.get(admNo);
                        if (student && student.monthlyConveyanceFee > 0) {
                            if (amount === student.monthlyConveyanceFee) {
                                isProcessed = true;
                            }
                        }
                    }

                    if (!isProcessed) {
                        const studentName = studentMap.has(admNo) ? studentMap.get(admNo).name : 'Student Not Found';
                        pendingRows.push(`Row ${index + 2}: Adm No: ${admNo} - Name: ${studentName} - Amount: ${amount}`);
                    }
                }
            }
        });

        const outputPath = 'C:\\Users\\vinee\\Desktop\\AG Projects\\school-management\\pending_receipts.txt';
        fs.writeFileSync(outputPath, pendingRows.join('\n'));
        console.log(`Found ${pendingRows.length} pending entries. Saved to txt.`);

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

getPendingReceipts();
