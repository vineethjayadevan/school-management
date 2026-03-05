const Class = require('../models/Class');
const Student = require('../models/Student');
const Salary = require('../models/Salary');
const Staff = require('../models/Staff');
const User = require('../models/User');
const Subject = require('../models/Subject');

// @desc    Get Teacher Statistics (Classes, Students)
// @route   GET /api/teacher/stats
// @access  Private (Teacher)
const getTeacherStats = async (req, res) => {
    try {
        const teacherId = req.user.profileId;

        // 1. Classes where they are class teacher
        const classesAsClassTeacher = await Class.find({
            "sections.classTeacher": teacherId
        }).lean();

        // 2. Classes where they are subject teacher (from Timetable)
        const Timetable = require('../models/Timetable');
        const timetableEntries = await Timetable.find({
            "periods.teacher": teacherId
        }).select('className section').lean();

        const allAssociated = [];

        for (const cls of classesAsClassTeacher) {
            for (const sec of cls.sections) {
                if (sec.classTeacher?.toString() === teacherId.toString()) {
                    allAssociated.push({ className: cls.name, section: sec.name });
                }
            }
        }

        timetableEntries.forEach(t => {
            allAssociated.push({ className: t.className, section: t.section });
        });

        // Unique by class + section
        const uniqueClasses = allAssociated.reduce((acc, current) => {
            const x = acc.find(item => item.className === current.className && item.section === current.section);
            if (!x) return acc.concat([current]);
            return acc;
        }, []);

        let totalStudents = 0;
        const classBreakdown = [];

        for (const item of uniqueClasses) {
            const studentCount = await Student.countDocuments({
                className: item.className,
                section: item.section,
                $or: [
                    { studentStatus: 'Active' },
                    { studentStatus: { $exists: false } }
                ],
                isActive: true
            });
            totalStudents += studentCount;
            classBreakdown.push({
                className: item.className, // Consistent with frontend Attendance
                sectionName: item.section,
                studentCount
            });
        }

        res.json({
            totalClasses: classBreakdown.length,
            totalStudents,
            classBreakdown
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Teacher's Assigned Classes
// @route   GET /api/teacher/classes
// @access  Private (Teacher)
const getTeacherClasses = async (req, res) => {
    try {
        const teacherId = req.user.profileId;

        // Class Teacher Roles
        const classes = await Class.find({
            "sections.classTeacher": teacherId
        }).lean();

        // Subject Teacher Roles (from Timetable)
        const Timetable = require('../models/Timetable');
        const timetableEntries = await Timetable.find({
            "periods.teacher": teacherId
        }).select('className section').lean();

        const myClasses = [];

        // Add Class Teacher roles
        classes.forEach(cls => {
            cls.sections.forEach(sec => {
                if (sec.classTeacher?.toString() === teacherId.toString()) {
                    myClasses.push({
                        _id: cls._id,
                        name: cls.name,
                        className: cls.name, // Added for duplicate compatibility
                        section: sec.name,
                        role: 'Class Teacher'
                    });
                }
            });
        });

        // Add Subject Teacher roles
        timetableEntries.forEach(t => {
            const exists = myClasses.find(c => c.name === t.className && c.section === t.section);
            if (!exists) {
                myClasses.push({
                    name: t.className,
                    className: t.className,
                    section: t.section,
                    role: 'Subject Teacher'
                });
            }
        });

        res.json(myClasses);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Students of a Specific Class Section
// @route   GET /api/teacher/classes/:className/:sectionName/students
// @access  Private (Teacher)
const getClassStudents = async (req, res) => {
    try {
        const { className, sectionName } = req.params;

        // Ensure we are fetching active students using studentStatus: 'Active'
        const students = await Student.find({
            className: className,
            section: sectionName,
            $or: [
                { studentStatus: 'Active' },
                { studentStatus: { $exists: false } }
            ],
            isActive: true
        }).sort({ name: 1 }).lean();

        // Calculate Fee Status for each student
        // The student schema has a feesStatus field
        const studentsWithFeeStatus = students.map((student) => {
            return {
                _id: student._id,
                name: student.name,
                admissionNo: student.admissionNo,
                rollNo: student.rollNo,
                gender: student.gender,
                guardian: student.guardian,
                primaryPhone: student.primaryPhone || student.contact || 'N/A',
                photoUrl: student.photoUrl,
                feesStatus: student.feesStatus || 'Pending',
                conveyanceSlab: student.conveyanceSlab,
                lastConveyancePayment: student.lastConveyancePayment
            };
        });

        res.json(studentsWithFeeStatus);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Teacher's Salary History
// @route   GET /api/teacher/salary-history
// @access  Private (Teacher)
const getTeacherSalaryHistory = async (req, res) => {
    try {
        const teacherId = req.user.profileId;

        const salaries = await Salary.find({ staff: teacherId })
            .sort({ month: -1 })
            .lean();

        res.json(salaries);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Teacher Profile
// @route   GET /api/teacher/profile
// @access  Private (Teacher)
const { signUrl } = require('./uploadController');

const getTeacherProfile = async (req, res) => {
    try {
        const teacherId = req.user.profileId;
        const teacher = await Staff.findById(teacherId)
            .populate('subjects', 'name code')
            .lean();

        if (!teacher) {
            return res.status(404).json({ message: 'Teacher profile not found' });
        }

        // Sign the photoUrl if it exists
        if (teacher.photoUrl) {
            teacher.photoUrl = await signUrl(teacher.photoUrl);
        }

        // Fetch username
        let username = req.user.username;
        if (!username) {
            const user = await User.findOne({ profileId: teacherId }).select('username');
            username = user?.username;
        }

        // Find classes where this teacher is class incharge
        const classesAsIncharge = await Class.find({
            'sections.classTeacher': teacherId
        }).select('name sections').lean();

        const classIncharge = [];
        for (const cls of classesAsIncharge) {
            for (const sec of cls.sections) {
                if (sec.classTeacher?.toString() === teacherId.toString()) {
                    classIncharge.push({ className: cls.name, section: sec.name });
                }
            }
        }

        // Unique subjects taught (from timetable)
        const Timetable = require('../models/Timetable');
        const timetableEntries = await Timetable.find({
            'periods.teacher': teacherId
        }).lean();

        const subjectsTaught = new Set();
        timetableEntries.forEach(tt => {
            tt.periods.forEach(p => {
                if (p.teacher?.toString() === teacherId.toString() && p.subject) {
                    subjectsTaught.add(p.subject);
                }
            });
        });

        res.json({
            ...teacher,
            username: username || 'N/A',
            classIncharge,
            subjectsTaughtInTimetable: [...subjectsTaught],
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getTeacherStats,
    getTeacherClasses,
    getClassStudents,
    getTeacherSalaryHistory,
    getTeacherProfile
};
