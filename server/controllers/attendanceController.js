const Attendance = require('../models/Attendance');
const Student = require('../models/Student');

// @desc    Mark attendance for a class
// @route   POST /api/attendance/mark
// @access  Private (Teacher)
const markAttendance = async (req, res) => {
    try {
        const { date, className, section, attendanceData } = req.body;
        const markedBy = req.user.profileId; // Staff ID

        if (!date || !className || !section || !attendanceData || !Array.isArray(attendanceData)) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        // Bulk upsert attendance records
        const bulkOps = attendanceData.map(item => ({
            updateOne: {
                filter: { student: item.studentId, date: startOfDay },
                update: {
                    $set: {
                        status: item.status,
                        remarks: item.remarks || '',
                        markedBy,
                        className,
                        section
                    }
                },
                upsert: true
            }
        }));

        await Attendance.bulkWrite(bulkOps);

        res.json({ message: 'Attendance marked successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get attendance for a class on a specific date
// @route   GET /api/attendance/:className/:section/:date
// @access  Private (Teacher)
const getAttendanceByClass = async (req, res) => {
    try {
        const { className, section, date } = req.params;

        const searchDate = new Date(date);
        searchDate.setHours(0, 0, 0, 0);

        const attendance = await Attendance.find({
            className,
            section,
            date: searchDate
        }).populate('student', 'name rollNo admissionNo');

        res.json(attendance);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get attendance statistics for a student
// @route   GET /api/attendance/student/:studentId
// @access  Private (Teacher/Student)
const getStudentAttendance = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { month, year } = req.query;

        let query = { student: studentId };

        if (month && year) {
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0);
            query.date = { $gte: startDate, $lte: endDate };
        }

        const attendance = await Attendance.find(query).sort({ date: 1 });

        const stats = {
            present: attendance.filter(a => a.status === 'Present').length,
            absent: attendance.filter(a => a.status === 'Absent').length,
            late: attendance.filter(a => a.status === 'Late').length,
            total: attendance.length
        };

        res.json({ attendance, stats });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    markAttendance,
    getAttendanceByClass,
    getStudentAttendance
};
