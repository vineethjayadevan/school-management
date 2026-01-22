import { useState, useEffect } from 'react';
import { Calendar, Clock, BookOpen, Banknote } from 'lucide-react';
import { storageService } from '../../services/storage';

export default function StudentDashboard() {
    const [schedule, setSchedule] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [feeData, setFeeData] = useState({ status: 'Loading...', history: [] });
    const [loading, setLoading] = useState(true);

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

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-800">My Dashboard</h1>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Fee Status Card */}
                <div className={`rounded-xl p-6 text-white shadow-lg ${feeData.status === 'Paid' ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-emerald-200' : 'bg-gradient-to-br from-rose-500 to-rose-600 shadow-rose-200'}`}>
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/20 rounded-lg">
                            <Banknote size={24} />
                        </div>
                        <div>
                            <p className="text-white/80 text-sm">Fee Status</p>
                            <h3 className="text-2xl font-bold">{feeData.status || 'Unknown'}</h3>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
                            <BookOpen size={24} />
                        </div>
                        <div>
                            <p className="text-slate-500 text-sm">Pending Assignments</p>
                            <h3 className="text-2xl font-bold text-slate-800">{assignments.length}</h3>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                            <Calendar size={24} />
                        </div>
                        <div>
                            <p className="text-slate-500 text-sm">Classes Today</p>
                            <h3 className="text-2xl font-bold text-slate-800">{schedule.length}</h3>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* My Schedule */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                        <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                            <Clock size={20} className="text-purple-500" />
                            My Schedule
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
                                        <div className="h-10 w-1 bg-purple-200 rounded-full"></div>
                                        <div>
                                            <h4 className="font-medium text-slate-900">{session.periods.subject}</h4>
                                            <p className="text-sm text-slate-500">Teacher: {session.periods.teacher?.name || 'N/A'}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Assignments */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                        <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                            <BookOpen size={20} className="text-indigo-500" />
                            My Assignments
                        </h2>
                    </div>
                    <div className="p-6">
                        {assignments.length === 0 ? (
                            <div className="text-center py-8 text-slate-400">No assignments assigned.</div>
                        ) : (
                            <div className="space-y-4">
                                {assignments.map((assignment) => (
                                    <div key={assignment._id} className="p-4 rounded-lg border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-medium text-slate-900">{assignment.title}</h4>
                                            <span className={`px-2 py-1 text-xs rounded-full ${new Date(assignment.dueDate) < new Date() ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-600'}`}>
                                                Due: {new Date(assignment.dueDate).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-500 line-clamp-2">{assignment.description}</p>
                                        <div className="mt-3 text-xs text-slate-400">
                                            Subject: {assignment.subject}
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
