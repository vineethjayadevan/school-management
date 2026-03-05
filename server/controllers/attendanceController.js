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
        const { className, section } = req.params;
        const { date } = req.query;

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

// @desc    Get attendance summary for a class over a period (for reports)
// @route   GET /api/attendance/report/:className/:section
// @access  Private (Teacher)
const getClassAttendanceSummary = async (req, res) => {
    try {
        const { className, section } = req.params;
        const { month, year, startDate, endDate } = req.query;

        let start, end;

        if (month && year) {
            start = new Date(year, month - 1, 1);
            end = new Date(year, month, 0, 23, 59, 59, 999);
        } else if (startDate && endDate) {
            start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
        } else {
            return res.status(400).json({ message: 'Month/Year or Date range required' });
        }

        // 1. Get all students in this class
        const students = await Student.find({ className, section }).select('name rollNo admissionNo').sort({ rollNo: 1 });

        // 2. Get all attendance records for this class and period
        const attendanceRecords = await Attendance.find({
            className,
            section,
            date: { $gte: start, $lte: end }
        }).populate('markedBy', 'name').sort({ date: 1 });

        // Helper to get local date string YYYY-MM-DD
        const getLocalDateString = (d) => {
            const date = new Date(d);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        // 3. Format into a matrix
        const dates = [...new Set(attendanceRecords.map(a => getLocalDateString(a.date)))];

        // Create a map for quick access to who marked what date
        const markedByMap = {};
        attendanceRecords.forEach(record => {
            const dateStr = getLocalDateString(record.date);
            if (!markedByMap[dateStr] && record.markedBy) {
                markedByMap[dateStr] = record.markedBy.name;
            }
        });

        const reportData = students.map(student => {
            const studentAttendance = {};
            dates.forEach(date => {
                const record = attendanceRecords.find(a =>
                    a.student.toString() === student._id.toString() &&
                    getLocalDateString(a.date) === date
                );
                studentAttendance[date] = record ? record.status : '-';
            });

            return {
                _id: student._id,
                name: student.name,
                rollNo: student.rollNo,
                admissionNo: student.admissionNo,
                attendance: studentAttendance
            };
        });

        res.json({ dates, students: reportData, markedBy: markedByMap });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    markAttendance,
    getAttendanceByClass,
    getStudentAttendance,
    getClassAttendanceSummary
};
