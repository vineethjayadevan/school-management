const xlsx = require('xlsx');
const mongoose = require('mongoose');
const fs = require('fs');
const Student = require('../models/Student');
const Fee = require('../models/Fee');

const MONGODB_URI = 'mongodb+srv://vineethjay1998_db_user:vineeth_school_management@cluster0.k6cxmia.mongodb.net/school_management?appName=Cluster0';

function excelDateToJSDate(serial) {
    const utcDays = serial - 25569;
    const utcValue = utcDays * 86400000;                                        
    return new Date(utcValue);
}

function generateReceiptNo(dateObj, admNo, index) {
    const ts = dateObj.getFullYear().toString() +
        (dateObj.getMonth() + 1).toString().padStart(2, '0') +
        dateObj.getDate().toString().padStart(2, '0') +
        dateObj.getHours().toString().padStart(2, '0') +
        dateObj.getMinutes().toString().padStart(2, '0') +
        dateObj.getSeconds().toString().padStart(2, '0');
    return `${ts}-${admNo}-${index}`;
}

async function uploadTuitionFees() {
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

        // 1. Filter out already processed entries and group the remaining ones >= 2000
        data.forEach((row, index) => {
            const particulars = row['__EMPTY'] || row['PARTICULARS'] || row['Particulars'];
            let amount = row[' Debit '] || row['Credit'] || row['AMOUNT'] || row['Amount'];
            let excelDateSerial = row['Date'] || row['DATE'] || row['date'];
            
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
                    
                    if (amount === 6500) {
                        isProcessed = true;
                    } else {
                        const student = studentMap.get(admNo);
                        if (student && student.monthlyConveyanceFee > 0) {
                            if (amount === student.monthlyConveyanceFee) {
                                isProcessed = true;
                            }
                        }
                    }

                    if (!isProcessed && amount >= 2000) {
                        pendingRows.push({
                            admNo,
                            amount,
                            excelDateSerial,
                            rowIndex: index + 2
                        });
                    }
                }
            }
        });

        // 2. Group by student admission number to find multiples
        const groupedRows = new Map();
        pendingRows.forEach(row => {
            if (!groupedRows.has(row.admNo)) {
                groupedRows.set(row.admNo, []);
            }
            groupedRows.get(row.admNo).push(row);
        });

        let successCount = 0;

        // 3. Insert into database
        for (const [admNo, rows] of groupedRows) {
            const student = studentMap.get(admNo);
            if (!student) {
                console.log(`Skipping unknown student ${admNo}`);
                continue;
            }

            const isMultiple = rows.length > 1;
            const remarks = isMultiple ? 'Multiple Payments - Bulk Imported from Excel' : 'Bulk Imported from Excel';

            let i = 0;
            for (const row of rows) {
                i++;
                const paymentDate = row.excelDateSerial ? excelDateToJSDate(row.excelDateSerial) : new Date();
                const receiptNo = generateReceiptNo(paymentDate, admNo, i);

                const existingFee = await Fee.findOne({ receiptNo });
                if (existingFee) {
                    console.log(`Skipping duplicate fee ${receiptNo}`);
                    continue;
                }

                const fee = new Fee({
                    student: student._id,
                    feeType: 'Tuition Fee',
                    amount: row.amount,
                    academicYear: '2026-2027',
                    status: 'Paid',
                    paymentDate: paymentDate,
                    paymentMode: 'Cash',
                    receiptNo: receiptNo,
                    breakdown: [{
                        feeType: 'Tuition Fee',
                        amount: row.amount
                    }],
                    remarks: remarks
                });

                await fee.save();
                successCount++;
                console.log(`Uploaded Tuition Fee for ${student.name} (${admNo}) - Amount: ${row.amount} - IsMultiple: ${isMultiple}`);
            }
        }

        console.log(`\nSuccessfully uploaded ${successCount} tuition fee records.`);

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

uploadTuitionFees();
