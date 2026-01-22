const Fee = require('../models/Fee');
const Student = require('../models/Student');

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

        const fee = await Fee.create({
            student: studentId,
            feeType: type,
            amount,
            paymentDate: date,
            paymentMode: mode,
            status: 'Paid', // Assuming immediate payment for now
            remarks: remarks || '',
            receiptNo: `REC${Date.now().toString().slice(-6)}`
        });

        // Update student fee status to Paid
        student.feesStatus = 'Paid';
        await student.save();

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

module.exports = {
    getFees,
    addFee,
    getStudentFees
};
