const xlsx = require('xlsx');
const mongoose = require('mongoose');
const fs = require('fs');
const Student = require('../models/Student');
const Fee = require('../models/Fee');
require('dotenv').config();

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
    return `${ts}-${admNo}-partial`;
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

        const students = await Student.find();
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
                    let isProcessed = false;
                    
                    if (amount === 6500) {
                        isProcessed = true;
                    } else if (amount >= 2000) {
                        isProcessed = true;
                    } else if (amount === 1) { // User specifically said ignore amount = 1
                        isProcessed = true;
                    } else {
                        const student = studentMap.get(admNo);
                        if (student && student.monthlyConveyanceFee > 0) {
                            if (amount === student.monthlyConveyanceFee) {
                                isProcessed = true; // Exact matches were already processed
                            }
                        }
                    }

                    if (!isProcessed) {
                        const student = studentMap.get(admNo);
                        if (student && student.monthlyConveyanceFee > 0) {
                            const paymentDate = excelDateSerial ? excelDateToJSDate(excelDateSerial) : new Date();
                            const receiptNo = generateReceiptNo(paymentDate, admNo);
                            
                            const existingFee = await Fee.findOne({ receiptNo });
                            if (existingFee) {
                                console.log(`Skipping duplicate ${admNo}`);
                                continue;
                            }

                            const diff = amount - student.monthlyConveyanceFee;
                            const remarkStr = diff > 0 
                                ? `Surplus: ${diff} - Bulk Imported from Excel` 
                                : `Pending: ${Math.abs(diff)} - Bulk Imported from Excel`;

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
                                remarks: remarkStr
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
                            
                            console.log(`Uploaded Partial Vehicle Fee for ${student.name} (${admNo}) - Expected: ${student.monthlyConveyanceFee}, Paid: ${amount}. ${remarkStr}`);
                            successCount++;
                        } else {
                            console.log(`Could not process for ${admNo} - maybe not a vehicle student? Amount: ${amount}`);
                        }
                    }
                }
            }
        }

        console.log(`\nSuccessfully uploaded ${successCount} partial vehicle fee records.`);

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
}

uploadExcel();
