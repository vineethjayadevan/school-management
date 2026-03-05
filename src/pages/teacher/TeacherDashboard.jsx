import { useState, useEffect } from 'react';
import {
    Calendar, Clock, CheckSquare, Plus, BookOpen, Users,
    DollarSign, ArrowRight, Star, TrendingUp, CalendarDays, Award
} from 'lucide-react';
import { storageService } from '../../services/storage';
import { useNavigate } from 'react-router-dom';

function StatCard({ icon: Icon, label, value, color, delay }) {
    return (
        <div className={`bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-all duration-300 group`}>
            <div className="flex items-center gap-4">
                <div className={`p-4 ${color.bg} ${color.text} rounded-2xl group-hover:scale-110 transition-transform duration-300`}>
                    <Icon size={24} />
                </div>
                <div>
                    <p className="text-slate-500 text-sm font-medium">{label}</p>
                    <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
                </div>
            </div>
        </div>
    );
}

export default function TeacherDashboard() {
    const navigate = useNavigate();
    const [stats, setStats] = useState({ totalClasses: 0, totalStudents: 0 });
    const [myClasses, setMyClasses] = useState([]);
    const [schedule, setSchedule] = useState([]);
    const [salaryHistory, setSalaryHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [statsData, classesData, scheduleData, salaryData] = await Promise.all([
                    storageService.teacher.getStats(),
                    storageService.teacher.getClasses(),
                    storageService.teacher.getSchedule(),
                    storageService.teacher.getSalaryHistory()
                ]);

                setStats(statsData);
                setMyClasses(classesData);
                setSchedule(scheduleData);
                setSalaryHistory(salaryData.slice(0, 3));
            } catch (error) {
                console.error("Failed to fetch dashboard data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

    return (
        <div className="space-y-8 pb-10">
            {/* Header / Welcome */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Teacher Portal</h1>
                    <div className="flex items-center gap-2 mt-1 text-slate-500">
                        <CalendarDays size={16} className="text-indigo-500" />
                        <span className="text-sm font-medium">{today}</span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/teacher/profile')}
                        className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-semibold text-sm hover:bg-slate-50 transition-colors flex items-center gap-2"
                    >
                        <User size={16} /> My Profile
                    </button>
                    <button
                        className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 shadow-md shadow-indigo-100 transition-all flex items-center gap-2"
                    >
                        <Plus size={16} /> Quick Action
                    </button>
                </div>
            </div>

            {/* Top Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    icon={BookOpen}
                    label="Active Classes"
                    value={stats.totalClasses}
                    color={{ bg: 'bg-indigo-50', text: 'text-indigo-600' }}
                />
                <StatCard
                    icon={Users}
                    label="Total Students"
                    value={stats.totalStudents}
                    color={{ bg: 'bg-emerald-50', text: 'text-emerald-600' }}
                />
                <StatCard
                    icon={TrendingUp}
                    label="Upcoming Tasks"
                    value="4"
                    color={{ bg: 'bg-purple-50', text: 'text-purple-600' }}
                />
                <StatCard
                    icon={Award}
                    label="Performance"
                    value="Good"
                    color={{ bg: 'bg-amber-50', text: 'text-amber-600' }}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content Areas */}
                <div className="lg:col-span-2 space-y-8">
                    {/* My Classes Section - Visual Cards */}
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <Star size={20} className="text-amber-500 fill-amber-500" />
                                My Assigned Classes
                            </h2>
                            <button className="text-indigo-600 text-sm font-bold hover:underline">View All</button>
                        </div>

                        {myClasses.length === 0 ? (
                            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center">
                                <p className="text-slate-400 font-medium">No classes assigned yet.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {myClasses.map((cls, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => navigate(`/teacher/classes/${cls.name}/${cls.section}`)}
                                        className="relative group bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden"
                                    >
                                        <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-10 ${cls.role === 'Class Teacher' ? 'bg-indigo-600' : 'bg-emerald-600'}`} />
                                        <div className="flex flex-col h-full">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider mb-2 inline-block ${cls.role === 'Class Teacher' ? 'bg-indigo-50 text-indigo-700' : 'bg-emerald-50 text-emerald-700'}`}>
                                                        {cls.role}
                                                    </span>
                                                    <h3 className="text-xl font-bold text-slate-800">Class {cls.name}</h3>
                                                    <p className="text-slate-500 font-medium">Section {cls.section}</p>
                                                </div>
                                                <div className="p-2 bg-slate-50 rounded-xl group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                                    <ArrowRight size={20} />
                                                </div>
                                            </div>
                                            <div className="mt-auto pt-4 border-t border-slate-50 flex items-center gap-4 text-xs font-semibold text-slate-400">
                                                <span className="flex items-center gap-1"><Users size={14} /> Records</span>
                                                <span className="flex items-center gap-1"><Clock size={14} /> Attendance</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* Today's Schedule - Timeline Style */}
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <Clock size={20} className="text-indigo-500" />
                                Today's Schedule
                            </h2>
                        </div>
                        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden p-6">
                            {schedule.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Calendar size={24} className="text-slate-300" />
                                    </div>
                                    <p className="text-slate-400 font-medium italic">Your schedule is clear for today!</p>
                                </div>
                            ) : (
                                <div className="space-y-6 relative ml-4">
                                    <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-slate-100 -ml-4" />
                                    {schedule.map((session, index) => (
                                        <div key={index} className="relative pl-6">
                                            <div className="absolute left-0 top-1.5 w-3 h-3 rounded-full bg-indigo-500 -ml-[21.5px] border-2 border-white shadow-sm" />
                                            <div className="flex flex-col md:flex-row md:items-center gap-3 p-4 bg-slate-50/50 rounded-2xl hover:bg-indigo-50/30 transition-colors group">
                                                <div className="min-w-[100px]">
                                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Time</span>
                                                    <span className="text-sm font-bold text-slate-700">{session.periods.startTime}</span>
                                                </div>
                                                <div className="flex-grow">
                                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">Subject</span>
                                                    <span className="text-base font-bold text-indigo-700">{session.periods.subject}</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="inline-block px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600">
                                                        {session.className} - {session.section}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>
                </div>

                {/* Sidebar Areas */}
                <div className="space-y-8">
                    {/* Class Stats Breakdown */}
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
                        <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <Users size={18} className="text-emerald-500" /> Status by Class
                        </h3>
                        <div className="space-y-5">
                            {stats.classBreakdown?.map((item, idx) => (
                                <div key={idx} className="group cursor-default">
                                    <div className="flex justify-between items-center mb-1.5">
                                        <span className="text-sm font-bold text-slate-700">Class {item.className}-{item.sectionName}</span>
                                        <span className="text-xs font-extrabold text-slate-400 uppercase">{item.studentCount} Students</span>
                                    </div>
                                    <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-500"
                                            style={{ width: `${Math.min(100, (item.studentCount / 50) * 100)}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Access Grid */}
                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-6 text-white shadow-xl shadow-slate-200">
                        <h3 className="font-bold mb-4 flex items-center gap-2">
                            <Plus size={18} className="text-indigo-400" /> Fast Access
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => navigate('/teacher/attendance')}
                                className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl flex flex-col items-center gap-2 transition-all border border-white/5"
                            >
                                <CheckSquare size={20} className="text-emerald-400" />
                                <span className="text-[10px] font-bold uppercase tracking-tight">Attendance</span>
                            </button>
                            <button
                                onClick={() => navigate('/teacher/schedule')}
                                className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl flex flex-col items-center gap-2 transition-all border border-white/5"
                            >
                                <Clock size={20} className="text-indigo-400" />
                                <span className="text-[10px] font-bold uppercase tracking-tight">Schedule</span>
                            </button>
                            <button
                                onClick={() => navigate('/teacher/profile')}
                                className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl flex flex-col items-center gap-2 transition-all border border-white/5"
                            >
                                <User size={20} className="text-amber-400" />
                                <span className="text-[10px] font-bold uppercase tracking-tight">Profile</span>
                            </button>
                            <button
                                className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl flex flex-col items-center gap-2 transition-all border border-white/5"
                            >
                                <DollarSign size={20} className="text-rose-400" />
                                <span className="text-[10px] font-bold uppercase tracking-tight">Payments</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function User({ size, className }) {
    return <Users size={size} className={className} />;
}
