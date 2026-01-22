const Timetable = require('../models/Timetable');

// @desc    Get teacher's schedule
// @route   GET /api/timetable/teacher
// @access  Private (Teacher)
const getTeacherSchedule = async (req, res) => {
    try {
        // req.user.profileId is the Staff ID for the teacher
        const teacherId = req.user.profileId;

        // Find all timetable entries where periods.teacher matches teacherId
        // This is a bit complex query, we need to unwind or filter
        // Actually, we can fetch all and filter in memory or use aggregation
        // Aggregation is better.

        const schedule = await Timetable.aggregate([
            { $unwind: "$periods" },
            { $match: { "periods.teacher": teacherId } },
            {
                $sort: {
                    dayOfWeek: 1, // This sorts alphabetically, which isn't ideal. We map days in frontend.
                    "periods.startTime": 1
                }
            }
        ]);

        res.json(schedule);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const Student = require('../models/Student');

// @desc    Get student's class schedule
// @route   GET /api/timetable/student
// @access  Private (Student)
const getStudentSchedule = async (req, res) => {
    try {
        const studentId = req.user.profileId;
        const student = await Student.findById(studentId);

        if (!student) {
            return res.status(404).json({ message: 'Student profile not found' });
        }

        const schedule = await Timetable.find({
            className: student.className,
            section: student.section
        }).sort({ dayOfWeek: 1 }).populate('periods.teacher', 'name');

        res.json(schedule);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

module.exports = { getTeacherSchedule, getStudentSchedule };
