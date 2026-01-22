import { useState, useEffect } from 'react';
import { Calendar, Clock, CheckSquare, Plus, BookOpen } from 'lucide-react';
import { storageService } from '../../services/storage';

export default function TeacherDashboard() {
    const [schedule, setSchedule] = useState([]);
    const [recentAssignments, setRecentAssignments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [scheduleData, assignmentsData] = await Promise.all([
                    storageService.teacher.getSchedule(),
                    storageService.teacher.getAssignments()
                ]);
                setSchedule(scheduleData);
                setRecentAssignments(assignmentsData.slice(0, 3)); // Top 3
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
            <h1 className="text-2xl font-bold text-slate-800">Teacher Dashboard</h1>

            {/* Quick Stats / Welcome */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-6 text-white shadow-lg shadow-indigo-200">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/20 rounded-lg">
                            <Calendar size={24} />
                        </div>
                        <div>
                            <p className="text-indigo-100 text-sm">Upcoming Classes</p>
                            <h3 className="text-2xl font-bold">{schedule.length}</h3>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
                            <CheckSquare size={24} />
                        </div>
                        <div>
                            <p className="text-slate-500 text-sm">Active Assignments</p>
                            <h3 className="text-2xl font-bold text-slate-800">{recentAssignments.length}</h3>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                            <BookOpen size={24} />
                        </div>
                        <div>
                            <p className="text-slate-500 text-sm">Total Classes</p>
                            <h3 className="text-2xl font-bold text-slate-800">5</h3> {/* Placeholder for now */}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Upcoming Schedule */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                        <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                            <Clock size={20} className="text-indigo-500" />
                            Your Schedule
                        </h2>
                    </div>
                    <div className="p-6">
                        {schedule.length === 0 ? (
                            <div className="text-center py-8 text-slate-400">No classes scheduled.</div>
                        ) : (
                            <div className="space-y-4">
                                {schedule.map((session, index) => (
                                    <div key={index} className="flex items-center gap-4 p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                                        <div className="w-16 text-center">
                                            <p className="font-bold text-slate-700">{session.periods.startTime}</p>
                                            <p className="text-xs text-slate-400">{session.dayOfWeek}</p>
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

                {/* Recent Assignments */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                        <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                            <CheckSquare size={20} className="text-emerald-500" />
                            Recent Assignments
                        </h2>
                        <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
                            <Plus size={16} /> New
                        </button>
                    </div>
                    <div className="p-6">
                        {recentAssignments.length === 0 ? (
                            <div className="text-center py-8 text-slate-400">No assignments created yet.</div>
                        ) : (
                            <div className="space-y-4">
                                {recentAssignments.map((assignment) => (
                                    <div key={assignment._id} className="p-4 rounded-lg border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-medium text-slate-900">{assignment.title}</h4>
                                            <span className="px-2 py-1 text-xs rounded-full bg-slate-100 text-slate-600">
                                                {new Date(assignment.dueDate).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-500 line-clamp-2">{assignment.description}</p>
                                        <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                                            <span>{assignment.className}-{assignment.section}</span>
                                            <span>•</span>
                                            <span>{assignment.subject}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
