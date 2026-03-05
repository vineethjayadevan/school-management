import { useState, useEffect } from 'react';
import { storageService } from '../../services/storage';
import { useToast } from '../../components/ui/Toast';
import {
    Calendar as CalendarIcon,
    CheckCircle,
    XCircle,
    Clock,
    Search,
    Loader2,
    Filter,
    ArrowLeftRight,
    ClipboardList
} from 'lucide-react';
import clsx from 'clsx';

export default function MyAttendance() {
    const { addToast } = useToast();
    const [attendanceRecords, setAttendanceRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState(() => {
        const now = new Date();
        return {
            month: now.getMonth() + 1,
            year: now.getFullYear()
        };
    });

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

    useEffect(() => {
        fetchAttendance();
    }, [filter]);

    const fetchAttendance = async () => {
        setLoading(true);
        try {
            const data = await storageService.staffAttendance.getMyAttendance(filter);
            setAttendanceRecords(data);
        } catch (error) {
            console.error("Failed to fetch personal attendance", error);
            addToast("Failed to load attendance records", "error");
        } finally {
            setLoading(false);
        }
    };

    const stats = attendanceRecords.reduce((acc, record) => {
        acc[record.status] = (acc[record.status] || 0) + 1;
        acc.total += 1;
        return acc;
    }, { total: 0 });

    const getStatusColor = (status) => {
        switch (status) {
            case 'Present': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'Absent': return 'bg-rose-50 text-rose-600 border-rose-100';
            case 'Late': return 'bg-amber-50 text-amber-600 border-amber-100';
            case 'Half Day': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
            default: return 'bg-slate-50 text-slate-600 border-slate-100';
        }
    };

    return (
        <div className="space-y-8 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">My Attendance</h1>
                    <p className="text-slate-500 text-sm font-medium mt-1 flex items-center gap-2">
                        <ClipboardList size={16} className="text-indigo-500" />
                        View your personal attendance history and monthly summary
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
                        <select
                            value={filter.month}
                            onChange={(e) => setFilter(prev => ({ ...prev, month: parseInt(e.target.value) }))}
                            className="bg-transparent text-sm font-bold text-slate-700 px-3 py-1.5 outline-none cursor-pointer border-r border-slate-100"
                        >
                            {months.map((m, i) => (
                                <option key={m} value={i + 1}>{m}</option>
                            ))}
                        </select>
                        <select
                            value={filter.year}
                            onChange={(e) => setFilter(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                            className="bg-transparent text-sm font-bold text-slate-700 px-3 py-1.5 outline-none cursor-pointer"
                        >
                            {years.map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Attendance Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4">
                        <Filter size={24} />
                    </div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Days</p>
                    <h3 className="text-2xl font-black text-slate-800">{stats.total}</h3>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center text-center border-b-4 border-b-emerald-400">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4">
                        <CheckCircle size={24} />
                    </div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Present</p>
                    <h3 className="text-2xl font-black text-slate-800">{stats.Present || 0}</h3>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center text-center border-b-4 border-b-rose-400">
                    <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mb-4">
                        <XCircle size={24} />
                    </div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Absent</p>
                    <h3 className="text-2xl font-black text-slate-800">{stats.Absent || 0}</h3>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center text-center border-b-4 border-b-amber-400">
                    <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-4">
                        <Clock size={24} />
                    </div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Late/Half</p>
                    <h3 className="text-2xl font-black text-slate-800">{(stats.Late || 0) + (stats['Half Day'] || 0)}</h3>
                </div>
            </div>

            {/* Attendance List */}
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-800">Attendance Log</h2>
                    <div className="text-xs font-bold text-slate-400 uppercase">
                        For {months[filter.month - 1]} {filter.year}
                    </div>
                </div>

                {loading ? (
                    <div className="py-20 flex flex-col items-center justify-center gap-4 text-slate-400">
                        <Loader2 size={32} className="animate-spin text-indigo-500" />
                        <p className="text-sm font-medium">Fetching your records...</p>
                    </div>
                ) : attendanceRecords.length === 0 ? (
                    <div className="py-20 flex flex-col items-center justify-center text-center px-6">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                            <CalendarIcon size={32} className="text-slate-200" />
                        </div>
                        <h3 className="text-slate-800 font-bold text-lg mb-1">No Records Found</h3>
                        <p className="text-slate-400 text-sm max-w-sm">We couldn't find any attendance logs for the selected month and year.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/50">
                                <tr>
                                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Day</th>
                                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Remarks</th>
                                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Marked By</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {attendanceRecords.map((record) => {
                                    const d = new Date(record.date);
                                    return (
                                        <tr key={record._id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-8 py-5">
                                                <span className="text-sm font-bold text-slate-700">
                                                    {d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className="text-xs font-bold text-slate-400 uppercase tracking-tight">
                                                    {d.toLocaleDateString('en-IN', { weekday: 'long' })}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className={clsx(
                                                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border whitespace-nowrap",
                                                    getStatusColor(record.status)
                                                )}>
                                                    {record.status}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5">
                                                <p className="text-sm text-slate-600 italic">
                                                    {record.remarks || <span className="text-slate-300">—</span>}
                                                </p>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Admin</span>
                                                    <span className="text-xs font-black text-slate-700">{record.markedBy?.name || 'System'}</span>
                                                </div>
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
    );
}
