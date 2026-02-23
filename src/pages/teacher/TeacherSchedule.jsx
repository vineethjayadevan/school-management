import { useState, useEffect } from 'react';
import { storageService } from '../../services/storage';
import { Clock, Calendar, BookOpen, Loader2, ChevronRight, MapPin } from 'lucide-react';
import clsx from 'clsx';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function TeacherSchedule() {
    const [schedule, setSchedule] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeDay, setActiveDay] = useState(new Date().toLocaleDateString('en-US', { weekday: 'long' }));

    useEffect(() => {
        const fetchSchedule = async () => {
            try {
                const data = await storageService.teacher.getSchedule();
                setSchedule(data);
            } catch (error) {
                console.error("Failed to fetch schedule", error);
            } finally {
                setLoading(false);
            }
        };
        fetchSchedule();
    }, []);

    // Helper to get sessions for a specific day
    const getSessionsForDay = (day) => {
        return schedule.filter(s => s.dayOfWeek === day)
            .sort((a, b) => a.periods.startTime.localeCompare(b.periods.startTime));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Weekly Schedule</h1>
                    <p className="text-slate-500 text-sm">View your teaching periods for the entire week</p>
                </div>
            </div>

            {/* Day Selector (Mobile/Small screens) */}
            <div className="flex overflow-x-auto pb-2 gap-2 lg:hidden no-scrollbar">
                {DAYS.map((day) => {
                    const sessionsCount = getSessionsForDay(day).length;
                    return (
                        <button
                            key={day}
                            onClick={() => setActiveDay(day)}
                            className={clsx(
                                "flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition-all border",
                                activeDay === day
                                    ? "bg-indigo-600 text-white border-indigo-600"
                                    : "bg-white text-slate-600 border-slate-200"
                            )}
                        >
                            {day.slice(0, 3)}
                            {sessionsCount > 0 && <span className="ml-2 px-1.5 py-0.5 bg-white/20 rounded text-[10px]">{sessionsCount}</span>}
                        </button>
                    );
                })}
            </div>

            {/* Main Schedule Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                {DAYS.map((day) => {
                    const sessions = getSessionsForDay(day);
                    const isToday = new Date().toLocaleDateString('en-US', { weekday: 'long' }) === day;

                    return (
                        <div
                            key={day}
                            className={clsx(
                                "bg-white rounded-2xl border transition-all overflow-hidden flex flex-col",
                                isToday ? "border-indigo-500 shadow-lg shadow-indigo-50 ring-1 ring-indigo-500" : "border-slate-100 shadow-sm",
                                activeDay !== day && "hidden lg:flex" // Hide on mobile if not active
                            )}
                        >
                            <div className={clsx(
                                "px-6 py-4 flex justify-between items-center",
                                isToday ? "bg-indigo-500 text-white" : "bg-slate-50 text-slate-800"
                            )}>
                                <h3 className="font-bold">{day}</h3>
                                {isToday && <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded">Today</span>}
                            </div>

                            <div className="flex-1 p-4 space-y-3">
                                {sessions.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                                        <Calendar size={32} className="opacity-20 mb-2" />
                                        <p className="text-xs italic">No classes scheduled</p>
                                    </div>
                                ) : (
                                    sessions.map((session, idx) => (
                                        <div
                                            key={idx}
                                            className="group relative pl-4 pr-3 py-3 rounded-xl border border-slate-100 bg-slate-50/30 hover:bg-white hover:border-indigo-200 hover:shadow-md transition-all"
                                        >
                                            <div className="absolute left-0 top-3 bottom-3 w-1 bg-indigo-400 rounded-full group-hover:bg-indigo-600 transition-colors"></div>
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className="font-bold text-slate-800 text-sm group-hover:text-indigo-700">{session.periods.subject}</h4>
                                                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                                                    {session.className}-{session.section}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4 text-slate-500">
                                                <div className="flex items-center gap-1.5 text-[11px] font-medium">
                                                    <Clock size={12} className="text-slate-400" />
                                                    {session.periods.startTime} - {session.periods.endTime}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                    ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
