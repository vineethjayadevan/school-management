const Assignment = require('../models/Assignment');

// @desc    Get assignments created by teacher
// @route   GET /api/assignments/teacher
// @access  Private (Teacher)
const getTeacherAssignments = async (req, res) => {
    try {
        const teacherId = req.user.profileId;
        const assignments = await Assignment.find({ teacher: teacherId })
            .sort({ createdAt: -1 });
        res.json(assignments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const Student = require('../models/Student');

// @desc    Get assignments for student's class
// @route   GET /api/assignments/student
// @access  Private (Student)
const getStudentAssignments = async (req, res) => {
    try {
        const studentId = req.user.profileId;
        const student = await Student.findById(studentId);

        if (!student) {
            return res.status(404).json({ message: 'Student profile not found' });
        }

        const assignments = await Assignment.find({
            className: student.className,
            section: student.section,
            status: 'Active' // Optional: show only active? Let's show all for now or maybe sort
        })
            .sort({ dueDate: 1 }) // Earliest due first
            .populate('teacher', 'name subject');

        res.json(assignments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create new assignment
// @route   POST /api/assignments
// @access  Private (Teacher)
const createAssignment = async (req, res) => {
    try {
        const { title, description, className, section, subject, dueDate } = req.body;
        const teacherId = req.user.profileId;

        const assignment = await Assignment.create({
            title,
            description,
            className,
            section,
            subject,
            teacher: teacherId,
            dueDate
        });

        res.status(201).json(assignment);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = { getTeacherAssignments, createAssignment, getStudentAssignments };
