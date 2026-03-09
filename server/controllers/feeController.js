const Fee = require('../models/Fee');
const Student = require('../models/Student');
const FeeCategory = require('../models/FeeCategory');
const { generateFeeReceipt } = require('../utils/pdfGenerator');
const { sendFeeReceiptEmail } = require('../utils/emailService');
const { sendMSG91SMS, sendMSG91WhatsApp } = require('../utils/msg91Service');

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
        // Support legacy single 'type'/'amount' or the new 'breakdown' array
        const { studentId, type, amount, breakdown, date, mode, transactionId, remarks, manualReceiptNo } = req.body;

        const feeBreakdown = breakdown || (type && amount ? [{ feeType: type, amount: Number(amount) }] : []);

        if (feeBreakdown.length === 0) {
            return res.status(400).json({ message: 'No fee details provided' });
        }

        // Enforce transactionId if mode is not Cash
        if (mode !== 'Cash' && (!transactionId || transactionId.trim() === '')) {
            return res.status(400).json({ message: `Transaction ID is required for ${mode} payments.` });
        }

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

        const totalAmount = feeBreakdown.reduce((sum, item) => sum + Number(item.amount), 0);
        const feeTypeLabel = feeBreakdown.length === 1 ? feeBreakdown[0].feeType : 'Split Payment';

        const newFee = new Fee({
            student: studentId,
            feeType: feeTypeLabel,
            amount: totalAmount,
            academicYear: '2025-2026', // Hardcoded for now, should be dynamic or from request
            paymentDate: date,
            paymentMode: mode,
            transactionId: transactionId || '',
            status: 'Paid',
            remarks: remarks || '',
            receiptNo,
            breakdown: feeBreakdown
        });

        const insertedFee = await newFee.save();

        // Calculate total expected fee for this student's class
        const className = student.className || student.class;
        const activeCategories = await FeeCategory.find({ isActive: true });

        // Sum up all due amounts for the specific class from active categories
        let totalExpectedFee = 0;
        activeCategories.forEach(category => {
            // Find if this category has an amount defined for this student's class
            const classAmountObj = category.amounts.find(a => a.className === className);
            if (classAmountObj && classAmountObj.amount > 0) {
                totalExpectedFee += classAmountObj.amount;
            }
        });

        const allFees = await Fee.find({ student: studentId });
        const totalPaid = allFees.reduce((sum, f) => sum + (f.amount || 0), 0);

        // Calculate student's status based on newly discovered total expected
        if (totalExpectedFee > 0 && totalPaid >= totalExpectedFee) {
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
        // Check if any feeType in the breakdown string contains "Conveyance" or "Full" (case-insensitive)
        const conveyanceItem = feeBreakdown.find(item =>
            item.feeType && (item.feeType.toLowerCase().includes('conveyance') || item.feeType.toLowerCase().includes('full'))
        );

        if (conveyanceItem) {
            // Find the category rules from the DB based on the feeType name
            const conveyanceCategory = activeCategories.find(c => c.name === conveyanceItem.feeType);

            let requiredMonthlyAmount = 0;
            if (conveyanceCategory && conveyanceCategory.hasSlabs) {
                const slabCount = student.conveyanceSlab ? parseInt(student.conveyanceSlab) : 0;
                requiredMonthlyAmount = conveyanceCategory.baseAmount + (slabCount * conveyanceCategory.slabMultiplier);
            } else {
                // Fallback to old flat 200 + (slab*100) if category not formally configured or hasSlabs is false
                const slabCount = student.conveyanceSlab ? parseInt(student.conveyanceSlab) : 0;
                requiredMonthlyAmount = slabCount > 0 ? (200 + (slabCount * 100)) : 0;
            }

            // Only flip the "Paid" month flag if they paid at least ONE full month's worth of conveyance
            if (Number(conveyanceItem.amount) >= requiredMonthlyAmount && requiredMonthlyAmount > 0) {
                student.lastConveyancePayment = date || new Date(); // Use payment date or now
            }
        }

        await student.save();

        // --- Send Email Notification (Async) ---
        // We do this asynchronously and don't block the response
        (async () => {
            try {
                // 1. Generate PDF Receipt
                const pdfBuffer = await generateFeeReceipt(insertedFee, student);

                // Check notification settings
                const GlobalSettings = require('../models/GlobalSettings');
                const settings = await GlobalSettings.findById('SYSTEM_SETTINGS');
                const emailEnabled = settings?.notificationSettings?.feeReceipt?.email ?? true;
                const smsEnabled = settings?.notificationSettings?.feeReceipt?.sms ?? false;
                const whatsappEnabled = settings?.notificationSettings?.feeReceipt?.whatsapp ?? false;

                // 2. Determine Recipient Email
                // Requirement: Send ONLY to Father's email. If not present, do not send.
                const recipientEmail = student.fatherEmail;

                if (recipientEmail && emailEnabled) {
                    console.log(`Sending fee receipt email to Father: ${recipientEmail}`);

                    // 3. Send Email
                    const emailResult = await sendFeeReceiptEmail({
                        toEmail: recipientEmail,
                        studentName: student.name,
                        feeAmount: insertedFee.amount,
                        receiptNo: receiptNo,
                        paymentDate: date,
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

                // 4. Send SMS and WhatsApp Notifications
                const mobile = student.fatherMobile;

                if (mobile) {
                    const notifyData = {
                        mobile,
                        studentName: student.name,
                        amount: insertedFee.amount,
                        receiptNo,
                        date
                    };

                    if (smsEnabled) {
                        await sendMSG91SMS(notifyData);
                    }
                    if (whatsappEnabled) {
                        await sendMSG91WhatsApp(notifyData);
                    }
                } else {
                    console.log(`No Father's Mobile found for student ${student.admissionNo}. SMS/WhatsApp skipped.`);
                }

            } catch (notifyError) {
                console.error('Error in fee receipt notification process:', notifyError);
            }
        })();

        res.status(201).json({ receiptNo, insertedFee });
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

        // Parallel fetch: Student Profile, Fee History, and active Fee Categories
        const [student, history, activeCategories] = await Promise.all([
            Student.findById(studentId).select('feesStatus admissionNo name className section conveyanceSlab discounts'),
            Fee.find({ student: studentId }).sort({ paymentDate: -1 }),
            FeeCategory.find({ isActive: true })
        ]);

        if (!student) {
            return res.status(404).json({ message: 'Student profile not found' });
        }

        // Calculate real expected breakdown for this student
        const className = (student.className || student.class || '').trim();
        const expectedBreakdown = activeCategories.map(cat => {
            let dueAmount = 0;
            if (cat.hasSlabs) {
                const slabCount = student.conveyanceSlab ? parseInt(student.conveyanceSlab) : 0;
                // Only apply if slab is selected (> 0)
                if (slabCount > 0) {
                    dueAmount = (cat.baseAmount + (slabCount * cat.slabMultiplier)) * (cat.months || 10);
                }
            } else {
                const classAmountObj = cat.amounts.find(a => (a.className || '').trim() === className);
                if (classAmountObj) {
                    dueAmount = classAmountObj.amount;
                }
            }

            // Apply discounts if any
            const discount = student.discounts?.find(d => d.categoryId?.toString() === cat._id.toString());
            const discountAmount = discount ? discount.discountAmount : 0;

            return {
                type: cat.name,
                totalDue: dueAmount,
                discount: discountAmount,
                due: Math.max(0, dueAmount - discountAmount)
            };
        }).filter(item => item.totalDue > 0);

        res.json({
            status: student.feesStatus,
            profile: student,
            history: history,
            expectedBreakdown
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Download fee receipt PDF
// @route   GET /api/fees/:id/receipt
// @access  Private
const downloadReceipt = async (req, res) => {
    try {
        const feeId = req.params.id;
        const fee = await Fee.findById(feeId).populate('student');

        if (!fee) {
            return res.status(404).json({ message: 'Receipt not found' });
        }

        // Security check: Only the student or admin/superuser can download
        const isSelf = req.user.role === 'student' && fee.student._id.toString() === req.user.profileId.toString();
        const isAdmin = ['superuser', 'admin', 'superadmin', 'officestaff'].includes(req.user.role);

        if (!isSelf && !isAdmin) {
            return res.status(403).json({ message: 'Unauthorized access to this receipt' });
        }

        const pdfBuffer = await generateFeeReceipt(fee, fee.student);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Receipt-${fee.receiptNo}.pdf`);
        res.send(pdfBuffer);
    } catch (error) {
        console.error('Error generating receipt download:', error);
        res.status(500).json({ message: 'Failed to generate receipt PDF' });
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
    getStudentFeesAdmin,
    downloadReceipt
};
