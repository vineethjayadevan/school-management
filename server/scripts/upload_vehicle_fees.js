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

function generateReceiptNo(dateObj, admNo) {
    const ts = dateObj.getFullYear().toString() +
        (dateObj.getMonth() + 1).toString().padStart(2, '0') +
        dateObj.getDate().toString().padStart(2, '0') +
        dateObj.getHours().toString().padStart(2, '0') +
        dateObj.getMinutes().toString().padStart(2, '0') +
        dateObj.getSeconds().toString().padStart(2, '0');
    return `${ts}-${admNo}`;
}

async function uploadExcel() {
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

        let successCount = 0;

        for (const row of data) {
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
                    const student = studentMap.get(admNo);
                    if (student) {
                        if (amount === student.monthlyConveyanceFee) {
                            const paymentDate = excelDateSerial ? excelDateToJSDate(excelDateSerial) : new Date();
                            const receiptNo = generateReceiptNo(paymentDate, admNo);
                            
                            // Check if this fee was already added to prevent duplicates during testing
                            const existingFee = await Fee.findOne({ receiptNo });
                            if (existingFee) {
                                console.log(`Skipping duplicate ${admNo}`);
                                continue;
                            }

                            // Create the Fee record
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
                                remarks: 'Bulk Imported from Excel'
                            });
                            
                            await fee.save();

                            // Update student paid months if not already there
                            if (!student.paidVehicleMonths) {
                                student.paidVehicleMonths = [];
                            }
                            if (!student.paidVehicleMonths.includes('Jun 2026')) {
                                student.paidVehicleMonths.push('Jun 2026');
                                await student.save();
                            }
                            
                            console.log(`Uploaded Fee for ${student.name} (${admNo}) - Amount: ${amount}`);
                            successCount++;
                        }
                    }
                }
            }
        }

        console.log(`\nSuccessfully uploaded ${successCount} vehicle fee records.`);

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

uploadExcel();
