require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Student = require('../models/Student');
const Fee = require('../models/Fee');

async function insertFee() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB.");

        const admn = '2704';
        
        // Use today's date
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        
        // Generate Custom Receipt Number
        const receiptNo = `${yyyy}${mm}${dd}-${admn}`;
        
        // Fetch student
        const student = await Student.findOne({ admissionNo: admn });
        if (!student) {
            console.log(`Student ${admn} not found.`);
            process.exit(1);
        }
        
        const feeBreakdown = [
            { feeType: 'Materials Fee', amount: 5000 },
            { feeType: 'Registration Fee', amount: 1500 }
        ];
        
        const newFee = new Fee({
            student: student._id,
            feeType: 'Split Payment',
            amount: 6500,
            academicYear: '2025-2026',
            paymentDate: today,
            paymentMode: 'Cash',
            transactionId: '',
            status: 'Paid',
            remarks: 'Manual entry for missed student',
            receiptNo: receiptNo,
            breakdown: feeBreakdown
        });
        
        await newFee.save();
        console.log(`Successfully added fee for ${student.name} (${admn}). Receipt No: ${receiptNo}`);
        
        // Update student's fee status
        student.feesStatus = 'Partially Paid';
        await student.save();

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

insertFee();
