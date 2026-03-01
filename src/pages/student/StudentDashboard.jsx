import { useState, useEffect } from 'react';
import {
    Calendar,
    Clock,
    BookOpen,
    Banknote,
    ChevronRight,
    Sparkles,
    ArrowUpRight,
    TrendingUp,
    Layout,
    User
} from 'lucide-react';
import { storageService } from '../../services/storage';
import { authService } from '../../services/auth';
import { NavLink } from 'react-router-dom';
import clsx from 'clsx';

export default function StudentDashboard() {
    const [schedule, setSchedule] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [feeData, setFeeData] = useState({ status: 'Loading...', history: [] });
    const [loading, setLoading] = useState(true);
    const user = authService.getCurrentUser();

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [scheduleData, assignmentsData, feeData] = await Promise.all([
                    storageService.student.getSchedule(),
                    storageService.student.getAssignments(),
                    storageService.student.getFees()
                ]);
                setSchedule(scheduleData);
                setAssignments(assignmentsData);
                setFeeData(feeData);
            } catch (error) {
                console.error("Failed to fetch student dashboard data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const getTimeOfDay = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <p className="text-slate-500 font-medium animate-pulse">Personalizing your experience...</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-10 pb-12">

            {/* Premium Hero Section */}
            <section className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 p-8 md:p-12 shadow-2xl">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px] -mr-32 -mt-32"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] -ml-20 -mb-20"></div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/10">
                            <Sparkles size={14} className="text-indigo-300" />
                            <span className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest">{getTimeOfDay()}</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
                            Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-emerald-300">{user?.name?.split(' ')[0]}!</span>
                        </h1>
                        <p className="text-slate-400 text-lg max-w-md font-medium">
                            You have <span className="text-white font-bold">{assignments.length} assignments</span> pending and your next class starts soon.
                        </p>
                        <div className="flex flex-wrap gap-4 pt-2">
                            <NavLink to="/student/profile" className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-sm transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2">
                                View Full Profile
                                <ChevronRight size={18} />
                            </NavLink>
                            <button className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold text-sm transition-all border border-white/10 backdrop-blur-sm">
                                Academic Calendar
                            </button>
                        </div>
                    </div>

                    <div className="hidden lg:block relative group">
                        <div className="w-52 h-52 rounded-[2.5rem] overflow-hidden border-4 border-white/10 shadow-2xl rotate-3 bg-slate-900/40 backdrop-blur-xl flex flex-col items-center justify-center p-4 transition-all duration-500 hover:rotate-0 hover:scale-105">
                            <div className="relative w-32 h-32 flex items-center justify-center">
                                {/* Academic Progress Ring */}
                                <svg className="w-full h-full -rotate-90 filter drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]">
                                    <circle cx="64" cy="64" r="58" className="fill-none stroke-white/5 stroke-[8]" />
                                    <circle
                                        cx="64" cy="64" r="58"
                                        className="fill-none stroke-indigo-500 stroke-[8]"
                                        strokeDasharray="364.4"
                                        strokeDashoffset={364.4 * (1 - 0.942)}
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <div className="absolute inset-2.5 flex items-center justify-center rounded-full overflow-hidden border-4 border-slate-900 bg-slate-800 shadow-inner group-hover:scale-110 transition-transform duration-500">
                                    {user?.avatar ? (
                                        <img
                                            src={user.avatar}
                                            alt="Profile"
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = '';
                                                e.target.classList.add('hidden');
                                                e.target.nextSibling.classList.remove('hidden');
                                            }}
                                        />
                                    ) : null}
                                    <div className={clsx(
                                        "w-full h-full flex items-center justify-center font-black text-4xl text-white",
                                        user?.gender === 'Female' ? 'bg-pink-500' : 'bg-indigo-500',
                                        user?.avatar ? 'hidden' : ''
                                    )}>
                                        {user?.name?.charAt(0)}
                                    </div>
                                </div>
                            </div>
                            {/* Excellence Badge */}
                            <div className="mt-4 bg-emerald-500/20 border border-emerald-500/30 px-4 py-1.5 rounded-2xl flex items-center gap-2 shadow-lg shadow-emerald-500/10 animate-bounce-slow">
                                <Sparkles size={14} className="text-emerald-400" />
                                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">Star Student</span>
                            </div>
                        </div>
                        {/* Attendance Overlay Card */}
                        <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl p-4 shadow-2xl -rotate-6 flex items-center gap-4 border border-slate-100 group-hover:rotate-0 transition-all duration-500 z-10">
                            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center shadow-inner">
                                <TrendingUp className="text-indigo-600" size={24} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Term Attendance</p>
                                <div className="flex items-baseline gap-1">
                                    <p className="text-lg font-black text-slate-900 leading-none">94.2%</p>
                                    <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wide">Excellent</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Quick Insights Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Fee Status Card */}
                <div className={clsx(
                    "group relative overflow-hidden rounded-3xl p-8 transition-all duration-300 hover:-translate-y-1 shadow-xl",
                    feeData.status === 'Paid'
                        ? "bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-emerald-200/50"
                        : "bg-gradient-to-br from-rose-500 to-rose-600 shadow-rose-200/50"
                )}>
                    <div className="absolute top-0 right-0 p-4 opacity-20 transition-transform group-hover:scale-110">
                        <Banknote size={80} />
                    </div>
                    <div className="relative z-10 space-y-6">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                            <Banknote size={24} className="text-white" />
                        </div>
                        <div>
                            <p className="text-white/70 text-xs font-bold uppercase tracking-widest mb-1">Fee Clearance Status</p>
                            <h3 className="text-3xl font-black text-white">{feeData.status || 'Pending'}</h3>
                        </div>
                        <NavLink to="/student/fees" className="inline-flex items-center gap-2 text-xs font-bold text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl transition-all border border-white/20">
                            Transaction History
                            <ArrowUpRight size={14} />
                        </NavLink>
                    </div>
                </div>

                <div className="group relative overflow-hidden rounded-3xl p-8 bg-white border border-slate-200/60 shadow-xl shadow-slate-200/40 transition-all duration-300 hover:-translate-y-1">
                    <div className="absolute top-0 right-0 p-4 text-indigo-500/5 transition-transform group-hover:scale-110">
                        <BookOpen size={80} />
                    </div>
                    <div className="relative z-10 space-y-6">
                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center">
                            <BookOpen size={24} className="text-indigo-600" />
                        </div>
                        <div>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Pending Assignments</p>
                            <h3 className="text-3xl font-black text-slate-900">{assignments.length}</h3>
                        </div>
                        <NavLink to="/student/assignments" className="inline-flex items-center gap-2 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-xl transition-all">
                            View All Tasks
                            <ChevronRight size={14} />
                        </NavLink>
                    </div>
                </div>

                <div className="group relative overflow-hidden rounded-3xl p-8 bg-white border border-slate-200/60 shadow-xl shadow-slate-200/40 transition-all duration-300 hover:-translate-y-1">
                    <div className="absolute top-0 right-0 p-4 text-violet-500/5 transition-transform group-hover:scale-110">
                        <Clock size={80} />
                    </div>
                    <div className="relative z-10 space-y-6">
                        <div className="w-12 h-12 bg-violet-50 rounded-2xl flex items-center justify-center">
                            <Clock size={24} className="text-violet-600" />
                        </div>
                        <div>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Scheduled for Today</p>
                            <h3 className="text-3xl font-black text-slate-900">{schedule.length} <span className="text-sm font-bold text-slate-400">Classes</span></h3>
                        </div>
                        <NavLink to="/student/schedule" className="inline-flex items-center gap-2 text-xs font-bold text-violet-600 bg-violet-50 hover:bg-violet-100 px-4 py-2 rounded-xl transition-all">
                            Full Timetable
                            <Calendar size={14} />
                        </NavLink>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Timeline-style Schedule */}
                <div className="lg:col-span-7 bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-200/60 overflow-hidden">
                    <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center">
                                <Calendar size={20} className="text-indigo-600" />
                            </div>
                            <div>
                                <h2 className="font-bold text-slate-900 text-lg tracking-tight">Daily Schedule</h2>
                                <p className="text-xs text-slate-500 font-medium">Your classes for today</p>
                            </div>
                        </div>
                        <button className="text-xs font-bold text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-all">
                            Detailed View
                        </button>
                    </div>

                    <div className="p-8">
                        {schedule.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
                                <div className="p-4 bg-slate-50 rounded-full">
                                    <Layout size={32} className="text-slate-300" />
                                </div>
                                <p className="text-slate-400 font-medium">No classes scheduled for today.</p>
                            </div>
                        ) : (
                            <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-indigo-100 before:via-violet-100 before:to-transparent">
                                {schedule.map((session, index) => (
                                    <div key={index} className="relative flex items-center justify-between group">
                                        <div className="flex items-center w-full">
                                            {/* Timeline marker */}
                                            <div className="absolute left-5 w-3 h-3 -translate-x-1/2 rounded-full border-4 border-white bg-indigo-500 shadow-sm transition-transform group-hover:scale-150 z-10"></div>

                                            <div className="ml-12 flex flex-col sm:flex-row sm:items-center justify-between w-full p-4 rounded-2xl bg-white border border-slate-100 hover:border-indigo-100 hover:shadow-lg hover:shadow-indigo-500/5 transition-all cursor-default">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-black text-indigo-600 uppercase tracking-tighter">{session.periods.startTime}</span>
                                                        <h4 className="font-bold text-slate-900">{session.periods.subject}</h4>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3 mt-2 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-0 border-slate-50">
                                                    <div className="text-right hidden sm:block">
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Instructor</p>
                                                        <p className="text-sm font-bold text-slate-700">{session.periods.teacher?.name || 'Academic Staff'}</p>
                                                    </div>
                                                    <img
                                                        src={`https://ui-avatars.com/api/?name=${session.periods.teacher?.name || 'T'}&background=f8fafc&color=6366f1&bold=true`}
                                                        className="w-8 h-8 rounded-lg border border-slate-200"
                                                        alt="Teacher"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Assignments Column */}
                <div className="lg:col-span-5 bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-200/60 overflow-hidden">
                    <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center">
                                <BookOpen size={20} className="text-violet-600" />
                            </div>
                            <div>
                                <h2 className="font-bold text-slate-900 text-lg tracking-tight">Recent Tasks</h2>
                                <p className="text-xs text-slate-500 font-medium">Keep up with your studies</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 space-y-4">
                        {assignments.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-slate-400 font-medium">Zero tasks pending. Great work!</p>
                            </div>
                        ) : (
                            assignments.slice(0, 4).map((assignment) => (
                                <div key={assignment._id} className="p-5 rounded-2xl border border-slate-100 hover:border-violet-100 hover:bg-violet-50/30 transition-all group">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-black text-violet-600 uppercase tracking-[0.2em]">{assignment.subject}</span>
                                            <h4 className="font-bold text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors">{assignment.title}</h4>
                                        </div>
                                        <div className={clsx(
                                            "flex flex-col items-end px-3 py-1.5 rounded-xl border",
                                            new Date(assignment.dueDate) < new Date() ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-slate-200'
                                        )}>
                                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-0.5">Due Date</span>
                                            <span className={clsx(
                                                "text-xs font-black",
                                                new Date(assignment.dueDate) < new Date() ? 'text-rose-600' : 'text-slate-700'
                                            )}>
                                                {new Date(assignment.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed font-medium mb-4">{assignment.description}</p>
                                    <button className="w-full py-2 bg-slate-50 group-hover:bg-indigo-600 group-hover:text-white text-slate-600 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all">
                                        Open Assignment Detail
                                    </button>
                                </div>
                            ))
                        )}

                        {assignments.length > 4 && (
                            <NavLink to="/student/assignments" className="block text-center py-4 text-xs font-bold text-indigo-600 hover:underline uppercase tracking-widest">
                                View {assignments.length - 4} More Assignments
                            </NavLink>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
