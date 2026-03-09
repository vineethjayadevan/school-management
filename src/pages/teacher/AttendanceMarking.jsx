import { useState, useEffect } from 'react';
import { storageService } from '../../services/storage';
import { useToast } from '../../components/ui/Toast';
import {
    CheckCircle,
    XCircle,
    Clock,
    Save,
    Calendar as CalendarIcon,
    Users,
    ChevronRight,
    Loader2,
    Search,
    User,
    Download,
    ClipboardList,
    AlertCircle,
    Send,
    FileText
} from 'lucide-react';
import clsx from 'clsx';
import { downloadAttendanceCSV } from '../../utils/AttendanceReportGenerator';
import { downloadAttendancePDF } from '../../utils/AttendancePdfGenerator';

export default function AttendanceMarking() {
    const { addToast } = useToast();
    const [classes, setClasses] = useState([]);
    const [selectedClass, setSelectedClass] = useState(null);
    const getTodayLocal = () => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };
    const [date, setDate] = useState(getTodayLocal());
    const [students, setStudents] = useState([]);
    const [attendance, setAttendance] = useState({}); // { studentId: { status, remarks } }
    const [loading, setLoading] = useState(true);
    const [marking, setMarking] = useState(false);
    const [isNotifying, setIsNotifying] = useState(false);
    const [reporting, setReporting] = useState(false);
    const [reportType, setReportType] = useState('monthly'); // 'daily', 'monthly', 'yearly'
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchClasses = async () => {
            try {
                const data = await storageService.teacher.getClasses();
                setClasses(data);
                if (data.length > 0) {
                    setSelectedClass(data[0]);
                }
            } catch (error) {
                console.error("Failed to fetch classes", error);
                addToast("Failed to load classes", "error");
            } finally {
                setLoading(false);
            }
        };
        fetchClasses();
    }, []);

    useEffect(() => {
        if (selectedClass && date) {
            fetchStudentsAndAttendance();
        }
    }, [selectedClass, date]);

    const fetchStudentsAndAttendance = async () => {
        setLoading(true);
        try {
            const cls = selectedClass.name;
            const sec = selectedClass.section;

            // Parallel fetch: Students and existing Attendance
            const [studentsData, existingAttendance] = await Promise.all([
                storageService.teacher.getClassStudents(cls, sec),
                storageService.attendance.getByClass(cls, sec, date)
            ]);

            setStudents(studentsData);

            // Map existing attendance or default to 'Present'
            const attendanceMap = {};
            studentsData.forEach(student => {
                const sId = student.id || student._id;
                const existing = existingAttendance.find(a =>
                    (a.student?._id || a.student) === sId
                );
                attendanceMap[sId] = {
                    status: existing ? existing.status : 'Present',
                    remarks: existing ? existing.remarks : ''
                };
            });
            setAttendance(attendanceMap);
        } catch (error) {
            console.error("Failed to fetch attendance data", error);
            addToast("Failed to load students", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = (studentId, status) => {
        setAttendance(prev => ({
            ...prev,
            [studentId]: { ...prev[studentId], status }
        }));
    };

    const handleRemarksChange = (studentId, remarks) => {
        setAttendance(prev => ({
            ...prev,
            [studentId]: { ...prev[studentId], remarks }
        }));
    };

    const handleMarkAll = (status) => {
        const newAttendance = { ...attendance };
        filteredStudents.forEach(student => {
            const sId = student.id || student._id;
            newAttendance[sId] = {
                ...newAttendance[sId],
                status: status
            };
        });
        setAttendance(newAttendance);
        addToast(`Marked all as ${status}`, "info");
    };

    const handleDownloadReport = async () => {
        if (!selectedClass) return;
        setReporting(true);
        try {
            const now = new Date(date);
            const params = {};

            if (reportType === 'daily') {
                params.startDate = date;
                params.endDate = date;
            } else if (reportType === 'monthly') {
                params.month = now.getMonth() + 1;
                params.year = now.getFullYear();
            } else if (reportType === 'yearly') {
                params.startDate = `${now.getFullYear()}-01-01`;
                params.endDate = `${now.getFullYear()}-12-31`;
            }

            const reportData = await storageService.attendance.getReport(
                selectedClass.name,
                selectedClass.section,
                params
            );

            downloadAttendanceCSV(
                reportData,
                `Attendance_${selectedClass.name}_${selectedClass.section}_${reportType}_${date}`
            );
            addToast("CSV Report downloaded successfully", "success");
        } catch (error) {
            console.error("Failed to generate report", error);
            addToast("Failed to generate report", "error");
        } finally {
            setReporting(false);
        }
    };

    const handleDownloadPDF = async () => {
        if (!selectedClass) return;
        setReporting(true);
        try {
            const now = new Date(date);
            const params = {};

            if (reportType === 'daily') {
                params.startDate = date;
                params.endDate = date;
            } else if (reportType === 'monthly') {
                params.month = now.getMonth() + 1;
                params.year = now.getFullYear();
            } else if (reportType === 'yearly') {
                params.startDate = `${now.getFullYear()}-01-01`;
                params.endDate = `${now.getFullYear()}-12-31`;
            }

            const reportData = await storageService.attendance.getReport(
                selectedClass.name,
                selectedClass.section,
                params
            );

            downloadAttendancePDF(
                reportData,
                `Attendance_${selectedClass.name}_${selectedClass.section}_${reportType}_${date}`,
                `Attendance Report: ${selectedClass.name} - ${selectedClass.section} (${reportType.toUpperCase()})`
            );
            addToast("PDF Report downloaded successfully", "success");
        } catch (error) {
            console.error("Failed to generate PDF report", error);
            addToast("Failed to generate PDF report", "error");
        } finally {
            setReporting(false);
        }
    };

    const handleSave = async () => {
        setMarking(true);
        try {
            const attendanceData = Object.entries(attendance).map(([studentId, data]) => ({
                studentId,
                status: data.status,
                remarks: data.remarks
            }));

            await storageService.attendance.mark({
                date,
                className: selectedClass.name,
                section: selectedClass.section,
                attendanceData
            });

            addToast("Attendance saved successfully", "success");
        } catch (error) {
            console.error("Failed to save attendance", error);
            addToast("Failed to save attendance", "error");
        } finally {
            setMarking(false);
        }
    };

    const handleNotify = async () => {
        if (!selectedClass) return;
        setIsNotifying(true);
        try {
            const response = await storageService.attendance.notifyAbsentees(
                selectedClass.name,
                selectedClass.section,
                date
            );
            addToast(response.message || "Notifications sent successfully", "success");
        } catch (error) {
            console.error("Failed to send notifications", error);
            addToast(error.response?.data?.message || "Failed to send notifications", "error");
        } finally {
            setIsNotifying(false);
        }
    };

    const filteredStudents = students.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.rollNo?.toString().includes(searchTerm)
    );

    if (loading && classes.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-20 md:pb-6">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Class Attendance</h1>
                    <p className="text-slate-500 text-sm">Mark student presence for your assigned classes</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
                        <div className="relative">
                            <CalendarIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                max={getTodayLocal()}
                                className="pl-9 pr-4 py-2 bg-transparent text-sm font-bold text-slate-700 outline-none border-none"
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleNotify}
                        disabled={isNotifying || students.length === 0}
                        className="flex items-center gap-2 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 px-6 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                        title="Send SMS/WhatsApp/Email to Absent/Late students"
                    >
                        {isNotifying ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                        Notify Absentees
                    </button>

                    <button
                        onClick={handleSave}
                        disabled={marking || students.length === 0}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md shadow-indigo-100 disabled:opacity-50"
                    >
                        {marking ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        Save Changes
                    </button>
                </div>
            </div>

            {/* Class Cards */}
            <div className="flex overflow-x-auto pb-2 gap-3 no-scrollbar">
                {classes.map((cls, idx) => (
                    <button
                        key={idx}
                        onClick={() => setSelectedClass(cls)}
                        className={clsx(
                            "flex-shrink-0 px-5 py-3 rounded-2xl text-xs md:text-sm font-bold transition-all border flex flex-col items-start gap-1",
                            selectedClass === cls
                                ? "bg-white border-indigo-500 ring-2 ring-indigo-50 shadow-sm"
                                : "bg-white text-slate-400 border-slate-100 hover:border-indigo-200 shadow-sm"
                        )}
                    >
                        <span className={clsx(
                            "text-[10px] uppercase tracking-widest",
                            selectedClass === cls ? "text-indigo-500" : "text-slate-400"
                        )}>Class Section</span>
                        <span className={clsx(
                            "text-base",
                            selectedClass === cls ? "text-slate-800" : "text-slate-400"
                        )}>{cls.name} — {cls.section}</span>
                    </button>
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-8 space-y-4">
                    {/* Search and Filters */}
                    <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                        <div className="relative flex-1 w-full">
                            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search by name or roll number..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden min-h-[400px]">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-3">
                                <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                                <p className="text-sm font-bold">Synchronizing Students...</p>
                            </div>
                        ) : filteredStudents.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-20 text-center gap-4">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                                    <Users size={32} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800">No Students Found</h3>
                                    <p className="text-slate-400 text-sm max-w-xs">Try adjusting your search or contact admin if the class list is empty.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/50 border-b border-slate-100">
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-20">Roll</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Student</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Remarks</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {filteredStudents.map((student) => {
                                            const sId = student.id || student._id;
                                            const currentStatus = attendance[sId]?.status || 'Present';

                                            return (
                                                <tr key={sId} className="hover:bg-slate-50/30 transition-colors group">
                                                    <td className="px-6 py-4 text-sm font-black text-slate-300 group-hover:text-indigo-400">
                                                        {student.rollNo || '—'}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 font-black text-xs group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
                                                                {student.name.charAt(0)}
                                                            </div>
                                                            <span className="text-sm font-bold text-slate-700 group-hover:text-slate-900 transition-colors">{student.name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center justify-center gap-1.5">
                                                            <StatusIconButton
                                                                active={currentStatus === 'Present'}
                                                                type="Present"
                                                                onClick={() => handleStatusChange(sId, 'Present')}
                                                            />
                                                            <StatusIconButton
                                                                active={currentStatus === 'Absent'}
                                                                type="Absent"
                                                                onClick={() => handleStatusChange(sId, 'Absent')}
                                                            />
                                                            <StatusIconButton
                                                                active={currentStatus === 'Late'}
                                                                type="Late"
                                                                onClick={() => handleStatusChange(sId, 'Late')}
                                                            />
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 min-w-[200px]">
                                                        <input
                                                            type="text"
                                                            placeholder="Add note..."
                                                            value={attendance[sId]?.remarks || ''}
                                                            onChange={(e) => handleRemarksChange(sId, e.target.value)}
                                                            className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-300"
                                                        />
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar Actions */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <ClipboardList size={18} className="text-indigo-500" />
                            <h3 className="text-sm font-bold text-slate-800 tracking-tight">Bulk Actions</h3>
                        </div>
                        <div className="space-y-2">
                            <button
                                onClick={() => handleMarkAll('Present')}
                                className="w-full flex items-center justify-between p-3 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm text-emerald-500">
                                        <CheckCircle size={18} />
                                    </div>
                                    <span className="text-xs font-bold uppercase tracking-widest">All Present</span>
                                </div>
                                <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                            </button>

                            <button
                                onClick={() => handleMarkAll('Absent')}
                                className="w-full flex items-center justify-between p-3 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm text-rose-500">
                                        <XCircle size={18} />
                                    </div>
                                    <span className="text-xs font-bold uppercase tracking-widest">All Absent</span>
                                </div>
                                <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-border pb-4 hidden md:block">
                        <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4">Export Reports</h3>
                        <div className="flex gap-2">
                            <button
                                onClick={handleDownloadReport}
                                disabled={reporting || !selectedClass}
                                className="flex-1 flex items-center justify-center gap-2 bg-slate-50 border border-slate-100 hover:bg-white hover:border-indigo-200 text-slate-600 px-3 py-2.5 rounded-xl text-xs font-bold transition-all"
                            >
                                {reporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                                CSV
                            </button>
                            <button
                                onClick={handleDownloadPDF}
                                disabled={reporting || !selectedClass}
                                className="flex-1 flex items-center justify-center gap-2 bg-indigo-50 border border-indigo-100 hover:bg-indigo-600 hover:text-white text-indigo-600 px-3 py-2.5 rounded-xl text-xs font-bold transition-all"
                            >
                                {reporting ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
                                PDF
                            </button>
                        </div>
                        <div className="mt-4 flex items-center justify-center gap-2">
                            {['daily', 'monthly', 'yearly'].map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setReportType(type)}
                                    className={clsx(
                                        "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                                        reportType === type ? "bg-indigo-600 text-white" : "bg-slate-50 text-slate-400 hover:text-slate-600"
                                    )}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-indigo-600 p-6 rounded-2xl shadow-lg shadow-indigo-100 text-white relative overflow-hidden group border border-indigo-400/20">
                        <div className="absolute -right-4 -bottom-4 opacity-10 rotate-12 transition-transform group-hover:scale-110">
                            <AlertCircle size={120} />
                        </div>
                        <h3 className="text-lg font-bold mb-1">Marking Policy</h3>
                        <p className="text-indigo-100 text-[10px] font-medium leading-relaxed mb-4">Please ensure attendance is marked accurately. Records can be updated later but final reports are locked at month-end.</p>
                        <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-wider bg-white/10 p-2.5 rounded-xl backdrop-blur-sm">
                            <Clock size={14} strokeWidth={3} />
                            Daily Lock: 4:00 PM
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Card List (Hidden on desktop) */}
            <div className="md:hidden space-y-3">
                {filteredStudents.map((student) => {
                    const sId = student.id || student._id;
                    const currentStatus = attendance[sId]?.status || 'Present';

                    return (
                        <div key={sId} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-sm">
                                        {student.rollNo || student.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-800 leading-tight">{student.name}</h4>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Roll No: {student.rollNo || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                <StatusButton
                                    active={currentStatus === 'Present'}
                                    type="Present"
                                    mobile
                                    onClick={() => handleStatusChange(sId, 'Present')}
                                />
                                <StatusButton
                                    active={currentStatus === 'Absent'}
                                    type="Absent"
                                    mobile
                                    onClick={() => handleStatusChange(sId, 'Absent')}
                                />
                                <StatusButton
                                    active={currentStatus === 'Late'}
                                    type="Late"
                                    mobile
                                    onClick={() => handleStatusChange(sId, 'Late')}
                                />
                            </div>

                            <input
                                type="text"
                                placeholder="Add note..."
                                value={attendance[sId]?.remarks || ''}
                                onChange={(e) => handleRemarksChange(sId, e.target.value)}
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function StatusIconButton({ active, type, onClick }) {
    const configs = {
        Present: { icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-200' },
        Absent: { icon: XCircle, color: 'text-rose-500', bg: 'bg-rose-50', border: 'border-rose-200' },
        Late: { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-200' }
    };

    const { icon: Icon, color, bg, border } = configs[type];

    return (
        <button
            onClick={onClick}
            title={type}
            className={clsx(
                "p-2 rounded-xl border transition-all hover:scale-110 outline-none",
                active
                    ? `${bg} ${color} ${border} shadow-sm ring-2 ring-transparent`
                    : "bg-white text-slate-200 border-slate-100 hover:border-slate-300 hover:text-slate-400"
            )}
        >
            <Icon size={18} strokeWidth={active ? 3 : 2} />
        </button>
    );
}

function StatusButton({ active, type, onClick, mobile }) {
    const configs = {
        Present: {
            icon: CheckCircle,
            activeClass: "bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-100",
            inactiveClass: "bg-emerald-50 text-emerald-600 border-emerald-100"
        },
        Absent: {
            icon: XCircle,
            activeClass: "bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-100",
            inactiveClass: "bg-rose-50 text-rose-600 border-rose-100"
        },
        Late: {
            icon: Clock,
            activeClass: "bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-100",
            inactiveClass: "bg-amber-50 text-amber-600 border-amber-100"
        }
    };

    const { icon: Icon, activeClass, inactiveClass } = configs[type];

    return (
        <button
            onClick={onClick}
            className={clsx(
                "flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[10px] md:text-xs font-black transition-all border outline-none",
                active ? activeClass : inactiveClass,
                mobile && "py-3 text-[11px] flex-col gap-1"
            )}
        >
            <Icon size={mobile ? 18 : 14} strokeWidth={active ? 3 : 2} />
            {type}
        </button>
    );
}
