const ExamCategory = require('../models/ExamCategory');
const ExamSchedule = require('../models/ExamSchedule');
const ExamMark = require('../models/ExamMark');
const Class = require('../models/Class');
const Student = require('../models/Student');

// ==========================================
// EXAM CATEGORIES (Admin Level)
// ==========================================

// @desc    Get all exam categories
// @route   GET /api/exams/categories
// @access  Private
const getExamCategories = async (req, res) => {
    try {
        const { academicYear, status } = req.query;
        let query = {};
        if (academicYear) query.academicYear = academicYear;
        if (status) query.status = status;

        const categories = await ExamCategory.find(query)
            .populate('academicYear', 'name startDate endDate')
            .sort({ createdAt: -1 });

        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create new exam category
// @route   POST /api/exams/categories
// @access  Private (Admin only)
const createExamCategory = async (req, res) => {
    try {
        const { name, description, academicYear, weightage, status } = req.body;

        const categoryExists = await ExamCategory.findOne({ name, academicYear });
        if (categoryExists) {
            return res.status(400).json({ message: 'Exam category with this name already exists for this academic year' });
        }

        const category = await ExamCategory.create({
            name,
            description,
            academicYear,
            weightage,
            status
        });

        res.status(201).json(category);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update exam category
// @route   PUT /api/exams/categories/:id
// @access  Private (Admin only)
const updateExamCategory = async (req, res) => {
    try {
        const { name, description, academicYear, weightage, status } = req.body;
        const category = await ExamCategory.findById(req.params.id);

        if (!category) return res.status(404).json({ message: 'Category not found' });

        // If name is changing, check for duplicates
        if (name && name !== category.name) {
            const categoryExists = await ExamCategory.findOne({ name, academicYear: academicYear || category.academicYear });
            if (categoryExists) {
                return res.status(400).json({ message: 'Another category with this name already exists' });
            }
        }

        category.name = name || category.name;
        category.description = description || category.description;
        category.academicYear = academicYear || category.academicYear;
        category.weightage = weightage !== undefined ? weightage : category.weightage;
        category.status = status || category.status;

        const updatedCategory = await category.save();
        res.json(updatedCategory);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete exam category
// @route   DELETE /api/exams/categories/:id
// @access  Private (Admin only)
const deleteExamCategory = async (req, res) => {
    try {
        // Check if there are schedules tied to it
        const schedules = await ExamSchedule.countDocuments({ examCategory: req.params.id });
        if (schedules > 0) {
            return res.status(400).json({ message: 'Cannot delete category because exams are already scheduled under it.' });
        }

        const category = await ExamCategory.findByIdAndDelete(req.params.id);
        if (!category) return res.status(404).json({ message: 'Category not found' });

        res.json({ message: 'Exam category removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ==========================================
// EXAM SCHEDULES (Teacher/Admin Level)
// ==========================================

// @desc    Get exam schedules (optionally filtered by category, class, section, teacher)
// @route   GET /api/exams/schedules
// @access  Private
const getExamSchedules = async (req, res) => {
    try {
        const { examCategory, class: classId, section, subject, scheduledBy } = req.query;
        let query = {};

        if (examCategory) query.examCategory = examCategory;
        if (classId) query.class = classId;
        if (section) query.section = section;
        if (subject) query.subject = subject;
        if (scheduledBy) query.scheduledBy = scheduledBy;

        // If teacher, optionally restrict them to see only their schedules, or let them see all.
        // Usually, in a school, seeing the schedule is fine for all staff.

        const schedules = await ExamSchedule.find(query)
            .populate('examCategory', 'name')
            .populate('class', 'name')
            .populate('subject', 'name code')
            .populate('scheduledBy', 'name email')
            .sort({ date: 1 });

        res.json(schedules);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create exam schedule
// @route   POST /api/exams/schedules
// @access  Private (Teacher/Admin)
const createExamSchedule = async (req, res) => {
    try {
        const { examCategory, class: classId, section, subject, date, startTime, endTime, maxMarks, passingMarks } = req.body;

        const scheduleExists = await ExamSchedule.findOne({ examCategory, class: classId, section, subject });
        if (scheduleExists) {
            return res.status(400).json({ message: 'This subject is already scheduled for this class/section in this exam category.' });
        }

        const schedule = await ExamSchedule.create({
            examCategory,
            class: classId,
            section,
            subject,
            date,
            startTime,
            endTime,
            maxMarks,
            passingMarks,
            scheduledBy: req.user._id // Assuming req.user is populated by authMiddleware
        });

        res.status(201).json(schedule);
    } catch (error) {
        // Handle unique constraint error
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Duplicate Exam Schedule.' });
        }
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete exam schedule
// @route   DELETE /api/exams/schedules/:id
// @access  Private
const deleteExamSchedule = async (req, res) => {
    try {
        // Check if marks exist
        const marksCount = await ExamMark.countDocuments({ examSchedule: req.params.id });
        if (marksCount > 0) {
            return res.status(400).json({ message: 'Cannot delete schedule because marks have already been entered.' });
        }

        const schedule = await ExamSchedule.findByIdAndDelete(req.params.id);
        if (!schedule) return res.status(404).json({ message: 'Schedule not found' });

        res.json({ message: 'Exam schedule removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ==========================================
// EXAM MARKS (Teacher/Admin Level)
// ==========================================

// @desc    Get marks for a specific schedule
// @route   GET /api/exams/schedules/:scheduleId/marks
// @access  Private
const getExamMarks = async (req, res) => {
    try {
        const { scheduleId } = req.params;

        // 1. Get the schedule details
        const schedule = await ExamSchedule.findById(scheduleId)
            .populate('class')
            .populate('examCategory');

        if (!schedule) {
            return res.status(404).json({ message: 'Exam schedule not found' });
        }

        // 2. Fetch all active students in that class/section and academic year
        const students = await Student.find({
            className: schedule.class.name,
            section: schedule.section,
            currentAcademicYear: schedule.examCategory.academicYear,
            studentStatus: 'Active'
        }).select('name admissionNo rollNo').lean();

        // 3. Fetch existing marks
        const existingMarks = await ExamMark.find({ examSchedule: scheduleId }).lean();
        const markMap = {};
        existingMarks.forEach(m => {
            markMap[m.student.toString()] = m;
        });

        // 4. Combine students with their marks (or empty mark object)
        const combined = students.map(student => {
            return {
                student: student,
                mark: markMap[student._id.toString()] || {
                    marksObtained: '',
                    grade: '',
                    remarks: '',
                    status: 'Present'
                }
            };
        });

        // Sort by roll number or name
        combined.sort((a, b) => {
            if (a.student.rollNo && b.student.rollNo) {
                return a.student.rollNo.localeCompare(b.student.rollNo, undefined, { numeric: true });
            }
            return a.student.name.localeCompare(b.student.name);
        });

        res.json({ schedule, marks: combined });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Save/Update marks for a schedule (Batch save)
// @route   POST /api/exams/schedules/:scheduleId/marks
// @access  Private (Teacher/Admin)
const saveExamMarks = async (req, res) => {
    try {
        const { scheduleId } = req.params;
        const { marksArray } = req.body;
        // marksArray format: [{ studentId, marksObtained, grade, remarks, status }]

        if (!Array.isArray(marksArray)) {
            return res.status(400).json({ message: 'Invalid data format. Expected an array of marks.' });
        }

        const schedule = await ExamSchedule.findById(scheduleId);
        if (!schedule) return res.status(404).json({ message: 'Exam schedule not found' });

        const operations = marksArray.map(m => {
            return {
                updateOne: {
                    filter: { examSchedule: scheduleId, student: m.studentId },
                    update: {
                        $set: {
                            marksObtained: m.status === 'Absent' ? 0 : m.marksObtained,
                            grade: m.grade,
                            remarks: m.remarks,
                            status: m.status,
                            enteredBy: req.user._id
                        }
                    },
                    upsert: true
                }
            };
        });

        if (operations.length > 0) {
            await ExamMark.bulkWrite(operations);

            // Mark schedule as Results Published
            schedule.status = 'Results Published';
            await schedule.save();
        }

        res.json({ message: 'Marks saved successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ==========================================
// STUDENT VIEW (Student/Parent Portal)
// ==========================================

// @desc    Get marks for a specific student grouped by Category
// @route   GET /api/exams/student/:studentId
// @access  Private (Admin, Teacher, or the Student themselves)
const getStudentMarks = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { academicYear } = req.query;

        // Optionally verify authorization: req.user should be admin, teacher, or the matching student.

        let categoryQuery = {};
        if (academicYear) categoryQuery.academicYear = academicYear;

        // Find relevant categories
        const categories = await ExamCategory.find(categoryQuery).select('_id');
        const categoryIds = categories.map(c => c._id);

        // Find schedules for those categories where the student might have marks
        const schedules = await ExamSchedule.find({ examCategory: { $in: categoryIds } })
            .populate('examCategory', 'name weightage')
            .populate('subject', 'name code type')
            .lean();

        const scheduleIds = schedules.map(s => s._id);

        // Find the marks for this student in those schedules
        const marks = await ExamMark.find({ student: studentId, examSchedule: { $in: scheduleIds } })
            .lean();

        // Organize the data: Category -> [ { subject, marks, maxMarks } ]
        const result = {};

        // map schedule ID to schedule obj
        const scheduleMap = {};
        schedules.forEach(s => scheduleMap[s._id.toString()] = s);

        marks.forEach(m => {
            const sched = scheduleMap[m.examSchedule.toString()];
            if (sched) {
                const catName = sched.examCategory.name;
                if (!result[catName]) {
                    result[catName] = {
                        categoryId: sched.examCategory._id,
                        weightage: sched.examCategory.weightage,
                        results: []
                    };
                }

                result[catName].results.push({
                    subject: sched.subject,
                    date: sched.date,
                    maxMarks: sched.maxMarks,
                    passingMarks: sched.passingMarks,
                    marksObtained: m.marksObtained,
                    grade: m.grade,
                    status: m.status,
                    remarks: m.remarks
                });
            }
        });

        res.json(result);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getExamCategories,
    createExamCategory,
    updateExamCategory,
    deleteExamCategory,
    getExamSchedules,
    createExamSchedule,
    deleteExamSchedule,
    getExamMarks,
    saveExamMarks,
    getStudentMarks
};
