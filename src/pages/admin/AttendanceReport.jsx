import { useState, useEffect } from 'react';
import { storageService } from '../../services/storage';
import { useToast } from '../../components/ui/Toast';
import {
    ClipboardList,
    Calendar as CalendarIcon,
    Users,
    Download,
    Loader2,
    Search,
    User,
    FileText,
    CheckCircle,
    XCircle,
    Clock
} from 'lucide-react';
import clsx from 'clsx';
import { downloadAttendanceCSV } from '../../utils/AttendanceReportGenerator';
import { downloadAttendancePDF } from '../../utils/AttendancePdfGenerator';

export default function AdminAttendanceReport() {
    const { addToast } = useToast();
    const [allClasses, setAllClasses] = useState([]);
    const [selectedClass, setSelectedClass] = useState(null);
    const [selectedSection, setSelectedSection] = useState('');
    const [date, setDate] = useState(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    });
    const [reportType, setReportType] = useState('monthly');
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [fetching, setFetching] = useState(false);
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                // Fetch all classes available via storageService
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
        fetchInitialData();
    }, []);

    const fetchReport = async () => {
        if (!selectedClass || !selectedSection) return;
        setFetching(true);
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

            const data = await storageService.attendance.getReport(
                selectedClass.name,
                selectedSection,
                params
            );
            setReportData(data);
        } catch (error) {
            console.error("Failed to fetch report", error);
            addToast("Failed to load attendance data", "error");
        } finally {
            setFetching(false);
        }
    };

    useEffect(() => {
        if (selectedClass && selectedSection) {
            fetchReport();
        }
    }, [selectedClass, selectedSection, date, reportType]);

    const handleDownload = (format) => {
        if (!reportData || !selectedClass) return;

        const sectionName = selectedSection;
        const fileName = `Attendance_${selectedClass.name}_${sectionName}_${reportType}_${date}`;
        const title = `Attendance Report: ${selectedClass.name} - ${sectionName} (${reportType.toUpperCase()})`;

        if (format === 'csv') {
            downloadAttendanceCSV(reportData, fileName);
        } else {
            downloadAttendancePDF(reportData, fileName, title);
        }
    };

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
                    <h1 className="text-2xl font-bold text-slate-800">Student Attendance Reports</h1>
                    <p className="text-slate-500 text-sm">Monitor and download class-wise attendance data</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex bg-white border border-slate-200 rounded-xl p-1">
                        {['daily', 'monthly', 'yearly'].map((type) => (
                            <button
                                key={type}
                                onClick={() => setReportType(type)}
                                className={clsx(
                                    "px-4 py-2 rounded-lg text-xs font-bold capitalize transition-all",
                                    reportType === type ? "bg-slate-100 text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                                )}
                            >
                                {type}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={() => handleDownload('csv')}
                        disabled={!reportData || fetching}
                        className="flex items-center gap-2 bg-white border border-slate-200 hover:border-indigo-200 text-slate-600 hover:text-indigo-600 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm"
                    >
                        <Download size={14} />
                        CSV
                    </button>

                    <button
                        onClick={() => handleDownload('pdf')}
                        disabled={!reportData || fetching}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-100"
                    >
                        <FileText size={14} />
                        PDF
                    </button>
                </div>
            </div>

            {/* Filters Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Class</label>
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
                                <option key={idx} value={JSON.stringify(cls)}>
                                    {cls.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Section</label>
                    <div className="relative">
                        <Users size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <select
                            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                            value={selectedSection}
                            onChange={(e) => setSelectedSection(e.target.value)}
                            disabled={!selectedClass}
                        >
                            {selectedClass?.sections?.map((sec, idx) => (
                                <option key={idx} value={sec.name}>
                                    Section {sec.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Reference Date</label>
                    <div className="relative">
                        <CalendarIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                </div>

                <div className="flex items-end">
                    <button
                        onClick={fetchReport}
                        className="w-full bg-slate-800 hover:bg-slate-900 text-white py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                    >
                        <Search size={16} />
                        Generate Report
                    </button>
                </div>
            </div>

            {/* Report Content */}
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
                        <h3 className="text-slate-800 font-bold text-lg mb-1">No Attendance Found</h3>
                        <p className="text-slate-400 text-sm max-w-xs">No attendance has been marked for the selected class during this period.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="sticky left-0 bg-slate-50 px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-r border-slate-100 z-10">Student Name</th>
                                    {reportData.dates.map(d => (
                                        <th key={d} className="px-4 py-4 text-center min-w-[80px]">
                                            <div className="text-[10px] font-black text-indigo-600 uppercase tracking-tighter">
                                                {new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            </div>
                                            <div className="text-[9px] font-bold text-slate-400 truncate max-w-[70px] mt-0.5" title={reportData.markedBy[d]}>
                                                By: {reportData.markedBy[d]?.split(' ')[0] || '-'}
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {reportData.students.map((student) => (
                                    <tr key={student._id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="sticky left-0 bg-white px-6 py-4 border-r border-slate-100 shadow-[2px_0_5px_rgba(0,0,0,0.02)] z-10">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-[10px]">
                                                    {student.rollNo || student.name.charAt(0)}
                                                </div>
                                                <span className="text-sm font-bold text-slate-700 whitespace-nowrap">{student.name}</span>
                                            </div>
                                        </td>
                                        {reportData.dates.map(date => {
                                            const status = student.attendance[date];
                                            return (
                                                <td key={date} className="px-4 py-4">
                                                    <div className="flex justify-center">
                                                        {status === 'Present' && <CheckCircle size={16} className="text-emerald-500" />}
                                                        {status === 'Absent' && <XCircle size={16} className="text-rose-500" />}
                                                        {status === 'Late' && <Clock size={16} className="text-amber-500" />}
                                                        {status === '-' && <span className="text-slate-200">-</span>}
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
