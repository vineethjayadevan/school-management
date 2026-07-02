const xlsx = require('xlsx');
const mongoose = require('mongoose');
const fs = require('fs');
const Student = require('./server/models/Student');

const MONGODB_URI = 'mongodb+srv://vineethjay1998_db_user:vineeth_school_management@cluster0.k6cxmia.mongodb.net/school_management?appName=Cluster0';

async function analyzeExcel() {
    try {
        require('dns').setServers(['8.8.8.8']);
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to DB');

        const excelPath = 'C:\\Users\\vinee\\Downloads\\cash receipts 2026-27.xls';
        const workbook = xlsx.readFile(excelPath);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = xlsx.utils.sheet_to_json(sheet);

        const students = await Student.find({ monthlyConveyanceFee: { $gt: 0 } });
        const studentMap = new Map();
        students.forEach(s => studentMap.set(s.admissionNo, s));

        const exactMatches = [];

        data.forEach((row, index) => {
            const particulars = row['PARTICULARS'];
            let amount = row['AMOUNT'];
            
            if (typeof amount === 'string') {
                amount = parseFloat(amount.replace(/[^0-9.-]+/g, ''));
            }

            if (particulars && typeof particulars === 'string') {
                // Extract AD.NO
                const match = particulars.match(/AD\.?NO\s*:?\s*(\d+)/i);
                if (match) {
                    const admNo = match[1];
                    const student = studentMap.get(admNo);
                    
                    if (student) {
                        if (amount === student.monthlyConveyanceFee) {
                            exactMatches.push(`Row ${index + 2}: Adm No: ${admNo} - Name: ${student.name} - Match Amount: ${amount}`);
                        }
                    }
                }
            }
        });

        const outputPath = 'C:\\Users\\vinee\\.gemini\\antigravity\\brain\\efc261d2-2dd7-4efb-9266-d70312d7223d\\scratch\\exact_conveyance_matches.txt';
        fs.writeFileSync(outputPath, exactMatches.join('\n'));
        console.log(`Found ${exactMatches.length} exact matches. Saved to txt.`);

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

analyzeExcel();
