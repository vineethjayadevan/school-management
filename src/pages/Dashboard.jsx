import { useState, useEffect } from 'react';
import { Users, Banknote, GraduationCap, ArrowUpRight, ArrowDownRight, MoreVertical } from 'lucide-react';
import { useToast } from '../components/ui/Toast';
import { storageService } from '../services/storage';

const StatCard = ({ title, value, change, changeType, icon: Icon, color, onAction }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-slate-500">{title}</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">{value}</h3>
            </div>
            <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${color}`}>
                    <Icon size={24} className="text-white" />
                </div>
                <button onClick={onAction} className="text-slate-400 hover:text-slate-600">
                    <MoreVertical size={20} />
                </button>
            </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1 ${changeType === 'increase' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                {changeType === 'increase' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {change}
            </span>
            <span className="text-xs text-slate-400">vs last month</span>
        </div>
    </div>
);

import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [stats, setStats] = useState({
        students: 0,
        staff: 0,
        revenue: 0,
        recentFees: []
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await storageService.dashboard.getStats();
                setStats({
                    students: data.students,
                    staff: data.staff,
                    revenue: data.revenue,
                    recentFees: data.recentFees,
                    recentStudents: data.recentStudents || []
                });
            } catch (error) {
                console.error("Failed to load dashboard stats", error);
            }
        };

        fetchStats();
    }, []);

    const showNotice = () => {
        addToast("Detailed report coming soon!", "info");
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
                <p className="text-slate-500">Welcome back, here's what's happening today.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard
                    title="Total Students"
                    value={stats.students.toString()}
                    change="12%"
                    changeType="increase"
                    icon={Users}
                    color="bg-indigo-500"
                    onAction={showNotice}
                />
                <StatCard
                    title="Total Revenue"
                    value={`₹${stats.revenue.toLocaleString()}`}
                    change="8%"
                    changeType="increase"
                    icon={Banknote}
                    color="bg-emerald-500"
                    onAction={showNotice}
                />
                <StatCard
                    title="Total Staff"
                    value={stats.staff.toString()}
                    change="2%"
                    changeType="decrease"
                    icon={GraduationCap}
                    color="bg-violet-500"
                    onAction={showNotice}
                />
            </div>

            {/* Recent Activity Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Admissions */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-fit min-h-64">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold text-slate-900">Recent Admissions</h3>
                        <button onClick={() => navigate('/admin/students')} className="text-indigo-600 text-sm hover:underline">View All</button>
                    </div>
                    {stats.recentStudents && stats.recentStudents.length > 0 ? (
                        <div className="space-y-4">
                            {stats.recentStudents.map((student) => (
                                <div key={student._id} className="flex items-center justify-between border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-indigo-100 p-2 rounded-full text-indigo-600">
                                            <Users size={16} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-900">{student.name}</p>
                                            <p className="text-xs text-slate-500">
                                                {student.admissionNo ? `#${student.admissionNo}` : 'New'} • {student.className || 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-xs text-slate-400">{new Date(student.createdAt).toLocaleDateString()}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10 border-2 border-dashed border-slate-100 rounded-lg flex flex-col items-center justify-center">
                            <p className="text-slate-400 mb-3">No recent admissions</p>
                            <button
                                onClick={() => navigate('/admin/admissions/new')}
                                className="text-sm bg-indigo-50 text-indigo-600 px-4 py-2 rounded-lg font-medium hover:bg-indigo-100 transition-colors"
                            >
                                Create Admission
                            </button>
                        </div>
                    )}
                </div>

                {/* Recent Fee Collections */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-fit min-h-64">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold text-slate-900">Recent Fee Collections</h3>
                        <button
                            onClick={() => navigate('/admin/fees', { state: { startTab: 'history' } })}
                            className="text-indigo-600 text-sm hover:underline"
                        >
                            View All
                        </button>
                    </div>
                    {stats.recentFees && stats.recentFees.length > 0 ? (
                        <div className="space-y-4">
                            {stats.recentFees.map((fee) => (
                                <div key={fee._id} className="flex items-center justify-between border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-emerald-100 p-2 rounded-full text-emerald-600">
                                            <Banknote size={16} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-900">{fee.student?.name || 'Unknown Student'}</p>
                                            <p className="text-xs text-slate-500">{new Date(fee.paymentDate).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <span className="font-bold text-slate-900">+₹{fee.amount}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-slate-400 py-10 border-2 border-dashed border-slate-100 rounded-lg">
                            No recent transactions
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
