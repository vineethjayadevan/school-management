const Student = require('../models/Student');
const Fee = require('../models/Fee');
const FeeCategory = require('../models/FeeCategory');
const TransferCertificate = require('../models/TransferCertificate');
const AcademicYear = require('../models/AcademicYear');
const Class = require('../models/Class');
const { signUrl } = require('./uploadController');

// Helper to check if a student has cleared all fees (mirrors promotionController logic)
// discounts: student.discounts array from Student model
const checkFinancialClearance = async (studentId, studentClass, monthlyConveyanceFee, discounts = []) => {
    const allCategories = await FeeCategory.find({ isActive: true });
    let totalDue = 0;
    allCategories.forEach(cat => {
        if (cat.name === 'Conveyance' || cat.name === 'Vehicle Fee') {
            return; // Handled below
        }
        let annualTotal = 0;
        const clsAmount = cat.amounts.find(a => a.className === studentClass);
        if (clsAmount) annualTotal = clsAmount.amount;
        if (annualTotal > 0) {
            // Subtract any discount granted for this category
            const disc = discounts.find(d =>
                d.categoryId?.toString() === cat._id.toString() ||
                d.categoryName?.toLowerCase() === cat.name.toLowerCase()
            );
            totalDue += Math.max(0, annualTotal - (disc?.discountAmount || 0));
        }
    });

    if (monthlyConveyanceFee && monthlyConveyanceFee > 0) {
        let annualTotal = monthlyConveyanceFee * 10; // Assuming 10 months
        const discountEntry = discounts.find(d => d.categoryName === 'Vehicle Fee');
        const discountAmt = discountEntry ? discountEntry.discountAmount : 0;
        const netTotal = Math.max(0, annualTotal - discountAmt);
        totalDue += netTotal;
    }

    const payments = await Fee.find({ student: studentId, status: 'Paid' });
    const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    return {
        isCleared: (totalDue === 0 || totalPaid >= totalDue),
        totalDue,
        totalPaid,
        pending: Math.max(0, totalDue - totalPaid)
    };
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

const getStudents = async (req, res) => {
    try {
        const statusFilter = req.query.status;
        const classNameFilter = req.query.className;
        const isActiveFilter = req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : null;

        const query = {};
        
        if (req.query.search) {
            query.$or = [
                { name: { $regex: req.query.search, $options: 'i' } },
                { admissionNo: { $regex: req.query.search, $options: 'i' } },
            ];
        }

        if (classNameFilter && classNameFilter !== 'All') {
            query.className = classNameFilter;
        }

        if (statusFilter) {
            if (statusFilter === 'Active') {
                if (query.$or) {
                    // If there's already an $or for the search, we must wrap both in $and
                    query.$and = [
                        { $or: query.$or },
                        {
                            $or: [
                                { studentStatus: 'Active' },
                                { studentStatus: { $exists: false } }
                            ]
                        }
                    ];
                    delete query.$or;
                } else {
                    query.$or = [
                        { studentStatus: 'Active' },
                        { studentStatus: { $exists: false } }
                    ];
                }
                query.isActive = true;
            } else {
                query.studentStatus = statusFilter;
            }
        }

        if (isActiveFilter !== null) {
            query.isActive = isActiveFilter;
        }

        const students = await Student.find(query).sort({ createdAt: -1 });

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

// @desc    Get logged in student profile
// @route   GET /api/students/me
// @access  Private
const getStudentProfile = async (req, res) => {
    try {
        let student = await Student.findById(req.user.profileId);
        if (student) {
            student = student.toObject(); // Convert to plain object so we can add fields

            // Fetch class teacher details
            if (student.className && student.section) {
                const classObj = await Class.findOne({ name: student.className }).populate('sections.classTeacher', 'name phone');
                if (classObj) {
                    const sectionObj = classObj.sections.find(s => s.name === student.section);
                    if (sectionObj && sectionObj.classTeacher) {
                        student.classTeacherName = sectionObj.classTeacher.name;
                        student.classTeacherPhone = sectionObj.classTeacher.phone;
                    }
                }
            }

            const signedStudent = await signStudentPhoto(student);
            res.json(signedStudent);
        } else {
            res.status(404).json({ message: 'Student profile not found' });
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

        // ── Auto-assign the currently active Academic Year ──────────────────────
        // This ensures every student admitted via the form appears in the
        // Promotion Wizard without needing a manual assignCurrentTerm script run.
        if (!req.body.currentAcademicYear) {
            const activeYear = await AcademicYear.findOne({ isActive: true });
            if (activeYear) {
                req.body.currentAcademicYear = activeYear._id;
            }
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

        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // ── Promotion Lock: Prevent direct class/section editing after promotion ──
        const lockedStatuses = ['Promoted', 'Graduated'];
        if (lockedStatuses.includes(student.promotionStatus)) {
            if (req.body.className !== undefined || req.body.section !== undefined) {
                return res.status(400).json({
                    message: `Class/section cannot be changed manually after promotion. This student's promotion status is "${student.promotionStatus}". Please use the Promotion Wizard to make class changes.`
                });
            }
        }

        const updatedStudent = await Student.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
        });
        const signedStudent = await signStudentPhoto(updatedStudent);
        res.json(signedStudent);
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
            remarks,
            resultStatus,      // New
            lastStudiedClass   // New 
        } = req.body;

        if (!reasonForLeaving) {
            return res.status(400).json({ message: 'Reason for leaving is required.' });
        }

        // ── FINANCIAL CLEARANCE CHECK & SNAPSHOT ─────────────────────────────
        const financialData = await checkFinancialClearance(student._id, student.className, student.monthlyConveyanceFee, student.discounts || []);
        if (!financialData.isCleared) {
            return res.status(400).json({
                message: 'Cannot issue TC: This student has pending fee dues. Please clear all dues before issuing a Transfer Certificate.'
            });
        }

        // Get Active Academic Year
        const activeYear = await AcademicYear.findOne({ isActive: true });
        const academicYearName = activeYear ? activeYear.name : `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;

        // Auto-generate TC number if not provided sequentially
        let finalTcNo = tcNo;
        if (!finalTcNo) {
            const currentYearStart = activeYear ? activeYear.name.split('-')[0] : new Date().getFullYear().toString();
            const yearPrefix = `TC-${currentYearStart}-`;
            // Find highest TC number for this year
            const lastTC = await TransferCertificate.findOne({
                tcNo: new RegExp(`^${yearPrefix}`)
            }).sort({ createdAt: -1 });

            let nextNum = 1;
            if (lastTC && lastTC.tcNo) {
                const parts = lastTC.tcNo.split('-');
                if (parts.length === 3 && !isNaN(parts[2])) {
                    nextNum = parseInt(parts[2]) + 1;
                }
            }
            finalTcNo = `${yearPrefix}${nextNum.toString().padStart(4, '0')}`;
        }

        // Save TC details snapshot to Student
        student.tcDetails = {
            tcNo: finalTcNo,
            applicationDate,
            issueDate: issueDate || new Date(),
            lastDateAttended,
            reasonForLeaving,
            conduct: conduct || 'Good',
            isTCPromoted: isTCPromoted || false,
            remarks,
            issuedBy: req.user ? req.user._id : undefined,
            totalPaidAtTC: financialData.totalPaid,
            pendingAtTC: financialData.pending,
            isFinancialCleared: financialData.isCleared,
            academicYearName: academicYearName
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

        // Mark student as inactive and Transferred
        student.promotionStatus = 'Relieved';
        student.studentStatus = 'Transferred';
        student.isActive = false;

        // Create Professional TC Record
        await TransferCertificate.create({
            studentId: student._id,
            admissionNo: student.admissionNo,
            studentName: student.name,
            tcNo: finalTcNo,
            issueDate: issueDate || new Date(),
            academicYear: academicYearName,
            exitDetails: {
                dateOfLeaving: lastDateAttended,
                reasonForLeaving: reasonForLeaving,
                lastStudiedClass: lastStudiedClass || student.className,
                resultStatus: resultStatus || (isTCPromoted ? 'Pass' : 'Not Applicable'),
                conduct: conduct || 'Good',
                remarks: remarks
            },
            financialSnapshot: {
                totalFeesPaid: financialData.totalPaid,
                pendingAtTC: financialData.pending,
                isCleared: financialData.isCleared
            },
            issuedBy: req.user ? req.user._id : undefined
        });

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

        const financialData = await checkFinancialClearance(student._id, student.className, student.monthlyConveyanceFee, student.discounts || []);
        res.status(200).json({ isCleared: financialData.isCleared, isActive: student.isActive });
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
    getStudentProfile,
};
