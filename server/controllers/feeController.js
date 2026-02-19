const Fee = require('../models/Fee');
const Student = require('../models/Student');
const { generateFeeReceipt } = require('../utils/pdfGenerator');
const { sendFeeReceiptEmail } = require('../utils/emailService');

// @desc    Get all fees
// @route   GET /api/fees
// @access  Private
const getFees = async (req, res) => {
    try {
        const fees = await Fee.find().populate('student', 'name admissionNo className section').sort({ createdAt: -1 });
        res.json(fees);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add new fee payment
// @route   POST /api/fees
// @access  Private
const addFee = async (req, res) => {
    try {
        const { studentId, type, amount, date, mode, remarks } = req.body;

        const student = await Student.findById(studentId);
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Generate unique receipt number: YYYYMMDDHHMMSS-AdmissionNo
        // Example: 20250130103045-1234
        const now = new Date();
        const timestamp = now.getFullYear().toString() +
            (now.getMonth() + 1).toString().padStart(2, '0') +
            now.getDate().toString().padStart(2, '0') +
            now.getHours().toString().padStart(2, '0') +
            now.getMinutes().toString().padStart(2, '0') +
            now.getSeconds().toString().padStart(2, '0');

        const receiptNo = `${timestamp}-${student.admissionNo}`;

        const fee = await Fee.create({
            student: studentId,
            feeType: type,
            amount,
            academicYear: '2025-2026', // Hardcoded for now, should be dynamic or from request
            paymentDate: date,
            paymentMode: mode,
            status: 'Paid', // Assuming immediate payment for now
            remarks: remarks || '',
            receiptNo
        });

        // Calculate total paid including this new fee
        const existingFees = await Fee.find({ student: studentId });
        // Note: existingFees DOES include the one we just created? No, we just created 'fee' const, it's in DB?
        // Wait, Fee.create is async, so it IS in DB.
        // But let's be safe. 'fee' is the new one.
        // Let's sum up all fees for this student.

        // Check total paid (Tuition + Materials = 26500)
        // If we want to support dynamic structure per class, we'd need to look it up.
        // For now, hardcoded 26500 as per request for global logic or assume we just check total.

        const allFees = await Fee.find({ student: studentId });
        const totalPaid = allFees.reduce((sum, f) => sum + (f.amount || 0), 0);

        const TOTAL_FEE = 26500; // Hardcoded global total for now

        if (totalPaid >= TOTAL_FEE) {
            student.feesStatus = 'Paid';
        } else if (totalPaid > 0) {
            student.feesStatus = 'Partially Paid';
        } else {
            student.feesStatus = 'Pending';
        }

        // Sanitize fields and fix validation issues
        const validPreviousClass = ['Mont 1', 'Mont 2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5'];

        if (student.previousClass && !validPreviousClass.includes(student.previousClass)) {
            // Only log if it's not simply an empty string which we expect to clear
            if (student.previousClass !== '') {
                console.warn(`Invalid previousClass '${student.previousClass}' found for student ${student.admissionNo}. Clearing it to allow save.`);
            }
            student.previousClass = undefined;
        } else if (student.previousClass === '') {
            student.previousClass = undefined;
        }

        // Update Conveyance Payment Date if applicable
        // Check if feeType string contains "Conveyance" or "Full" (case-insensitive)
        if (type && (type.toLowerCase().includes('conveyance') || type.toLowerCase().includes('full'))) {
            student.lastConveyancePayment = date || new Date(); // Use payment date or now
        }

        await student.save();

        // --- Send Email Notification (Async) ---
        // We do this asynchronously and don't block the response
        (async () => {
            try {
                // 1. Generate PDF Receipt
                console.log(`Generating receipt PDF for Fee ID: ${fee._id}`);
                const pdfBuffer = await generateFeeReceipt(fee, student);

                // 2. Determine Recipient Email
                // Requirement: Send ONLY to Father's email. If not present, do not send.
                const recipientEmail = student.fatherEmail;

                if (recipientEmail) {
                    console.log(`Sending fee receipt email to Father: ${recipientEmail}`);

                    // 3. Send Email
                    const emailResult = await sendFeeReceiptEmail({
                        toEmail: recipientEmail,
                        studentName: student.name,
                        feeAmount: fee.amount,
                        receiptNo: fee.receiptNo,
                        paymentDate: fee.paymentDate,
                        pdfBuffer: pdfBuffer
                    });

                    if (emailResult.success) {
                        console.log('Fee receipt email sent successfully.');
                    } else {
                        console.error('Failed to send fee receipt email:', emailResult.error);
                    }
                } else {
                    console.log(`No Father's Email found for student ${student.admissionNo}. Fee receipt email skipped.`);
                }
            } catch (notifyError) {
                console.error('Error in fee receipt notification process:', notifyError);
            }
        })();

        res.status(201).json(fee);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get student's fee history and status
// @route   GET /api/fees/student
// @access  Private (Student)
const getStudentFees = async (req, res) => {
    try {
        const studentId = req.user.profileId;

        // Parallel fetch: Student Profile (for status) AND Fee History
        const [student, history] = await Promise.all([
            Student.findById(studentId).select('feesStatus admissionNo name className section'),
            Fee.find({ student: studentId }).sort({ paymentDate: -1 })
        ]);

        if (!student) {
            return res.status(404).json({ message: 'Student profile not found' });
        }

        res.json({
            status: student.feesStatus,
            profile: student,
            history: history
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get fees for a specific student (Admin view)
// @route   GET /api/fees/student/:id
// @access  Private (Admin)
const getStudentFeesAdmin = async (req, res) => {
    try {
        const studentId = req.params.id;
        const fees = await Fee.find({ student: studentId }).sort({ paymentDate: -1 });
        res.json(fees);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getFees,
    addFee,
    getStudentFees,
    getStudentFeesAdmin
};
