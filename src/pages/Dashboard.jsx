import { useState, useEffect } from 'react';
import {
    Users,
    Banknote,
    GraduationCap,
    ArrowUpRight,
    Activity,
    Clock,
    AlertCircle,
    Calendar,
    Briefcase
} from 'lucide-react';
import { useToast } from '../components/ui/Toast';
import api from '../services/api';
import DashboardChart from '../components/dashboard/DashboardChart';
import { useNavigate } from 'react-router-dom';

const StatCard = ({ title, value, subtext, icon: Icon, color, badgeText }) => (
    <div className="group relative bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden">
        {/* Decorative Gradient Background Blur */}
        <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-5 blur-2xl ${color}`} />

        <div className="flex items-start justify-between relative z-10">
            <div className={`p-3.5 rounded-xl ${color} bg-opacity-10 group-hover:scale-110 transition-transform duration-300`}>
                <Icon size={24} className={color.replace('bg-', 'text-')} />
            </div>
            {badgeText && (
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                    {badgeText}
                </span>
            )}
        </div>

        <div className="mt-5 relative z-10">
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">{value}</h3>
            <p className="text-sm font-semibold text-slate-500 mt-1 uppercase tracking-wide">{title}</p>
            {subtext && (
                <div className="mt-4 pt-4 border-t border-slate-50">
                    <p className="text-xs font-medium text-slate-400 flex items-center gap-1.5 font-medium italic">
                        <Activity size={12} className="text-slate-300" />
                        {subtext}
                    </p>
                </div>
            )}
        </div>
    </div>
);

const QuickAction = ({ title, icon: Icon, color, onClick, description }) => (
    <button
        onClick={onClick}
        className="group flex flex-col items-center justify-center p-6 bg-white border border-slate-100 rounded-2xl hover:bg-slate-50 hover:shadow-lg hover:border-indigo-100 transition-all duration-300"
    >
        <div className={`p-4 rounded-2xl ${color} bg-opacity-10 group-hover:scale-110 transition-transform duration-300 text-${color.replace('bg-', '')}-600`}>
            <Icon size={28} className={color.replace('bg-', 'text-')} />
        </div>
        <span className="mt-4 font-bold text-slate-800 text-sm">{title}</span>
        <span className="mt-1 text-[10px] text-slate-400 font-medium uppercase tracking-tighter">{description}</span>
    </button>
);

export default function Dashboard() {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/dashboard');
                setStats(res.data);
            } catch (error) {
                console.error("Failed to load dashboard stats", error);
                addToast("Failed to load dashboard data", "error");
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen gap-4">
                <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                <p className="text-slate-500 font-medium animate-pulse">Orchestrating Dashboard...</p>
            </div>
        );
    }

    if (!stats) return null;

    const { counts, financials, recentStudents, recentFees, chartData, activeYear } = stats;

    return (
        <div className="space-y-8 max-w-[1600px] mx-auto pb-12">
            {/* Premium Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-50" />
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="px-3 py-1 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-indigo-200">
                            Admin Portal
                        </span>
                        <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-widest rounded-full border border-emerald-100">
                            System Live
                        </span>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                        School <span className="text-indigo-600">Overview</span>
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">
                        Reporting for <span className="text-slate-900 font-bold underline decoration-indigo-200 underline-offset-4">{activeYear || 'Session'}</span> session.
                    </p>
                </div>
                <div className="flex items-center gap-4 relative z-10 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="text-right">
                        <p className="text-xs font-bold text-slate-400 underline decoration-slate-200 uppercase tracking-widest mb-1">Current Date</p>
                        <p className="text-lg font-black text-slate-800 tracking-tight">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400">
                        <Calendar size={24} />
                    </div>
                </div>
            </div>

            {/* Top Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                <StatCard
                    title="Total Strength"
                    value={counts.totalStudents}
                    icon={Users}
                    color="bg-slate-600"
                    subtext="Consolidated Count"
                    badgeText="Global"
                />
                <StatCard
                    title="New Admissions"
                    value={counts.newAdmissions}
                    icon={GraduationCap}
                    color="bg-indigo-600"
                    subtext={`Joined in ${activeYear}`}
                    badgeText="Freshers"
                />
                <StatCard
                    title="Faculty & Staff"
                    value={counts.staff}
                    icon={Briefcase}
                    color="bg-violet-600"
                    subtext="Non-teaching active"
                    badgeText="Human Capital"
                />
                <StatCard
                    title="Fee Inflow"
                    value={`₹${financials.feesCollectedThisMonth.toLocaleString()}`}
                    icon={Banknote}
                    color="bg-emerald-600"
                    subtext="Current Month Receipts"
                    badgeText="Revenue"
                />
                <StatCard
                    title="Payroll"
                    value={`₹${financials.salaryPaidThisMonth.toLocaleString()}`}
                    icon={ArrowUpRight}
                    color="bg-orange-600"
                    subtext={`₹${financials.salaryPendingThisMonth.toLocaleString()} Outstanding`}
                    badgeText="Expenses"
                />
            </div>

            {/* Middle Section: Chart & Action Center */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Financial Health Chart */}
                <div className="xl:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">Financial Performance</h3>
                            <p className="text-sm text-slate-400 font-medium">Monthly revenue trends for the last 6 months</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-indigo-500" />
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Revenue</span>
                        </div>
                    </div>
                    <div className="h-[320px] w-full">
                        <DashboardChart data={chartData} />
                    </div>
                </div>

                {/* Quick Action Center */}
                <div className="flex flex-col gap-6">
                    <h3 className="text-xl font-black text-slate-900 tracking-tight px-2 flex items-center gap-2">
                        <Activity size={20} className="text-indigo-600" />
                        Action Center
                    </h3>
                    <div className="grid grid-cols-2 gap-4 h-full">
                        <QuickAction
                            title="Enrollment"
                            description="New Admission"
                            icon={Users}
                            color="bg-blue-500"
                            onClick={() => navigate('/admin/students')}
                        />
                        <QuickAction
                            title="Fee Receipt"
                            description="Collect Fees"
                            icon={Banknote}
                            color="bg-emerald-500"
                            onClick={() => navigate('/admin/fees')}
                        />
                        <QuickAction
                            title="Staff Portal"
                            description="Manage Staff"
                            icon={Briefcase}
                            color="bg-purple-500"
                            onClick={() => navigate('/admin/staff')}
                        />
                        <QuickAction
                            title="Academic"
                            description="Configurations"
                            icon={GraduationCap}
                            color="bg-orange-500"
                            onClick={() => navigate('/admin/academics')}
                        />
                    </div>
                </div>
            </div>

            {/* Bottom Row: Detailed Lists */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Newer Students */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                        <div>
                            <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase tracking-widest">Recent Enrollments</h3>
                            <p className="text-xs text-slate-400 font-medium mt-0.5">Fresh applications received lately</p>
                        </div>
                        <button onClick={() => navigate('/admin/students')} className="px-4 py-2 bg-white text-indigo-600 text-xs font-bold rounded-xl border border-slate-200 hover:bg-indigo-50 transition-colors shadow-sm">
                            Show Directory
                        </button>
                    </div>
                    <div className="divide-y divide-slate-50">
                        {recentStudents.map((student) => (
                            <div key={student._id} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-black text-lg shadow-sm">
                                        {student.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900 text-sm tracking-tight">{student.name}</p>
                                        <p className="text-xs text-slate-400 font-medium">{student.className} • Reg #{student.admissionNo}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="px-2.5 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-lg uppercase tracking-wider">
                                        {new Date(student.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {recentStudents.length === 0 && (
                            <div className="p-12 text-center">
                                <Users size={48} className="mx-auto text-slate-200 mb-4" />
                                <p className="text-slate-400 font-medium italic">No recent admissions detected</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Newer Transactions */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                        <div>
                            <h3 className="text-lg font-black text-slate-900 tracking-tight uppercase tracking-widest">Recent Transactions</h3>
                            <p className="text-xs text-slate-400 font-medium mt-0.5">Real-time fee collection feed</p>
                        </div>
                        <button onClick={() => navigate('/admin/fees')} className="px-4 py-2 bg-white text-indigo-600 text-xs font-bold rounded-xl border border-slate-200 hover:bg-indigo-50 transition-colors shadow-sm">
                            View Ledger
                        </button>
                    </div>
                    <div className="divide-y divide-slate-50">
                        {recentFees.map((fee) => (
                            <div key={fee._id} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm">
                                        <Banknote size={24} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900 text-sm tracking-tight">{fee.student?.name || 'Academic Record'}</p>
                                        <p className="text-xs text-slate-400 font-medium">Standard Fee Receipt</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-black text-emerald-600 tracking-tight">+₹{fee.amount.toLocaleString()}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{new Date(fee.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>
                        ))}
                        {recentFees.length === 0 && (
                            <div className="p-12 text-center">
                                <Banknote size={48} className="mx-auto text-slate-200 mb-4" />
                                <p className="text-slate-400 font-medium italic">Waiting for transactions...</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
