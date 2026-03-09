const StaffAttendance = require('../models/StaffAttendance');
const Staff = require('../models/Staff');
const GlobalSettings = require('../models/GlobalSettings');
const { sendStaffAttendanceEmail } = require('../utils/emailService');
const { sendStaffAttendanceMSG91SMS, sendStaffAttendanceMSG91WhatsApp } = require('../utils/msg91Service');

// @desc    Mark or update staff attendance
// @route   POST /api/staff-attendance/mark
// @access  Private/Admin
const markStaffAttendance = async (req, res) => {
    try {
        const { date, attendanceData } = req.body;
        // attendanceData: [{ staffId, status, remarks }]

        if (!date || !attendanceData || !Array.isArray(attendanceData)) {
            return res.status(400).json({ message: 'Invalid attendance data' });
        }

        const attendanceDate = new Date(date);
        attendanceDate.setHours(0, 0, 0, 0);

        const operations = attendanceData.map(item => ({
            updateOne: {
                filter: { staff: item.staffId, date: attendanceDate },
                update: {
                    status: item.status,
                    remarks: item.remarks || '',
                    markedBy: req.user._id
                },
                upsert: true
            }
        }));

        await StaffAttendance.bulkWrite(operations);

        res.status(200).json({ message: 'Staff attendance marked successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get staff attendance for a specific date
// @route   GET /api/staff-attendance/day?date=...
// @access  Private/Admin
const getDayStaffAttendance = async (req, res) => {
    try {
        const { date } = req.query;
        if (!date) {
            return res.status(400).json({ message: 'Date is required' });
        }

        const queryDate = new Date(date);
        queryDate.setHours(0, 0, 0, 0);

        const attendance = await StaffAttendance.find({ date: queryDate });
        res.json(attendance);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get staff attendance summary for a period
// @route   GET /api/staff-attendance/summary
// @access  Private/Admin
const getStaffAttendanceSummary = async (req, res) => {
    try {
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
            return res.status(400).json({ message: 'Period required' });
        }

        const staffList = await Staff.find({}).select('name employeeId category').sort({ name: 1 });

        const attendanceRecords = await StaffAttendance.find({
            date: { $gte: start, $lte: end }
        }).populate('markedBy', 'name').sort({ date: 1 });

        const getLocalDateString = (d) => {
            const date = new Date(d);
            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        };

        const dates = [...new Set(attendanceRecords.map(a => getLocalDateString(a.date)))];
        const markedByMap = {};
        attendanceRecords.forEach(record => {
            const d = getLocalDateString(record.date);
            if (!markedByMap[d] && record.markedBy) {
                markedByMap[d] = record.markedBy.name;
            }
        });

        const reportData = staffList.map(item => {
            const staffAttendance = {};
            dates.forEach(date => {
                const record = attendanceRecords.find(a =>
                    a.staff.toString() === item._id.toString() &&
                    getLocalDateString(a.date) === date
                );
                staffAttendance[date] = record ? record.status : '-';
            });

            return {
                _id: item._id,
                name: item.name,
                employeeId: item.employeeId,
                category: item.category,
                attendance: staffAttendance
            };
        });

        res.json({ dates, staff: reportData, markedBy: markedByMap });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get personal attendance for logged in staff
// @route   GET /api/staff-attendance/my-attendance
// @access  Private
const getMyStaffAttendance = async (req, res) => {
    try {
        const staffId = req.user.profileId;
        if (!staffId) {
            return res.status(400).json({ message: 'User not linked to a staff profile' });
        }

        const { month, year } = req.query;
        let query = { staff: staffId };

        if (month && year) {
            const start = new Date(year, month - 1, 1);
            const end = new Date(year, month, 0, 23, 59, 59, 999);
            query.date = { $gte: start, $lte: end };
        }

        const attendance = await StaffAttendance.find(query)
            .sort({ date: -1 })
            .populate('markedBy', 'name');

        res.json(attendance);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Notify staff who are marked absent or late
// @route   POST /api/staff-attendance/notify
// @access  Private/Admin
const notifyStaffAbsentees = async (req, res) => {
    try {
        const { date } = req.body;

        if (!date) {
            return res.status(400).json({ message: 'Date is required' });
        }

        // 1. Check Global Settings
        const settings = await GlobalSettings.findById('SYSTEM_SETTINGS');
        const emailEnabled = settings?.notificationSettings?.staffAttendanceReport?.email ?? false;
        const smsEnabled = settings?.notificationSettings?.staffAttendanceReport?.sms ?? false;
        const whatsappEnabled = settings?.notificationSettings?.staffAttendanceReport?.whatsapp ?? false;

        if (!emailEnabled && !smsEnabled && !whatsappEnabled) {
            return res.status(400).json({ message: 'Staff attendance notifications are fully disabled in system settings' });
        }

        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        // 2. Fetch Attendance Records for this date
        const attendanceRecords = await StaffAttendance.find({
            date: { $gte: startOfDay, $lte: endOfDay },
            status: { $in: ['Absent', 'Late'] }
        }).populate('staff');

        if (attendanceRecords.length === 0) {
            return res.status(200).json({ message: 'No absent or late staff to notify' });
        }

        let sentCount = 0;
        const notificationPromises = [];

        // 3. Queue Notifications
        for (const record of attendanceRecords) {
            const staff = record.staff;
            if (!staff) continue;

            const notifyData = {
                staffName: staff.name,
                employeeId: staff.employeeId,
                date,
                status: record.status // 'Absent' or 'Late'
            };

            // Queue Email
            if (emailEnabled && staff.email) {
                notificationPromises.push(
                    sendStaffAttendanceEmail({
                        ...notifyData,
                        toEmail: staff.email
                    })
                );
            }

            // Queue SMS & WhatsApp
            const mobile = staff.mobile || staff.phone; // Handle potential different field names
            if (mobile) {
                if (smsEnabled) {
                    notificationPromises.push(sendStaffAttendanceMSG91SMS({ ...notifyData, mobile }));
                }
                if (whatsappEnabled) {
                    notificationPromises.push(sendStaffAttendanceMSG91WhatsApp({ ...notifyData, mobile }));
                }
            }

            sentCount++;
        }

        // Fire all notifications concurrently
        await Promise.allSettled(notificationPromises);

        res.json({ message: `Successfully processed notifications for ${sentCount} staff members` });
    } catch (error) {
        console.error('Error in notifyStaffAbsentees:', error);
        res.status(500).json({ message: 'Failed to send staff notifications' });
    }
};

module.exports = {
    markStaffAttendance,
    getDayStaffAttendance,
    getStaffAttendanceSummary,
    getMyStaffAttendance,
    notifyStaffAbsentees
};
