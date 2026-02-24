const Student = require('../models/Student');
const Fee = require('../models/Fee');
const FeeCategory = require('../models/FeeCategory');
const { signUrl } = require('./uploadController');

// Helper to check if a student has cleared all fees (mirrors promotionController logic)
const checkFinancialClearance = async (studentId, studentClass, conveyanceSlab) => {
    const allCategories = await FeeCategory.find({ isActive: true });
    let totalDue = 0;
    allCategories.forEach(cat => {
        if (cat.hasSlabs) {
            const slabCount = conveyanceSlab ? parseInt(conveyanceSlab) : 0;
            if (slabCount > 0) {
                totalDue += (cat.baseAmount + (slabCount * cat.slabMultiplier)) * (cat.months || 10);
            }
        } else {
            const clsAmount = cat.amounts.find(a => a.className === studentClass);
            if (clsAmount) totalDue += clsAmount.amount;
        }
    });
    const payments = await Fee.find({ student: studentId, status: 'Paid' });
    const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    return (totalDue === 0 || totalPaid >= totalDue);
};

// Helper to sign student photo
const signStudentPhoto = async (student) => {
    if (!student) return student;
    const studentObj = student.toObject ? student.toObject() : student;
    if (studentObj.photoUrl) {
        studentObj.photoUrl = await signUrl(studentObj.photoUrl);
    }
    return studentObj;
};

// @desc    Get all students
// @route   GET /api/students
// @access  Private
const getStudents = async (req, res) => {
    try {
        const keyword = req.query.search
            ? {
                $or: [
                    { name: { $regex: req.query.search, $options: 'i' } },
                    { admissionNo: { $regex: req.query.search, $options: 'i' } },
                ],
            }
            : {};

        const students = await Student.find({ ...keyword }).sort({ createdAt: -1 });

        // Sign student photos
        const signedStudents = await Promise.all(students.map(signStudentPhoto));

        res.json(signedStudents);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single student
// @route   GET /api/students/:id
// @access  Private
const getStudentById = async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        if (student) {
            const signedStudent = await signStudentPhoto(student);
            res.json(signedStudent);
        } else {
            res.status(404).json({ message: 'Student not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Register new student
// @route   POST /api/students
// @access  Private/Admin
const createStudent = async (req, res) => {
    try {
        const { admissionNo, name, className, section, guardian, primaryPhone, applicationNo, submissionDate } = req.body;

        if (!admissionNo || !name || !className || !section || !guardian || !primaryPhone || !applicationNo || !submissionDate) {
            return res.status(400).json({ message: 'Please provide all required fields including Application No, Submission Date, Admission No, Name, Class, Section, Guardian, and Phone' });
        }

        const studentExists = await Student.findOne({ admissionNo });

        if (studentExists) {
            return res.status(400).json({ message: 'Student with this Admission No already exists' });
        }

        const student = await Student.create(req.body);
        const signedStudent = await signStudentPhoto(student);
        res.status(201).json(signedStudent);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update student
// @route   PUT /api/students/:id
// @access  Private/Admin
const updateStudent = async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);

        if (student) {
            const updatedStudent = await Student.findByIdAndUpdate(req.params.id, req.body, {
                new: true,
            });
            const signedStudent = await signStudentPhoto(updatedStudent);
            res.json(signedStudent);
        } else {
            res.status(404).json({ message: 'Student not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete student
// @route   DELETE /api/students/:id
// @access  Private/Admin
const deleteStudent = async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);

        if (student) {
            await student.deleteOne();
            res.json({ message: 'Student removed' });
        } else {
            res.status(404).json({ message: 'Student not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Issue Transfer Certificate for a student
// @route   POST /api/students/:id/issue-tc
// @access  Private/Admin
const issueTC = async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }
        if (!student.isActive) {
            return res.status(400).json({ message: 'This student is already inactive. TC may have already been issued.' });
        }

        const {
            tcNo,
            applicationDate,
            issueDate,
            lastDateAttended,
            reasonForLeaving,
            conduct,
            isTCPromoted,
            remarks
        } = req.body;

        if (!reasonForLeaving) {
            return res.status(400).json({ message: 'Reason for leaving is required.' });
        }

        // ── FINANCIAL CLEARANCE CHECK ─────────────────────────────
        const isCleared = await checkFinancialClearance(student._id, student.className, student.conveyanceSlab);
        if (!isCleared) {
            return res.status(400).json({
                message: 'Cannot issue TC: This student has pending fee dues. Please clear all dues before issuing a Transfer Certificate.'
            });
        }

        // Auto-generate TC number if not provided
        const finalTcNo = tcNo || `TC-${new Date().getFullYear()}-${student.admissionNo}`;

        // Save TC details
        student.tcDetails = {
            tcNo: finalTcNo,
            applicationDate,
            issueDate: issueDate || new Date(),
            lastDateAttended,
            reasonForLeaving,
            conduct: conduct || 'Good',
            isTCPromoted: isTCPromoted || false,
            remarks,
            issuedBy: req.user ? req.user._id : undefined
        };

        // Record final status in academic history
        if (!student.academicHistory) student.academicHistory = [];
        student.academicHistory.push({
            academicYear: student.currentAcademicYear,
            className: student.className,
            section: student.section,
            promotionStatus: 'Relieved',
            remarks: `TC Issued (${finalTcNo}). Reason: ${reasonForLeaving}`,
            recordedAt: new Date()
        });

        // Mark student as inactive
        student.promotionStatus = 'Relieved';
        student.isActive = false;

        // Sanitize previousClass enum — empty strings fail Mongoose validation
        const validPreviousClasses = ['Mont 1', 'Mont 2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5'];
        if (!student.previousClass || !validPreviousClasses.includes(student.previousClass)) {
            student.previousClass = undefined;
        }

        await student.save();

        const signedStudent = await signStudentPhoto(student);
        res.status(200).json({ message: 'Transfer Certificate issued successfully', student: signedStudent });

    } catch (error) {
        console.error('Error issuing TC:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Check if student is eligible for TC (real-time fee clearance check)
// @route   GET /api/students/:id/tc-eligibility
// @access  Private/Admin
const checkTCEligibility = async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        if (!student) return res.status(404).json({ message: 'Student not found' });

        const isCleared = await checkFinancialClearance(student._id, student.className, student.conveyanceSlab);
        res.status(200).json({ isCleared, isActive: student.isActive });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getStudents,
    getStudentById,
    createStudent,
    updateStudent,
    deleteStudent,
    issueTC,
    checkTCEligibility,
};
