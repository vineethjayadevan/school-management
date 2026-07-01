require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const fs = require('fs');
const Student = require('../models/Student');
const Fee = require('../models/Fee');
const FeeCategory = require('../models/FeeCategory');

const txtPath = "C:\\Users\\vinee\\Desktop\\AG Projects\\school-management\\6500_paid_students.txt";

async function runTest() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB.");

        const content = fs.readFileSync(txtPath, 'utf8');
        const lines = content.split('\n');
        
        const dataLines = lines.slice(4).filter(l => l.trim() !== '' && !l.startsWith('---') && !l.startsWith('Total'));
        
        // Take the remaining 121 students (skip the first 3)
        const remainingLines = dataLines.slice(3);
        
        for (const line of remainingLines) {
            // Regex to parse Name, Date, Admn
            // Ayisha Mehak V                01/04/2026     2578
            const match = line.match(/^(.+?)\s+(\d{2}\/\d{2}\/\d{4})\s+(\d+)$/);
            if (!match) continue;
            
            const name = match[1].trim();
            const dateStr = match[2].trim();
            const admn = match[3].trim();
            
            // Format Date
            const [dd, mm, yyyy] = dateStr.split('/');
            const paymentDate = new Date(`${yyyy}-${mm}-${dd}T00:00:00.000Z`);
            
            // Generate Custom Receipt Number
            const receiptNo = `${yyyy}${mm}${dd}-${admn}`;
            
            // Fetch student
            const student = await Student.findOne({ admissionNo: admn });
            if (!student) {
                console.log(`Student ${admn} not found.`);
                continue;
            }
            
            const feeBreakdown = [
                { feeType: 'Materials Fee', amount: 5000 },
                { feeType: 'Registration Fee', amount: 1500 }
            ];
            
            const newFee = new Fee({
                student: student._id,
                feeType: 'Split Payment',
                amount: 6500,
                academicYear: '2025-2026', // Use the default or dynamic
                paymentDate: paymentDate,
                paymentMode: 'Cash',
                transactionId: '',
                status: 'Paid',
                remarks: 'Automated entry from Excel sync',
                receiptNo: receiptNo,
                breakdown: feeBreakdown
            });
            
            const insertedFee = await newFee.save();
            console.log(`Successfully added fee for ${name} (${admn}). Receipt No: ${receiptNo}`);
            
            // Update student's fee status loosely
            student.feesStatus = 'Partially Paid';
            await student.save();
        }

        console.log("Test insert complete.");
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

runTest();
