const Class = require('../models/Class');
const Student = require('../models/Student');
const Salary = require('../models/Salary');
const Staff = require('../models/Staff');
const Subject = require('../models/Subject');

// @desc    Get Teacher Statistics (Classes, Students)
// @route   GET /api/teacher/stats
// @access  Private (Teacher)
const getTeacherStats = async (req, res) => {
    try {
        const teacherId = req.user.profileId;

        // Find classes where teacher is either class teacher or subject teacher
        // Note: For now, assuming Class model has sections array with classTeacher field
        // and a way to link subjects to teachers (which might be complex if not explicitly stored).
        // Simplified approach: Find classes where they are class teacher.

        // 1. Classes as Class Teacher
        const classesAsClassTeacher = await Class.find({
            "sections.classTeacher": teacherId
        });

        const totalClasses = classesAsClassTeacher.length; // Approximate for now

        // 2. Count Total Students in these sections
        let totalStudents = 0;
        for (const cls of classesAsClassTeacher) {
            for (const sec of cls.sections) {
                if (sec.classTeacher?.toString() === teacherId.toString()) {
                    const students = await Student.countDocuments({
                        class: cls.name,
                        section: sec.name,
                        status: 'Active'
                    });
                    totalStudents += students;
                }
            }
        }

        res.json({
            totalClasses,
            totalStudents
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

        const classes = await Class.find({
            "sections.classTeacher": teacherId
        }).lean();

        const myClasses = [];

        classes.forEach(cls => {
            cls.sections.forEach(sec => {
                if (sec.classTeacher?.toString() === teacherId.toString()) {
                    myClasses.push({
                        _id: cls._id, // Class ID (Parent)
                        name: cls.name,
                        section: sec.name,
                        role: 'Class Teacher'
                        // Add student count here if needed
                    });
                }
            });
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

        const students = await Student.find({
            className: className,
            section: sectionName,
            status: { $ne: 'Transferred' } // Exclude transferred
        }).sort({ name: 1 }).lean();

        // Calculate Fee Status for each student
        // This is a simplified check. Ideally, use fee service logic.
        const studentsWithFeeStatus = await Promise.all(students.map(async (student) => {
            // Re-using logic from StudentModal fetch roughly or simplified
            // For dashboard list, we just need "Paid" or "Pending" tag
            return {
                _id: student._id,
                name: student.name,
                rollNo: student.rollNo,
                gender: student.gender,
                primaryPhone: student.primaryPhone || student.contact,
                feesStatus: student.feesStatus || 'Pending'
            };
        }));

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
const getTeacherProfile = async (req, res) => {
    try {
        const teacherId = req.user.profileId;
        const teacher = await Staff.findById(teacherId);

        if (!teacher) {
            return res.status(404).json({ message: 'Teacher profile not found' });
        }
        res.json(teacher);
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
