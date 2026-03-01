const Timetable = require('../models/Timetable');
const Student = require('../models/Student');
const PeriodTemplate = require('../models/PeriodTemplate');

// @desc  Save or update a timetable (upsert)
// @route POST /api/timetable
const saveTimetable = async (req, res) => {
    try {
        const { academicYear, className, section, periodTemplate, schedule } = req.body;
        if (!academicYear || !className || !section || !periodTemplate) {
            return res.status(400).json({ message: 'academicYear, className, section, and periodTemplate are required.' });
        }

        const timetable = await Timetable.findOneAndUpdate(
            { academicYear, className, section },
            { academicYear, className, section, periodTemplate, schedule: schedule || [] },
            { upsert: true, new: true, runValidators: true }
        )
            .populate('schedule.slots.subject', 'name code type')
            .populate('schedule.slots.teacher', 'name')
            .populate('periodTemplate');

        res.status(200).json(timetable);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Get timetable for admin view (class + section + academic year)
// @route GET /api/timetable?academicYear=:id&className=:name&section=:sec
const getTimetable = async (req, res) => {
    try {
        const { academicYear, className, section } = req.query;
        const filter = {};
        if (academicYear) filter.academicYear = academicYear;
        if (className) filter.className = className;
        if (section) filter.section = section;

        const timetable = await Timetable.findOne(filter)
            .populate('schedule.slots.subject', 'name code type')
            .populate('schedule.slots.teacher', 'name')
            .populate('periodTemplate')
            .populate('academicYear', 'name');

        res.json(timetable || null);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Get all timetables (for listing which class-sections have been configured)
// @route GET /api/timetable/all
const getAllTimetables = async (req, res) => {
    try {
        const { academicYear } = req.query;
        const filter = academicYear ? { academicYear } : {};
        const timetables = await Timetable.find(filter)
            .select('academicYear className section updatedAt')
            .populate('academicYear', 'name')
            .sort({ className: 1, section: 1 });
        res.json(timetables);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Delete a timetable
// @route DELETE /api/timetable/:id
const deleteTimetable = async (req, res) => {
    try {
        await Timetable.findByIdAndDelete(req.params.id);
        res.json({ message: 'Timetable deleted.' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Get student's timetable (by their class/section from student profile)
// @route GET /api/timetable/student/:studentId
const getStudentTimetable = async (req, res) => {
    try {
        const studentId = req.params.studentId || req.user.profileId;
        const { academicYear } = req.query;

        const student = await Student.findById(studentId);
        if (!student) return res.status(404).json({ message: 'Student not found' });

        const filter = {
            className: student.className,
            section: student.section,
        };
        if (academicYear) filter.academicYear = academicYear;

        const timetable = await Timetable.findOne(filter)
            .populate('schedule.slots.subject', 'name code type')
            .populate('schedule.slots.teacher', 'name')
            .populate('periodTemplate')
            .populate('academicYear', 'name');

        res.json(timetable || null);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @desc  Get teacher's schedule (all classes they teach)
// @route GET /api/timetable/teacher/:staffId
const getTeacherSchedule = async (req, res) => {
    try {
        const { staffId } = req.params;
        const { academicYear } = req.query;

        const filter = academicYear ? { academicYear } : {};
        const allTimetables = await Timetable.find(filter)
            .populate('schedule.slots.subject', 'name code type')
            .populate('schedule.slots.teacher', 'name')
            .populate('periodTemplate')
            .populate('academicYear', 'name');

        // Filter to only slots where this teacher is assigned
        const teacherSchedule = [];
        for (const tt of allTimetables) {
            for (const dayEntry of tt.schedule) {
                for (const slot of dayEntry.slots) {
                    if (slot.teacher && slot.teacher._id?.toString() === staffId) {
                        teacherSchedule.push({
                            day: dayEntry.day,
                            slotNumber: slot.slotNumber,
                            subject: slot.subject,
                            className: tt.className,
                            section: tt.section,
                            academicYear: tt.academicYear,
                            note: slot.note
                        });
                    }
                }
            }
        }

        res.json(teacherSchedule);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = {
    saveTimetable,
    getTimetable,
    getAllTimetables,
    deleteTimetable,
    getStudentTimetable,
    getTeacherSchedule
};
