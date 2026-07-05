const xlsx = require('xlsx');
const mongoose = require('mongoose');
const Student = require('../models/Student');
const Fee = require('../models/Fee');
require('dns').setServers(['8.8.8.8']);

const MONGODB_URI = 'mongodb+srv://vineethjay1998_db_user:vineeth_school_management@cluster0.k6cxmia.mongodb.net/school_management?appName=Cluster0';

function excelDateToJSDate(serial) {
    const utcDays = serial - 25569;
    const utcValue = utcDays * 86400000;                                        
    return new Date(utcValue);
}

function generateReceiptNo(dateObj, admNo, suffix) {
    const ts = dateObj.getFullYear().toString() +
        (dateObj.getMonth() + 1).toString().padStart(2, '0') +
        dateObj.getDate().toString().padStart(2, '0') +
        dateObj.getHours().toString().padStart(2, '0') +
        dateObj.getMinutes().toString().padStart(2, '0') +
        dateObj.getSeconds().toString().padStart(2, '0');
    return `${ts}-${admNo}-${suffix}`;
}

async function uploadAireen() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to DB');

        const excelPath = 'C:\\Users\\vinee\\Downloads\\cash receipts 2026-27.xls';
        const workbook = xlsx.readFile(excelPath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = xlsx.utils.sheet_to_json(sheet);

        const student = await Student.findOne({ admissionNo: '2514' });
        if (!student) {
            console.log('Student 2514 not found!');
            return;
        }

        // Find the rows for Aireen
        const aireenRows = data.filter(row => {
            const part = row['__EMPTY'] || row['PARTICULARS'] || row['Particulars'];
            return part && part.includes('Aireen Najeeb MK');
        });

        for (const row of aireenRows) {
            let amount = row[' Debit '] || row['Credit'] || row['AMOUNT'] || row['Amount'];
            if (typeof amount === 'string') amount = parseFloat(amount.replace(/[^0-9.-]+/g, ''));
            let excelDateSerial = row['Date'] || row['DATE'] || row['date'];
            
            const paymentDate = excelDateSerial ? excelDateToJSDate(excelDateSerial) : new Date();

            if (amount === 6500) {
                const receiptNo = generateReceiptNo(paymentDate, '2514', 'mat-reg');
                
                const existing = await Fee.findOne({ receiptNo });
                if (existing) {
                    console.log('6500 entry already exists');
                    continue;
                }
                
                const fee = new Fee({
                    student: student._id,
                    feeType: 'Registration & Materials Fee',
                    amount: 6500,
                    academicYear: '2026-2027',
                    status: 'Paid',
                    paymentDate: paymentDate,
                    paymentMode: 'Cash',
                    receiptNo: receiptNo,
                    breakdown: [
                        { feeType: 'Registration Fee', amount: 1500 },
                        { feeType: 'Materials Fee', amount: 5000 }
                    ],
                    remarks: 'Bulk Imported from Excel'
                });
                await fee.save();
                console.log('Successfully uploaded 6500 for Aireen');
            } else if (amount === 1500) {
                const receiptNo = generateReceiptNo(paymentDate, '2514', 'vehicle');
                
                const existing = await Fee.findOne({ receiptNo });
                if (existing) {
                    console.log('1500 entry already exists');
                    continue;
                }
                
                const diff = amount - student.monthlyConveyanceFee;
                let remarkStr = 'Bulk Imported from Excel';
                if (diff !== 0 && student.monthlyConveyanceFee > 0) {
                     remarkStr = diff > 0 ? `Surplus: ${diff} - ` + remarkStr : `Pending: ${Math.abs(diff)} - ` + remarkStr;
                }

                const fee = new Fee({
                    student: student._id,
                    feeType: 'Vehicle Fee - Jun 2026',
                    amount: amount,
                    academicYear: '2026-2027',
                    status: 'Paid',
                    paymentDate: paymentDate,
                    paymentMode: 'Cash',
                    receiptNo: receiptNo,
                    breakdown: [{
                        feeType: 'Vehicle Fee - Jun 2026',
                        amount: amount
                    }],
                    remarks: remarkStr
                });
                await fee.save();
                
                if (!student.paidVehicleMonths) student.paidVehicleMonths = [];
                if (!student.paidVehicleMonths.includes('Jun 2026')) {
                    student.paidVehicleMonths.push('Jun 2026');
                    await student.save();
                }
                console.log('Successfully uploaded 1500 vehicle fee for Aireen');
            }
        }
    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

uploadAireen();
