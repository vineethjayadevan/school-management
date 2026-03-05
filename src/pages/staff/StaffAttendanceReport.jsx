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
    Briefcase
} from 'lucide-react';
import clsx from 'clsx';
import { downloadAttendanceCSV } from '../../utils/AttendanceReportGenerator';
import { downloadAttendancePDF } from '../../utils/AttendancePdfGenerator';

export default function StaffAttendanceReport() {
    const { addToast } = useToast();
    const [date, setDate] = useState(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    });
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');

    const categories = ['All', 'Teaching', 'Teacher', 'Non-Teaching', 'Admin', 'Support'];

    const fetchReport = async () => {
        setLoading(true);
        try {
            const now = new Date(date);
            const params = {
                month: now.getMonth() + 1,
                year: now.getFullYear()
            };

            const data = await storageService.staffAttendance.getSummary(params);
            setReportData(data);
        } catch (error) {
            console.error("Failed to fetch report", error);
            addToast("Failed to load staff attendance summary", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, [date]);

    const handleDownload = (format) => {
        if (!reportData) return;

        const now = new Date(date);
        const monthName = now.toLocaleString('default', { month: 'long' });
        const fileName = `Staff_Attendance_${monthName}_${now.getFullYear()}`;
        const title = `Staff Attendance Report: ${monthName} ${now.getFullYear()}`;

        // Map data to the format expected by generators
        // reportData is { dates, staff: [{ name, employeeId, category, attendance: { date: status } }], markedBy }
        const formattedData = {
            dates: reportData.dates,
            students: reportData.staff.map(s => ({
                ...s,
                rollNo: s.employeeId // Generators use rollNo for the ID column
            })),
            markedBy: reportData.markedBy
        };

        if (format === 'csv') {
            downloadAttendanceCSV(formattedData, fileName);
        } else {
            downloadAttendancePDF(formattedData, fileName, title);
        }
    };

    const filteredStaff = reportData?.staff.filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.employeeId?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter === 'All' || s.category === categoryFilter;
        return matchesSearch && matchesCategory;
    }) || [];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Staff Attendance Report</h1>
                    <p className="text-slate-500 text-sm">Monthly overview and summary of employee attendance</p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => handleDownload('csv')}
                        disabled={!reportData || loading}
                        className="flex items-center gap-2 bg-white border border-slate-200 hover:border-indigo-200 text-slate-600 hover:text-indigo-600 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm disabled:opacity-50"
                    >
                        <Download size={14} />
                        CSV
                    </button>

                    <button
                        onClick={() => handleDownload('pdf')}
                        disabled={!reportData || loading}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-100 disabled:opacity-50"
                    >
                        <FileText size={14} />
                        PDF
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Reference Month</label>
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
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Filter Category</label>
                    <div className="relative">
                        <Briefcase size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none appearance-none"
                        >
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Search Staff</label>
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Name or ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden min-h-[400px]">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-96 gap-3">
                        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                        <p className="text-slate-400 font-medium">Generating summary report...</p>
                    </div>
                ) : !reportData || reportData.dates.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-96 text-center px-4">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
                            <CalendarIcon size={32} />
                        </div>
                        <h3 className="text-slate-800 font-bold text-lg mb-1">No Data Found</h3>
                        <p className="text-slate-400 text-sm max-w-xs">No attendance records found for the selected month.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="sticky left-0 bg-slate-50 px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest border-r border-slate-100 z-10">Name / ID</th>
                                    {reportData.dates.map(d => (
                                        <th key={d} className="px-3 py-4 text-center min-w-[50px]">
                                            <div className="text-[10px] font-black text-indigo-600 uppercase tracking-tighter">
                                                {new Date(d).getDate()}
                                            </div>
                                            <div className="text-[8px] font-bold text-slate-400 uppercase">
                                                {new Date(d).toLocaleDateString(undefined, { weekday: 'short' }).charAt(0)}
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredStaff.map((s) => (
                                    <tr key={s._id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="sticky left-0 bg-white px-6 py-3 border-r border-slate-100 shadow-[2px_0_5px_rgba(0,0,0,0.02)] z-10">
                                            <div className="text-sm font-bold text-slate-700 whitespace-nowrap">{s.name}</div>
                                            <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{s.employeeId}</div>
                                        </td>
                                        {reportData.dates.map(date => {
                                            const status = s.attendance[date];
                                            return (
                                                <td key={date} className="px-2 py-3">
                                                    <div className="flex justify-center">
                                                        {status === 'Present' && <CheckCircle size={14} className="text-emerald-500" />}
                                                        {status === 'Absent' && <XCircle size={14} className="text-rose-500" />}
                                                        {status === 'Late' && <Clock size={14} className="text-amber-500" />}
                                                        {status === 'Half Day' && <Clock size={14} className="text-blue-500" />}
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
