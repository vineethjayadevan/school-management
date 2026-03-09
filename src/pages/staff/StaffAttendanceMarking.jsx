import { useState, useEffect } from 'react';
import { storageService } from '../../services/storage';
import api from '../../services/api';
import { useToast } from '../../components/ui/Toast';
import {
    CheckCircle,
    XCircle,
    Clock,
    Save,
    Calendar as CalendarIcon,
    Users,
    Loader2,
    Search,
    User,
    ChevronRight,
    Briefcase,
    Send
} from 'lucide-react';
import clsx from 'clsx';

export default function StaffAttendanceMarking() {
    const { addToast } = useToast();
    const [staffList, setStaffList] = useState([]);
    const [date, setDate] = useState(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    });
    const [attendance, setAttendance] = useState({}); // { staffId: { status, remarks } }
    const [loading, setLoading] = useState(true);
    const [marking, setMarking] = useState(false);
    const [isNotifying, setIsNotifying] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [categories, setCategories] = useState(['All']);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const { data } = await api.get('/staff-categories');
                const catNames = data.map(c => c.name);
                setCategories(['All', ...catNames]);
            } catch (error) {
                console.error("Failed to fetch categories", error);
            }
        };

        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch all staff members
                const staffData = await storageService.staff.getAll();
                setStaffList(staffData);

                // Fetch attendance for the selected date
                const dayAttendance = await storageService.staffAttendance.getDay(date);

                // Map existing attendance to state
                const attendanceMap = {};
                dayAttendance.forEach(record => {
                    attendanceMap[record.staff] = {
                        status: record.status,
                        remarks: record.remarks || ''
                    };
                });
                setAttendance(attendanceMap);
            } catch (error) {
                console.error("Failed to fetch staff data", error);
                addToast("Failed to load staff list", "error");
            } finally {
                setLoading(false);
            }
        };

        fetchCategories();
        fetchData();
    }, [date]);

    const handleStatusChange = (staffId, status) => {
        setAttendance(prev => ({
            ...prev,
            [staffId]: {
                ...prev[staffId],
                status
            }
        }));
    };

    const handleRemarksChange = (staffId, remarks) => {
        setAttendance(prev => ({
            ...prev,
            [staffId]: {
                ...prev[staffId],
                remarks
            }
        }));
    };

    const markAll = (status) => {
        const newAttendance = { ...attendance };
        filteredStaff.forEach(staff => {
            newAttendance[staff.id] = {
                ...newAttendance[staff.id],
                status
            };
        });
        setAttendance(newAttendance);
        addToast(`Marked all as ${status}`, "info");
    };

    const handleSave = async () => {
        setMarking(true);
        try {
            const attendanceData = Object.entries(attendance).map(([staffId, data]) => ({
                staffId,
                status: data.status,
                remarks: data.remarks
            }));

            if (attendanceData.length === 0) {
                addToast("No attendance data to save", "warning");
                return;
            }

            await storageService.staffAttendance.mark({
                date,
                attendanceData
            });

            addToast("Staff attendance saved successfully", "success");
        } catch (error) {
            console.error("Failed to save staff attendance", error);
            addToast("Failed to save attendance", "error");
        } finally {
            setMarking(false);
        }
    };

    const handleNotify = async () => {
        setIsNotifying(true);
        try {
            const response = await storageService.staffAttendance.notifyAbsentees(date);
            addToast(response.message || "Notifications sent successfully", "success");
        } catch (error) {
            console.error("Failed to send notifications", error);
            addToast(error.response?.data?.message || "Failed to send notifications", "error");
        } finally {
            setIsNotifying(false);
        }
    };

    const filteredStaff = staffList.filter(staff => {
        const matchesSearch = staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            staff.employeeId?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter === 'All' || staff.category === categoryFilter;
        return matchesSearch && matchesCategory;
    });

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
                    <h1 className="text-2xl font-bold text-slate-800">Staff Attendance</h1>
                    <p className="text-slate-500 text-sm">Mark daily attendance for all school employees</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <CalendarIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            max={new Date().toISOString().split('T')[0]}
                            className="pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleNotify}
                            disabled={isNotifying}
                            className="flex items-center gap-2 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 px-6 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                            title="Send SMS/WhatsApp/Email to Absent/Late staff"
                        >
                            {isNotifying ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                            <span className="hidden sm:inline">Notify</span>
                        </button>

                        <button
                            onClick={handleSave}
                            disabled={marking}
                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md shadow-indigo-100 disabled:opacity-50"
                        >
                            {marking ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            <span className="hidden sm:inline">Save</span> Attendance
                        </button>
                    </div>
                </div>
            </div>

            {/* Quick Actions & Filters */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-8 space-y-4">
                    <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                        <div className="relative flex-1 w-full">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search staff name or ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                        <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100 w-full md:w-auto overflow-x-auto">
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setCategoryFilter(cat)}
                                    className={clsx(
                                        "px-4 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all",
                                        categoryFilter === cat ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                                    )}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-100">
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Employee</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Category</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Status</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Remarks</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredStaff.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" className="px-6 py-12 text-center">
                                                <div className="flex flex-col items-center justify-center gap-2">
                                                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                                                        <Search size={24} />
                                                    </div>
                                                    <p className="text-slate-400 font-medium">No staff members found</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredStaff.map((staff) => (
                                            <tr key={staff.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                                            <User size={18} />
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-bold text-slate-700">{staff.name}</div>
                                                            <div className="text-[10px] font-medium text-slate-400">{staff.employeeId || 'ID Pending'}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-bold">
                                                        {staff.category}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        {[
                                                            { id: 'Present', icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-200' },
                                                            { id: 'Absent', icon: XCircle, color: 'text-rose-500', bg: 'bg-rose-50', border: 'border-rose-200' },
                                                            { id: 'Late', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-200' },
                                                            { id: 'Half Day', icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-200' }
                                                        ].map((btn) => (
                                                            <button
                                                                key={btn.id}
                                                                onClick={() => handleStatusChange(staff.id, btn.id)}
                                                                title={btn.id}
                                                                className={clsx(
                                                                    "p-2 rounded-xl border transition-all hover:scale-110",
                                                                    attendance[staff.id]?.status === btn.id
                                                                        ? `${btn.bg} ${btn.color} ${btn.border} shadow-sm`
                                                                        : "bg-white text-slate-300 border-slate-100 hover:border-slate-200"
                                                                )}
                                                            >
                                                                <btn.icon size={18} />
                                                            </button>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <input
                                                        type="text"
                                                        placeholder="Add note..."
                                                        value={attendance[staff.id]?.remarks || ''}
                                                        onChange={(e) => handleRemarksChange(staff.id, e.target.value)}
                                                        className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                                                    />
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Briefcase size={16} className="text-indigo-500" />
                            Bulk Actions
                        </h3>
                        <div className="space-y-2">
                            <button
                                onClick={() => markAll('Present')}
                                className="w-full flex items-center justify-between p-3 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm text-emerald-500">
                                        <CheckCircle size={18} />
                                    </div>
                                    <span className="text-xs font-bold uppercase tracking-wider">Mark All Present</span>
                                </div>
                                <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                            </button>

                            <button
                                onClick={() => markAll('Absent')}
                                className="w-full flex items-center justify-between p-3 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm text-rose-500">
                                        <XCircle size={18} />
                                    </div>
                                    <span className="text-xs font-bold uppercase tracking-wider">Mark All Absent</span>
                                </div>
                                <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>

                    <div className="bg-indigo-600 p-6 rounded-2xl shadow-lg shadow-indigo-100 text-white relative overflow-hidden group">
                        <div className="absolute -right-4 -bottom-4 opacity-10 rotate-12 transition-transform group-hover:scale-110">
                            <Briefcase size={120} />
                        </div>
                        <h3 className="text-lg font-bold mb-1">Attendance Policy</h3>
                        <p className="text-indigo-100 text-xs mb-4">Please ensure all staff attendance is marked before 10:00 AM daily.</p>
                        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-wider bg-white/10 p-2 rounded-lg">
                            <Clock size={14} />
                            Reporting Deadline: 11:30 AM
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
