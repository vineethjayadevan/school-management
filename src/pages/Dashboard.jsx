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
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-lg ${color} bg-opacity-10`}>
                <Icon size={24} className={color.replace('bg-', 'text-')} />
            </div>
            {badgeText && (
                <span className="text-xs font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded-full">
                    {badgeText}
                </span>
            )}
        </div>
        <div>
            <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
            <p className="text-sm font-medium text-slate-500 mt-1">{title}</p>
            {subtext && <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">{subtext}</p>}
        </div>
    </div>
);

const ActivityItem = ({ title, count, icon: Icon, color, onClick }) => (
    <div
        onClick={onClick}
        className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
    >
        <div className="flex items-center gap-4">
            <div className={`p-2 rounded-lg ${color} bg-opacity-10 text-${color.replace('bg-', '')}-600`}>
                <Icon size={20} className={color.replace('bg-', 'text-')} />
            </div>
            <span className="font-medium text-slate-700">{title}</span>
        </div>
        <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900">{count}</span>
            <span className="text-xs text-slate-400">Pending</span>
        </div>
    </div>
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
        return <div className="flex items-center justify-center h-full text-slate-500">Loading Dashboard...</div>;
    }

    if (!stats) return null;

    const { counts, financials, recentStudents, recentFees, chartData } = stats;

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
                    <p className="text-slate-500">Overview of your school's performance today.</p>
                </div>
                <div className="text-right">
                    <p className="text-sm font-medium text-slate-900">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
            </div>

            {/* Top Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <StatCard
                    title="Total Students"
                    value={counts.students}
                    icon={Users}
                    color="bg-indigo-500"
                    subtext={`${counts.admissionsToday} new today`}
                    badgeText="Total"
                />
                <StatCard
                    title="Total Staff"
                    value={counts.staff}
                    icon={Briefcase}
                    color="bg-violet-500"
                    subtext="Active count"
                    badgeText="Total"
                />
                <StatCard
                    title="Fee Collected"
                    value={`₹${financials.feesCollectedThisMonth.toLocaleString()}`}
                    icon={Banknote}
                    color="bg-emerald-500"
                    subtext="This Month"
                    badgeText="This Month"
                />
                <StatCard
                    title="Salary Paid"
                    value={`₹${financials.salaryPaidThisMonth.toLocaleString()}`}
                    icon={GraduationCap}
                    color="bg-amber-500"
                    subtext={`₹${financials.salaryPendingThisMonth.toLocaleString()} Pending`}
                    badgeText="This Month"
                />
            </div>

            {/* Middle Section: Chart & Today's Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Financial Chart */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-slate-900">Financial Overview</h3>
                        <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded">Last 6 Months</span>
                    </div>
                    <div className="h-[300px] w-full">
                        {/* Chart Component Here */}
                        <DashboardChart data={chartData} />
                    </div>
                </div>

                {/* Today's Activity */}
                <div className="space-y-4">
                    <h3 className="font-bold text-slate-900 px-1">Today's Activity</h3>
                    <div className="space-y-3">
                        <ActivityItem
                            title="Admissions Pending"
                            count={counts.admissionsToday} // Using recent count as proxy for pending/new
                            icon={Users}
                            color="bg-blue-500"
                            onClick={() => navigate('/admin/students')}
                        />
                        <ActivityItem
                            title="Fees Overdue"
                            count={counts.feesOverdue}
                            icon={AlertCircle}
                            color="bg-red-500"
                            onClick={() => navigate('/admin/fees')}
                        />
                        <ActivityItem
                            title="Salary Pending"
                            count={counts.pendingSalaries}
                            icon={Clock}
                            color="bg-amber-500"
                            onClick={() => navigate('/admin/finance/salary')}
                        />
                        <ActivityItem
                            title="New Announcements"
                            count={0}
                            icon={Activity}
                            color="bg-purple-500"
                            onClick={() => { }}
                        />
                    </div>
                </div>
            </div>

            {/* Recent Logs Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Admissions */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-slate-900">Recent Admissions</h3>
                        <button onClick={() => navigate('/admin/students')} className="text-indigo-600 text-sm font-medium hover:underline">View All</button>
                    </div>
                    <div className="space-y-4">
                        {recentStudents.map((student) => (
                            <div key={student._id} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs">
                                        {student.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-900">{student.name}</p>
                                        <p className="text-xs text-slate-500">{student.className} • #{student.admissionNo}</p>
                                    </div>
                                </div>
                                <span className="text-xs text-slate-400">{new Date(student.createdAt).toLocaleDateString()}</span>
                            </div>
                        ))}
                        {recentStudents.length === 0 && <p className="text-slate-400 text-sm italic">No recent admissions</p>}
                    </div>
                </div>

                {/* Recent Fees */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-slate-900">Recent Transactions</h3>
                        <button onClick={() => navigate('/admin/fees')} className="text-indigo-600 text-sm font-medium hover:underline">View All</button>
                    </div>
                    <div className="space-y-4">
                        {recentFees.map((fee) => (
                            <div key={fee._id} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                                        <Banknote size={16} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-900">{fee.student?.name || 'Unknown'}</p>
                                        <p className="text-xs text-slate-500">Fee Payment</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-slate-900">+₹{fee.amount.toLocaleString()}</p>
                                    <p className="text-xs text-slate-400">{new Date(fee.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>
                        ))}
                        {recentFees.length === 0 && <p className="text-slate-400 text-sm italic">No recent transactions</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}
