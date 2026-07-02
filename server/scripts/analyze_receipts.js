const xlsx = require('xlsx');
const mongoose = require('mongoose');
const fs = require('fs');
const Student = require('../models/Student');

const MONGODB_URI = 'mongodb+srv://vineethjay1998_db_user:vineeth_school_management@cluster0.k6cxmia.mongodb.net/school_management?appName=Cluster0';

async function analyzeExcel() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to DB');

        const excelPath = 'C:\\Users\\vinee\\Downloads\\cash receipts 2026-27.xls';
        const workbook = xlsx.readFile(excelPath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet);
        console.log("First row keys:", Object.keys(data[0]));
        console.log("First row:", data[0]);

        const students = await Student.find({ monthlyConveyanceFee: { $gt: 0 } });
        console.log(`Found ${students.length} students with conveyance fee > 0`);
        
        const studentMap = new Map();
        students.forEach(s => studentMap.set(s.admissionNo, s));

        const exactMatches = [];
        const multipleMatches = [];
        let logCount = 0;

        data.forEach((row, index) => {
            const particulars = row['__EMPTY'] || row['PARTICULARS'] || row['Particulars'];
            let amount = row[' Debit '] || row['Credit'] || row['AMOUNT'] || row['Amount'];
            
            if (typeof amount === 'string') {
                amount = parseFloat(amount.replace(/[^0-9.-]+/g, ''));
            }

            if (particulars && typeof particulars === 'string') {
                // Extract AD.NO from parentheses or AD.NO
                let admNo = null;
                const matchParen = particulars.match(/\(\s*(\d+)\s*\)/);
                const matchAd = particulars.match(/AD\.?NO\s*:?\s*(\d+)/i);
                
                if (matchParen) {
                    admNo = matchParen[1];
                } else if (matchAd) {
                    admNo = matchAd[1];
                }
                
                if (admNo) {
                    const student = studentMap.get(admNo);
                    if (student) {
                        if (amount === student.monthlyConveyanceFee) {
                            exactMatches.push(`Row ${index + 2}: Adm No: ${admNo} - Name: ${student.name} - Match Amount: ${amount}`);
                        } else if (amount > 0 && amount % student.monthlyConveyanceFee === 0) {
                            multipleMatches.push(`Row ${index + 2}: Adm No: ${admNo} - Name: ${student.name} - Paid: ${amount} (Multiple of ${student.monthlyConveyanceFee})`);
                        }
                    }
                }
            }
        });

        const outputPath = 'C:\\Users\\vinee\\Desktop\\AG Projects\\school-management\\exact_conveyance_matches.txt';
        const outStr = `=== EXACT MATCHES (1 Month) ===\n${exactMatches.join('\n')}\n\n=== MULTIPLE MONTHS MATCHES ===\n${multipleMatches.join('\n')}`;
        fs.writeFileSync(outputPath, outStr);
        console.log(`Found ${exactMatches.length} exact matches and ${multipleMatches.length} multiples. Saved to txt.`);

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

analyzeExcel();
