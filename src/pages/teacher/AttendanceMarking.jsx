import { useState, useEffect } from 'react';
import { storageService } from '../../services/storage';
import { useToast } from '../../components/ui/Toast';
import { CheckCircle, XCircle, Clock, Save, Calendar as CalendarIcon, Users, ChevronRight, Loader2, User } from 'lucide-react';
import clsx from 'clsx';

export default function AttendanceMarking() {
    const { addToast } = useToast();
    const [classes, setClasses] = useState([]);
    const [selectedClass, setSelectedClass] = useState(null);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [students, setStudents] = useState([]);
    const [attendance, setAttendance] = useState({}); // { studentId: { status, remarks } }
    const [loading, setLoading] = useState(true);
    const [marking, setMarking] = useState(false);

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
                const existing = existingAttendance.find(a =>
                    (a.student?._id || a.student) === (student.id || student._id)
                );
                attendanceMap[student.id || student._id] = {
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

    if (loading && classes.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-20 md:pb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-slate-800">Attendance Marking</h1>
                    <p className="text-slate-500 text-xs md:text-sm">Select class and date to mark presence</p>
                </div>

                <div className="flex items-center gap-2 md:gap-3">
                    <div className="relative flex-1 md:flex-none">
                        <CalendarIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            max={new Date().toISOString().split('T')[0]}
                            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* Class Selection - Horizontal Scroll on Mobile */}
            <div className="flex overflow-x-auto pb-2 gap-2 no-scrollbar">
                {classes.map((cls, idx) => (
                    <button
                        key={idx}
                        onClick={() => setSelectedClass(cls)}
                        className={clsx(
                            "flex-shrink-0 px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all border",
                            selectedClass === cls
                                ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100"
                                : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"
                        )}
                    >
                        {cls.name} - {cls.section}
                    </button>
                ))}
            </div>

            {/* Student List Container */}
            <div className="space-y-4">
                {loading ? (
                    <div className="bg-white rounded-2xl p-12 shadow-sm border border-slate-100 flex flex-col items-center justify-center">
                        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-3" />
                        <p className="text-slate-400 text-sm">Loading students...</p>
                    </div>
                ) : students.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
                        <div className="p-4 bg-slate-50 rounded-full mb-4">
                            <Users size={32} className="text-slate-300" />
                        </div>
                        <h3 className="text-slate-800 font-bold mb-1">No Students Found</h3>
                        <p className="text-slate-400 text-sm">There are no students assigned to this class.</p>
                    </div>
                ) : (
                    <>
                        {/* Desktop Table View */}
                        <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-100">
                                    <tr>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Roll No</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Student Name</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Attendance Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {students.map((student) => {
                                        const sId = student.id || student._id;
                                        const currentStatus = attendance[sId]?.status || 'Present';

                                        return (
                                            <tr key={sId} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-4 text-sm font-black text-slate-400">{student.rollNo || '-'}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-black text-xs">
                                                            {student.name.charAt(0)}
                                                        </div>
                                                        <span className="text-sm font-bold text-slate-700">{student.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <StatusButton
                                                            active={currentStatus === 'Present'}
                                                            type="Present"
                                                            onClick={() => handleStatusChange(sId, 'Present')}
                                                        />
                                                        <StatusButton
                                                            active={currentStatus === 'Absent'}
                                                            type="Absent"
                                                            onClick={() => handleStatusChange(sId, 'Absent')}
                                                        />
                                                        <StatusButton
                                                            active={currentStatus === 'Late'}
                                                            type="Late"
                                                            onClick={() => handleStatusChange(sId, 'Late')}
                                                        />
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Card List View */}
                        <div className="md:hidden space-y-3">
                            {students.map((student) => {
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
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>

            {/* Floating Save Button on Mobile */}
            <div className="fixed bottom-6 left-0 right-0 px-6 md:static md:px-0 z-50">
                <button
                    onClick={handleSave}
                    disabled={marking || students.length === 0}
                    className="w-full md:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3.5 md:py-2.5 rounded-2xl md:rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 transition-all disabled:opacity-50 active:scale-95"
                >
                    {marking ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    Save Attendance
                </button>
            </div>
        </div>
    );
}

function StatusButton({ active, type, onClick, mobile }) {
    const configs = {
        Present: {
            icon: CheckCircle,
            activeClass: "bg-emerald-500 text-white border-emerald-500",
            inactiveClass: "bg-emerald-50 text-emerald-600 border-emerald-100"
        },
        Absent: {
            icon: XCircle,
            activeClass: "bg-rose-500 text-white border-rose-500",
            inactiveClass: "bg-rose-50 text-rose-600 border-rose-100"
        },
        Late: {
            icon: Clock,
            activeClass: "bg-amber-500 text-white border-amber-500",
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
