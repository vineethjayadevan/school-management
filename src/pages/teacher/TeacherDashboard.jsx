import { useState, useEffect } from 'react';
import { Calendar, Clock, CheckSquare, Plus, BookOpen, Users, DollarSign } from 'lucide-react';
import { storageService } from '../../services/storage';
import { useNavigate } from 'react-router-dom';

export default function TeacherDashboard() {
    const navigate = useNavigate();
    const [stats, setStats] = useState({ totalClasses: 0, totalStudents: 0 });
    const [myClasses, setMyClasses] = useState([]);
    const [schedule, setSchedule] = useState([]);
    // const [recentAssignments, setRecentAssignments] = useState([]);
    const [salaryHistory, setSalaryHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Parallel fetch for all dashboard data
                const [statsData, classesData, scheduleData, salaryData] = await Promise.all([
                    storageService.teacher.getStats(),
                    storageService.teacher.getClasses(),
                    storageService.teacher.getSchedule(),
                    // storageService.teacher.getAssignments(),
                    storageService.teacher.getSalaryHistory()
                ]);

                setStats(statsData);
                setMyClasses(classesData);
                setSchedule(scheduleData);
                // setRecentAssignments(assignmentsData.slice(0, 3)); 
                setSalaryHistory(salaryData.slice(0, 3)); // Top 3 recent salaries
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

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-slate-800">Teacher Dashboard</h1>
                <div className="text-sm text-slate-500">
                    Welcome back!
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-6 text-white shadow-lg shadow-indigo-200">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/20 rounded-lg">
                            <BookOpen size={24} />
                        </div>
                        <div>
                            <p className="text-indigo-100 text-sm">Assigned Classes</p>
                            <h3 className="text-2xl font-bold">{stats.totalClasses}</h3>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
                            <Users size={24} />
                        </div>
                        <div>
                            <p className="text-slate-500 text-sm">Total Students</p>
                            <h3 className="text-2xl font-bold text-slate-800">{stats.totalStudents}</h3>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 cursor-pointer hover:border-indigo-200 transition-colors"
                    onClick={() => navigate('/teacher/profile')}
                >
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
                            <DollarSign size={24} />
                        </div>
                        <div>
                            <p className="text-slate-500 text-sm">Recent Salary</p>
                            <h3 className="text-lg font-bold text-slate-800">
                                {salaryHistory.length > 0 ? `₹${salaryHistory[0].amount.toLocaleString()}` : 'N/A'}
                            </h3>
                            <p className="text-xs text-slate-400">
                                {salaryHistory.length > 0 ? new Date(salaryHistory[0].paymentDate || Date.now()).toLocaleDateString() : 'No Records'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* My Classes Section */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-6 border-b border-slate-100">
                            <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                                <BookOpen size={20} className="text-indigo-500" />
                                My Classes
                            </h2>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                            {myClasses.length === 0 ? (
                                <div className="col-span-2 text-center py-8 text-slate-400">No classes assigned.</div>
                            ) : (
                                myClasses.map((cls) => (
                                    <div
                                        key={`${cls.name}-${cls.section}`}
                                        onClick={() => navigate(`/teacher/classes/${cls.name}/${cls.section}`)}
                                        className="p-4 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 cursor-pointer transition-all group"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-bold text-slate-800 text-lg group-hover:text-indigo-700">Class {cls.name}</h3>
                                                <p className="text-slate-500">Section {cls.section}</p>
                                            </div>
                                            <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded-full">
                                                {cls.role}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Schedule (Re-used) */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-6 border-b border-slate-100">
                            <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                                <Clock size={20} className="text-indigo-500" />
                                Today's Schedule
                            </h2>
                        </div>
                        <div className="p-6">
                            {schedule.length === 0 ? (
                                <div className="text-center py-8 text-slate-400">No classes scheduled for today.</div>
                            ) : (
                                <div className="space-y-4">
                                    {schedule.map((session, index) => (
                                        <div key={index} className="flex items-center gap-4 p-4 rounded-lg bg-slate-50">
                                            <div className="w-16 text-center">
                                                <p className="font-bold text-slate-700">{session.periods.startTime}</p>
                                            </div>
                                            <div className="h-10 w-1 bg-indigo-200 rounded-full"></div>
                                            <div>
                                                <h4 className="font-medium text-slate-900">{session.periods.subject}</h4>
                                                <p className="text-sm text-slate-500">{session.className} - {session.section}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar: Profile & Quick Links */}
                <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                        <h3 className="font-semibold text-slate-800 mb-4">Quick Links</h3>
                        <div className="space-y-2">
                            <button
                                onClick={() => navigate('/teacher/profile')}
                                className="w-full text-left p-3 rounded-lg hover:bg-slate-50 text-slate-600 font-medium flex items-center gap-3 transition-colors"
                            >
                                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                                    <Users size={18} />
                                </div>
                                View Profile
                            </button>
                            <button
                                onClick={() => navigate('/teacher/schedule')}
                                className="w-full text-left p-3 rounded-lg hover:bg-slate-50 text-slate-600 font-medium flex items-center gap-3 transition-colors"
                            >
                                <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                                    <Clock size={18} />
                                </div>
                                Full Schedule
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
