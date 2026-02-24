const Student = require('../models/Student');
const AcademicYear = require('../models/AcademicYear');
const PromotionLog = require('../models/PromotionLog');
const GlobalSettings = require('../models/GlobalSettings');
const Fee = require('../models/Fee');
const FeeCategory = require('../models/FeeCategory');

// Helper function to calculate if fees are fully paid for a student in a specific year
const checkFinancialClearance = async (studentId, studentClass, conveyanceSlab) => {
    // Note: In a fully robust system, you'd filter transactions strictly by the `academicYear`. 
    // Since we are transitioning, we look at all successful payments mapped to their current active slabs/class.

    // 1. Get all applicable fee categories for the student's current class
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

    // 2. Get all exact payments for this student
    const payments = await Fee.find({
        student: studentId,
        status: 'Paid',
        // If academicYear was strictly enforced on transactions, we'd add it here
    });

    let totalPaid = 0;
    payments.forEach(p => {
        totalPaid += Number(p.amount);
    });

    // Clearance logic:
    // If due is 0, they are clear. If paid >= due, they are clear.
    return (totalDue === 0 || totalPaid >= totalDue);
};

// @desc    Get Promotion Eligibility Preview
// @route   POST /api/promotion/preview
// @access  Private (Admin)
const getPromotionPreview = async (req, res) => {
    try {
        const { currentYearId, nextYearId, classMappings } = req.body;
        // classMappings = { "Mont 1": { toClass: "Mont 2", isGraduating: false }, "Grade 3": { isGraduating: true } }

        if (!currentYearId || !nextYearId || !classMappings) {
            return res.status(400).json({ message: 'Missing required parameters' });
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

        const query = {
            className: { $in: activeMappedClasses },
            isActive: true
        };

        const students = await Student.find(query).select('name admissionNo rollNo className section conveyanceSlab financialClearance promotionStatus academicHistory');

        // Filter out students who already have an entry for the target year
        const eligibleStudents = students.filter(student => {
            const alreadyProcessed = student.academicHistory?.some(
                h => h.academicYear && h.academicYear.toString() === nextYearId.toString()
            );
            return !alreadyProcessed;
        });

        // Check eligibility
        const previewData = [];

        for (const student of eligibleStudents) {
            const isCleared = await checkFinancialClearance(student._id, student.className, student.conveyanceSlab);
            const mapping = classMappings[student.className]; // Knowing the mapping that applies

            let status = 'Ready';
            let remarks = '';

            if (!isCleared) {
                if (requiresFullFee) {
                    status = 'Blocked';
                    remarks = 'Pending fee balance blocks promotion.';
                } else {
                    status = 'Warning';
                    remarks = 'Pending fee balance (Promotion allowed per settings).';
                }
            }

            previewData.push({
                studentId: student._id,
                name: student.name,
                admissionNo: student.admissionNo,
                rollNo: student.rollNo,
                currentClass: student.className,
                targetClass: mapping.isGraduating ? 'Graduated' : mapping.toClass,
                financialClearance: isCleared,
                status,
                remarks
            });
        }

        res.status(200).json({
            requiresFullFee,
            students: previewData
        });

    } catch (error) {
        console.error('Error in promotion preview:', error);
        res.status(500).json({ message: 'Server error generating preview' });
    }
};

// @desc    Execute Bulk Promotion
// @route   POST /api/promotion/execute
// @access  Private (Admin)
const executePromotion = async (req, res) => {
    try {
        const { currentYearId, nextYearId, classMappings, studentsToProcess } = req.body;
        // classMappings = { "Mont 1": { toClass: "Mont 2", isGraduating: false }, "Grade 3": { isGraduating: true } }
        // studentsToProcess = array of student IDs that the admin confirmed

        if (!currentYearId || !nextYearId || !classMappings || !studentsToProcess) {
            return res.status(400).json({ message: 'Missing required parameters' });
        }

        // Fetch settings
        let settings = await GlobalSettings.findById('SYSTEM_SETTINGS');
        const requiresFullFee = settings ? settings.promotionRequiresFullFee : true;

        const students = await Student.find({ _id: { $in: studentsToProcess } });

        let promotedCount = 0;
        let detainedCount = 0;
        let graduatedCount = 0;
        let onHoldCount = 0;

        // Track stats per class for logging
        const classStats = {};

        // Start processing (Ideally done in a MongoDB Transaction session, but kept simple here)
        for (const student of students) {
            // Defensive check for uninitialized array
            if (!student.academicHistory) student.academicHistory = [];

            const alreadyProcessed = student.academicHistory.some(
                h => h.academicYear && h.academicYear.toString() === nextYearId.toString()
            );

            if (alreadyProcessed) {
                continue; // Skip silently or log it
            }

            // Figure out which mapping applies based on their CURRENT class BEFORE any changes
            const mapping = classMappings[student.className];
            if (!mapping) {
                console.warn(`No mapping found for student ${student.admissionNo} in class ${student.className}`);
                continue;
            }

            if (!classStats[student.className]) {
                classStats[student.className] = {
                    fromClass: student.className,
                    toClass: mapping.isGraduating ? 'Graduated' : mapping.toClass,
                    promotedCount: 0,
                    graduatedCount: 0,
                    onHoldCount: 0
                };
            }

            const isCleared = await checkFinancialClearance(student._id, student.className, student.conveyanceSlab);

            // Log history for current state before changing it
            const historyEntry = {
                academicYear: currentYearId,
                className: student.className,
                section: student.section,
                promotionStatus: '',
                remarks: '',
                recordedAt: new Date()
            };

            if (!isCleared && requiresFullFee) {
                // Blocked
                student.promotionStatus = 'On Hold';
                student.financialClearance = false;
                historyEntry.promotionStatus = 'On Hold';
                historyEntry.remarks = 'Blocked due to pending fees';
                onHoldCount++;
                classStats[student.className].onHoldCount++;
            } else {
                // Proceed
                student.financialClearance = isCleared; // might be false if requiresFullFee is false

                if (mapping.isGraduating || mapping.toClass === 'Graduated') {
                    student.promotionStatus = 'Graduated';
                    student.isActive = false; // Alumni
                    student.currentAcademicYear = nextYearId; // Mark them under the new year as alumni
                    student.className = 'Graduated';
                    historyEntry.promotionStatus = 'Graduated';
                    graduatedCount++;
                    classStats[student.className].graduatedCount++;
                } else {
                    // Normal Promotion
                    student.className = mapping.toClass;
                    // We only reset rollNo if they actually change class
                    if (student.className !== historyEntry.className) {
                        student.rollNo = '';
                    }
                    student.promotionStatus = 'Promoted';
                    student.currentAcademicYear = nextYearId;
                    historyEntry.promotionStatus = 'Promoted';
                    promotedCount++;
                    classStats[student.className].promotedCount++;
                }
            }

            // Sanitize invalid previousClass values to prevent validation failure
            const validPreviousClasses = ['Mont 1', 'Mont 2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5'];
            if (student.previousClass && !validPreviousClasses.includes(student.previousClass)) {
                student.previousClass = undefined;
            } else if (student.previousClass === '') {
                // Ensure empty strings are also set to undefined to bypass enum validation
                student.previousClass = undefined;
            }

            // Save history
            student.academicHistory.push(historyEntry);
            await student.save();
        }

        // Create log record summarizing the entire bulk action
        // For simplicity, we create one master log. If you want a log per class, you'd iterate `classStats`.
        const log = await PromotionLog.create({
            academicYearFrom: currentYearId,
            academicYearTo: nextYearId,
            fromClass: 'Bulk Process', // Since it spans multiple
            toClass: 'Multiple',
            totalStudentsProcessed: studentsToProcess.length,
            promotedCount,
            detainedCount,
            graduatedCount,
            onHoldCount,
            executedBy: req.user?._id || students[0]?.createdBy // Fallback
        });

        res.status(200).json({
            message: 'Bulk promotion executed successfully',
            log,
            classStats // optionally return this for UI breakdown
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
