const Student = require('../models/Student');
const AcademicYear = require('../models/AcademicYear');
const PromotionLog = require('../models/PromotionLog');
const GlobalSettings = require('../models/GlobalSettings');
const Fee = require('../models/Fee');
const FeeCategory = require('../models/FeeCategory');

// ─── Helper: Year-Scoped Financial Clearance ─────────────────────────────────
// Checks whether a student has cleared all dues for a SPECIFIC academic year.
const checkFinancialClearance = async (studentId, studentClass, monthlyConveyanceFee, academicYearId) => {
    // 1. Get total expected fee (simplified: usually this would consider all active categories for the year)
    // Assuming you have a centralized function or we query FeeCategory
    const allCategories = await FeeCategory.find({ academicYear: academicYearId, isActive: true });
    let totalDue = 0;
    allCategories.forEach(cat => {
        if (cat.name === 'Conveyance' || cat.name === 'Vehicle Fee') return;
        let annualTotal = 0;
        const clsAmount = cat.amounts.find(a => a.className === studentClass);
        if (clsAmount) annualTotal = clsAmount.amount;
        totalDue += annualTotal;
    });

    if (monthlyConveyanceFee && monthlyConveyanceFee > 0) {
        totalDue += (monthlyConveyanceFee * 10);
    }

    // 2. Sum ONLY payments for this specific academic year (year-scoped)
    const paymentQuery = {
        student: studentId,
        status: 'Paid',
    };

    // If academicYearId is provided, filter by it. Fee.academicYear is stored as a String (year name)
    // so we need to resolve the year name first.
    if (academicYearId) {
        const yearDoc = await AcademicYear.findById(academicYearId).select('name');
        if (yearDoc) {
            paymentQuery.academicYear = yearDoc.name;
        }
    }

    const payments = await Fee.find(paymentQuery);

    let totalPaid = 0;
    payments.forEach(p => {
        totalPaid += Number(p.amount);
    });

    // 3. Return result
    return {
        isCleared: (totalDue === 0 || totalPaid >= totalDue),
        totalDue,
        totalPaid,
        pending: Math.max(0, totalDue - totalPaid)
    };
};

// ─── Helper: Resolve resultStatus from action ─────────────────────────────────
const resolveResultStatus = (action) => {
    if (action === 'Promote' || action === 'Graduate') return 'Pass';
    if (action === 'Detain') return 'Fail';
    return 'N/A';
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get Promotion Eligibility Preview
// @route   POST /api/promotion/preview
// @access  Private (Admin)
// ─────────────────────────────────────────────────────────────────────────────
const getPromotionPreview = async (req, res) => {
    try {
        const { currentYearId, nextYearId, classMappings } = req.body;

        if (!currentYearId || !nextYearId || !classMappings) {
            return res.status(400).json({ message: 'Missing required parameters' });
        }

        // ── Safety Rule 1: Prevent promotion if From Year is Closed ──
        const currentYear = await AcademicYear.findById(currentYearId);
        if (!currentYear) {
            return res.status(404).json({ message: 'Selected "From" academic year not found.' });
        }
        if (currentYear.status === 'Closed' || currentYear.isLocked) {
            return res.status(400).json({
                message: `Cannot promote from "${currentYear.name}" — this academic year is already Closed/Locked.`
            });
        }

        const activeMappedClasses = Object.keys(classMappings).filter(
            k => classMappings[k].toClass || classMappings[k].isGraduating
        );

        if (activeMappedClasses.length === 0) {
            return res.status(400).json({ message: 'No valid class mappings provided' });
        }

        // Fetch settings
        let settings = await GlobalSettings.findById('SYSTEM_SETTINGS');
        const requiresFullFee = settings ? settings.promotionRequiresFullFee : true;

        // ── Safety Rule: Query only students whose currentAcademicYear === from year ──
        const query = {
            className: { $in: activeMappedClasses },
            currentAcademicYear: currentYearId,
            $or: [
                { studentStatus: 'Active' },
                { studentStatus: { $exists: false } }
            ],
            isActive: true
        };

        const students = await Student.find(query).select(
            'name admissionNo rollNo className section monthlyConveyanceFee financialClearance promotionStatus academicHistory currentAcademicYear'
        );

        // ── Safety Rule: Filter out students already processed for the target year ──
        const eligibleStudents = students.filter(student => {
            const alreadyProcessed = student.academicHistory?.some(
                h => h.academicYear && h.academicYear.toString() === nextYearId.toString()
            );
            // Also skip if already in the next year (double-promo protection)
            const alreadyInNextYear = student.currentAcademicYear?.toString() === nextYearId.toString();
            return !alreadyProcessed && !alreadyInNextYear;
        });

        // Check eligibility for each student
        const previewData = [];

        for (const student of eligibleStudents) {
            const { isCleared, totalDue, totalPaid, pending } = await checkFinancialClearance(
                student._id, student.className, student.monthlyConveyanceFee, currentYearId
            );
            const mapping = classMappings[student.className];

            let status = 'Ready';
            let remarks = '';

            if (!isCleared) {
                if (requiresFullFee) {
                    status = 'Blocked';
                    remarks = `Pending fee balance: ₹${pending.toLocaleString('en-IN')} blocks promotion.`;
                } else {
                    status = 'Warning';
                    remarks = `Pending fee: ₹${pending.toLocaleString('en-IN')} (promotion allowed per global setting).`;
                }
            }

            previewData.push({
                studentId: student._id,
                name: student.name,
                admissionNo: student.admissionNo,
                rollNo: student.rollNo,
                currentClass: student.className,
                section: student.section || '—',
                targetClass: mapping.isGraduating ? 'Graduated' : mapping.toClass,
                financialClearance: isCleared,
                pendingAmount: pending,
                status,
                remarks,
                action: mapping.isGraduating ? 'Graduate' : 'Promote'
            });
        }

        res.status(200).json({
            requiresFullFee,
            fromYear: { id: currentYear._id, name: currentYear.name, status: currentYear.status },
            students: previewData
        });

    } catch (error) {
        console.error('Error in promotion preview:', error);
        res.status(500).json({ message: 'Server error generating preview' });
    }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Execute Bulk Promotion
// @route   POST /api/promotion/execute
// @access  Private (Admin)
// ─────────────────────────────────────────────────────────────────────────────
const executePromotion = async (req, res) => {
    try {
        const { currentYearId, nextYearId, classMappings, studentsToProcess } = req.body;

        if (!currentYearId || !nextYearId || !classMappings || !studentsToProcess || !Array.isArray(studentsToProcess)) {
            return res.status(400).json({ message: 'Missing required parameters or invalid payload format' });
        }

        // ── Safety Rule 1: Prevent execution if From Year is Closed ──
        const currentYear = await AcademicYear.findById(currentYearId);
        if (!currentYear) {
            return res.status(404).json({ message: 'Selected "From" academic year not found.' });
        }
        if (currentYear.status === 'Closed' || currentYear.isLocked) {
            return res.status(400).json({
                message: `Cannot promote from "${currentYear.name}" — this academic year is already Closed/Locked.`
            });
        }

        // Fetch settings
        let settings = await GlobalSettings.findById('SYSTEM_SETTINGS');
        const requiresFullFee = settings ? settings.promotionRequiresFullFee : true;

        const studentIds = studentsToProcess.map(s => s.studentId);

        // CRITICAL: Only process students who are NOT already in the next year
        const students = await Student.find({
            _id: { $in: studentIds },
            currentAcademicYear: { $ne: nextYearId }
        });

        let promotedCount = 0;
        let detainedCount = 0;
        let graduatedCount = 0;
        let onHoldCount = 0;

        const classStats = {};

        for (const student of students) {
            const actionData = studentsToProcess.find(s => s.studentId.toString() === student._id.toString());
            if (!actionData) continue;

            if (!student.academicHistory) student.academicHistory = [];

            // Double security: Check for duplicate processing
            const alreadyProcessed = student.academicHistory.some(
                h => h.academicYear && h.academicYear.toString() === nextYearId.toString()
            );

            if (alreadyProcessed) {
                console.warn(`Student ${student.admissionNo} already processed for year ${nextYearId}. Skipping.`);
                continue;
            }

            const mapping = classMappings[student.className];
            if (!mapping) {
                console.warn(`No mapping found for ${student.admissionNo} in class ${student.className}. Skipping.`);
                continue;
            }

            if (!classStats[student.className]) {
                classStats[student.className] = {
                    fromClass: student.className,
                    toClass: mapping.isGraduating ? 'Graduated' : mapping.toClass,
                    promotedCount: 0,
                    graduatedCount: 0,
                    detainedCount: 0,
                    onHoldCount: 0
                };
            }

            // Year-scoped financial clearance check
            const { isCleared, pending } = await checkFinancialClearance(
                student._id, student.className, student.monthlyConveyanceFee, currentYearId
            );

            // Build history entry for their CURRENT state before transitioning
            const historyEntry = {
                academicYear: currentYearId,
                className: student.className,
                section: student.section,
                promotionStatus: '',
                resultStatus: resolveResultStatus(actionData.action),
                remarks: actionData.remarks || '',
                promotedAt: new Date(),
                recordedAt: new Date()
            };

            // 1. Financial Block (only if global setting requires full fee)
            if (!isCleared && requiresFullFee) {
                student.promotionStatus = 'On Hold';
                student.financialClearance = false;
                historyEntry.promotionStatus = 'On Hold';
                historyEntry.resultStatus = 'N/A';
                historyEntry.remarks = historyEntry.remarks
                    ? `${historyEntry.remarks} (Blocked: ₹${pending.toLocaleString('en-IN')} fee pending)`
                    : `Blocked: ₹${pending.toLocaleString('en-IN')} fee pending`;
                onHoldCount++;
                classStats[student.className].onHoldCount++;

                student.academicHistory.push(historyEntry);
                await student.save();
                continue;
            }

            // 2. Financials clear (or globally ignored). Execute action.
            student.financialClearance = isCleared;

            if (actionData.action === 'Detain') {
                // Admin chose to hold back — student stays in same class, year advances
                student.promotionStatus = 'Detained';
                student.currentAcademicYear = nextYearId;
                historyEntry.promotionStatus = 'Detained';
                historyEntry.resultStatus = 'Fail';
                detainedCount++;
                classStats[student.className].detainedCount++;

            } else if (mapping.isGraduating || actionData.action === 'Graduate') {
                // Graduation — student leaves the school
                student.promotionStatus = 'Graduated';
                student.studentStatus = 'Graduated';
                student.isActive = false;
                student.currentAcademicYear = nextYearId;
                student.className = 'Graduated';
                historyEntry.promotionStatus = 'Graduated';
                historyEntry.resultStatus = 'Pass';
                graduatedCount++;
                classStats[historyEntry.className].graduatedCount++;

            } else {
                // Normal Promotion
                student.className = mapping.toClass;
                student.rollNo = ''; // Reset roll number for new class
                student.promotionStatus = 'Promoted';
                student.currentAcademicYear = nextYearId;
                historyEntry.promotionStatus = 'Promoted';
                historyEntry.resultStatus = 'Pass';
                promotedCount++;
                classStats[historyEntry.className].promotedCount++;
            }

            // Sanitize previousClass — empty strings fail Mongoose enum validation
            if (!student.previousClass || student.previousClass === '') {
                student.previousClass = undefined;
            }

            student.academicHistory.push(historyEntry);
            await student.save();
        }

        // ── Optional: Close From Year — only when admin explicitly requests it ──
        // This happens via the "Close This Year" button on the success screen.
        // Do NOT auto-lock on every run — admin may need to run multiple class batches.
        const shouldCloseYear = req.body.closeFromYear === true;
        if (shouldCloseYear) {
            currentYear.status = 'Closed';
            currentYear.isLocked = true;
            currentYear.isActive = false;
            await currentYear.save();
        }

        // Write promotion log
        const log = await PromotionLog.create({
            academicYearFrom: currentYearId,
            academicYearTo: nextYearId,
            fromClass: 'Bulk Process',
            toClass: 'Multiple',
            totalStudentsProcessed: studentsToProcess.filter(s => s.action !== 'Skip').length,
            promotedCount,
            detainedCount,
            graduatedCount,
            onHoldCount,
            executedBy: req.user?._id
        });

        res.status(200).json({
            message: 'Bulk promotion executed successfully',
            log,
            classStats,
            fromYearClosed: true
        });

    } catch (error) {
        console.error('CRITICAL: Error executing bulk promotion:', error);
        res.status(500).json({ message: 'Server error executing promotion', error: error.message });
    }
};

module.exports = {
    getPromotionPreview,
    executePromotion
};
