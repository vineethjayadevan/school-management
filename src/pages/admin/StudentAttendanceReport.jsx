import { useState, useEffect } from 'react';
import { storageService } from '../../services/storage';
import { useToast } from '../../components/ui/Toast';
import {
    Calendar as CalendarIcon,
    Download,
    Loader2,
    Search,
    FileText,
    CheckCircle,
    XCircle,
    Clock,
    Users,
    ClipboardList
} from 'lucide-react';
import clsx from 'clsx';
import { downloadAttendanceCSV } from '../../utils/AttendanceReportGenerator';
import { downloadAttendancePDF } from '../../utils/AttendancePdfGenerator';

export default function StudentAttendanceReport() {
    const { addToast } = useToast();
    const [allClasses, setAllClasses] = useState([]);
    const [selectedClass, setSelectedClass] = useState(null);
    const [selectedSection, setSelectedSection] = useState('');
    const [date, setDate] = useState(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
    });
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [fetching, setFetching] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchClasses = async () => {
            try {
                const classesData = await storageService.academics.getClasses();
                if (Array.isArray(classesData)) {
                    setAllClasses(classesData);
                    if (classesData.length > 0) {
                        setSelectedClass(classesData[0]);
                        if (classesData[0].sections?.length > 0) {
                            setSelectedSection(classesData[0].sections[0].name);
                        }
                    }
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

    const fetchReport = async () => {
        if (!selectedClass || !selectedSection) return;
        setFetching(true);
        try {
            const now = new Date(date);
            const params = {
                month: now.getMonth() + 1,
                year: now.getFullYear()
            };

            const data = await storageService.attendance.getReport(
                selectedClass.name,
                selectedSection,
                params
            );
            setReportData(data);
        } catch (error) {
            console.error("Failed to fetch report", error);
            addToast("Failed to load attendance records", "error");
        } finally {
            setFetching(false);
        }
    };

    useEffect(() => {
        if (selectedClass && selectedSection) {
            fetchReport();
        }
    }, [selectedClass, selectedSection, date]);

    const handleDownload = (format) => {
        if (!reportData || !selectedClass) return;

        const now = new Date(date);
        const monthName = now.toLocaleString('default', { month: 'long' });
        const fileName = `Student_Attendance_${selectedClass.name}_${selectedSection}_${monthName}_${now.getFullYear()}`;
        const title = `Student Attendance Report: ${selectedClass.name} - ${selectedSection} (${monthName} ${now.getFullYear()})`;

        if (format === 'csv') {
            downloadAttendanceCSV(reportData, fileName);
        } else {
            downloadAttendancePDF(reportData, fileName, title);
        }
    };

    const filteredStudents = reportData?.students.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.rollNo?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Student Attendance Report</h1>
                    <p className="text-slate-500 text-sm">Monthly summary of class-wise student attendance</p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => handleDownload('csv')}
                        disabled={!reportData || fetching}
                        className="flex items-center gap-2 bg-white border border-slate-200 hover:border-indigo-200 text-slate-600 hover:text-indigo-600 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm disabled:opacity-50"
                    >
                        <Download size={14} />
                        CSV
                    </button>

                    <button
                        onClick={() => handleDownload('pdf')}
                        disabled={!reportData || fetching}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-100 disabled:opacity-50"
                    >
                        <FileText size={14} />
                        PDF
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Class</label>
                    <div className="relative">
                        <Users size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <select
                            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                            value={selectedClass ? JSON.stringify(selectedClass) : ''}
                            onChange={(e) => {
                                const cls = JSON.parse(e.target.value);
                                setSelectedClass(cls);
                                if (cls.sections?.length > 0) {
                                    setSelectedSection(cls.sections[0].name);
                                }
                            }}
                        >
                            {allClasses.map((cls, idx) => (
                                <option key={idx} value={JSON.stringify(cls)}>{cls.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Section</label>
                    <div className="relative">
                        <Users size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <select
                            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                            value={selectedSection}
                            onChange={(e) => setSelectedSection(e.target.value)}
                            disabled={!selectedClass}
                        >
                            {selectedClass?.sections?.map((sec, idx) => (
                                <option key={idx} value={sec.name}>Section {sec.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Month</label>
                    <div className="relative">
                        <CalendarIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="month"
                            value={date.substring(0, 7)}
                            onChange={(e) => setDate(`${e.target.value}-01`)}
                            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Search Student</label>
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Name or Roll No..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* Content Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden min-h-[400px]">
                {fetching ? (
                    <div className="flex flex-col items-center justify-center h-96 gap-3">
                        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                        <p className="text-slate-400 font-medium">Fetching attendance records...</p>
                    </div>
                ) : !reportData || reportData.dates.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-96 text-center px-4">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
                            <ClipboardList size={32} />
                        </div>
                        <h3 className="text-slate-800 font-bold text-lg mb-1">No Data Found</h3>
                        <p className="text-slate-400 text-sm max-w-xs">No records found for the selected month and class.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="sticky left-0 bg-slate-50 px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-r border-slate-100 z-10">Student Info</th>
                                    {reportData.dates.map(d => (
                                        <th key={d} className="px-3 py-4 text-center min-w-[50px]">
                                            <div className="text-[10px] font-black text-indigo-600 uppercase tracking-tighter">
                                                {new Date(d).getDate()}
                                            </div>
                                            <div className="text-[8px] font-bold text-slate-400 uppercase">
                                                {new Date(d).toLocaleDateString(undefined, { weekday: 'short' }).charAt(0)}
                                            </div>
                                            <div className="text-[7px] font-bold text-slate-300 truncate max-w-[40px] mt-0.5" title={reportData.markedBy[d]}>
                                                {reportData.markedBy[d]?.split(' ')[0]}
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredStudents.map((student) => (
                                    <tr key={student._id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="sticky left-0 bg-white px-6 py-3 border-r border-slate-100 shadow-[2px_0_5px_rgba(0,0,0,0.02)] z-10">
                                            <div className="text-sm font-bold text-slate-700 whitespace-nowrap">{student.name}</div>
                                            <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Roll: {student.rollNo}</div>
                                        </td>
                                        {reportData.dates.map(date => {
                                            const status = student.attendance[date];
                                            return (
                                                <td key={date} className="px-2 py-3">
                                                    <div className="flex justify-center">
                                                        {status === 'Present' && <CheckCircle size={14} className="text-emerald-500" />}
                                                        {status === 'Absent' && <XCircle size={14} className="text-rose-500" />}
                                                        {status === 'Late' && <Clock size={14} className="text-amber-500" />}
                                                        {status === '-' && <span className="text-slate-200 text-xs">-</span>}
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
