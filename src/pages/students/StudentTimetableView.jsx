import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User } from 'lucide-react';
import api from '../../services/api';

const TYPE_STYLES = {
    'Core': 'bg-indigo-50 border-indigo-200 text-indigo-700',
    'Elective': 'bg-emerald-50 border-emerald-200 text-emerald-700',
    'Co-Curricular': 'bg-violet-50 border-violet-200 text-violet-700',
};

const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * StudentTimetableView — read-only weekly grid
 * Props:
 *   studentId (optional) — if passed, fetches that student's timetable
 *   className / section (optional) — direct lookup for admin preview
 *   academicYearId (optional)
 */
export default function StudentTimetableView({ studentId, className, section, academicYearId }) {
    const [timetable, setTimetable] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeDay, setActiveDay] = useState(null); // For mobile: show one day at a time

    useEffect(() => {
        const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
        setActiveDay(today);
    }, []);

    useEffect(() => {
        setLoading(true);
        let url;
        if (studentId) {
            url = `/timetable/student/${studentId}${academicYearId ? `?academicYear=${academicYearId}` : ''}`;
        } else {
            const params = new URLSearchParams();
            if (className) params.append('className', className);
            if (section) params.append('section', section);
            if (academicYearId) params.append('academicYear', academicYearId);
            url = `/timetable?${params.toString()}`;
        }

        api.get(url)
            .then(r => setTimetable(r.data))
            .catch(() => setTimetable(null))
            .finally(() => setLoading(false));
    }, [studentId, className, section, academicYearId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
            </div>
        );
    }

    if (!timetable) {
        return (
            <div className="text-center py-16 text-slate-400">
                <Calendar size={40} className="mx-auto mb-3 text-slate-300" />
                <p className="font-semibold text-slate-500">No timetable published yet</p>
                <p className="text-sm mt-1">Please check back later or contact your class teacher.</p>
            </div>
        );
    }

    const template = timetable.periodTemplate;
    const slots = template?.slots || [];
    const workingDays = template?.workingDays || DAY_ORDER;

    // Build a quick lookup: schedule[day][slotNumber] = { subject, teacher, note }
    const scheduleMap = {};
    (timetable.schedule || []).forEach(dayEntry => {
        scheduleMap[dayEntry.day] = {};
        (dayEntry.slots || []).forEach(slot => {
            scheduleMap[dayEntry.day][slot.slotNumber] = slot;
        });
    });

    const getCell = (day, slotNumber) => scheduleMap[day]?.[slotNumber];

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h2 className="text-lg font-bold text-slate-800">
                        {timetable.className} — Section {timetable.section}
                    </h2>
                    <p className="text-xs text-slate-500">{timetable.academicYear?.name}</p>
                </div>

                {/* Legend */}
                <div className="flex items-center gap-3">
                    {Object.entries(TYPE_STYLES).map(([type, cls]) => (
                        <span key={type} className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${cls}`}>{type}</span>
                    ))}
                </div>
            </div>

            {/* Mobile: Day tabs */}
            <div className="flex gap-1 overflow-x-auto sm:hidden pb-1">
                {workingDays.map(day => (
                    <button key={day}
                        onClick={() => setActiveDay(day)}
                        className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all
                            ${activeDay === day ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                        {day.slice(0, 3)}
                    </button>
                ))}
            </div>

            {/* Desktop: Full grid | Mobile: Single day */}
            <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full table-fixed border-collapse text-sm min-w-[600px]">
                    <thead>
                        <tr className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white">
                            <th className="w-28 px-4 py-3.5 text-left text-xs font-bold uppercase tracking-wider border-r border-indigo-500/30">
                                <div className="flex items-center gap-1.5"><Clock size={13} /> Period</div>
                            </th>
                            {workingDays.map(day => {
                                const isToday = day === new Date().toLocaleDateString('en-US', { weekday: 'long' });
                                return (
                                    <th key={day} className={`px-3 py-3.5 text-center text-xs font-bold uppercase tracking-wider border-r border-indigo-500/30 last:border-r-0
                                        ${isToday ? 'bg-white/10' : ''}`}>
                                        <span>{day.slice(0, 3)}</span>
                                        {isToday && <span className="ml-1 text-indigo-200 text-[9px]">today</span>}
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody>
                        {slots.map((slot, sIdx) => (
                            <tr key={slot.slotNumber} className={`${slot.isBreak ? 'bg-amber-50/70' : sIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                                {/* Slot label */}
                                <td className={`px-4 py-3 border-r border-b border-slate-200 ${slot.isBreak ? 'bg-amber-50' : ''}`}>
                                    <p className={`text-xs font-bold ${slot.isBreak ? 'text-amber-600' : 'text-slate-700'}`}>{slot.label}</p>
                                    <p className="text-[10px] text-slate-400">{slot.startTime} – {slot.endTime}</p>
                                </td>

                                {workingDays.map(day => {
                                    const cell = getCell(day, slot.slotNumber);
                                    const subj = cell?.subject;
                                    const tchr = cell?.teacher;
                                    const typeStyle = TYPE_STYLES[subj?.type] || '';
                                    const isToday = day === new Date().toLocaleDateString('en-US', { weekday: 'long' });

                                    if (slot.isBreak) {
                                        return (
                                            <td key={day} className="px-2 py-3 border-b border-r border-slate-200 last:border-r-0 text-center bg-amber-50">
                                                <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">{slot.label}</span>
                                            </td>
                                        );
                                    }

                                    return (
                                        <td key={day}
                                            className={`px-2 py-2.5 border-b border-r border-slate-200 last:border-r-0
                                                ${isToday ? 'bg-indigo-50/30' : ''}`}>
                                            {subj ? (
                                                <div className={`rounded-lg border px-2.5 py-2 ${typeStyle}`}>
                                                    <p className="text-xs font-semibold leading-tight">{subj.name}</p>
                                                    {tchr && (
                                                        <p className="text-[10px] opacity-70 mt-0.5 flex items-center gap-1">
                                                            <User size={9} />{tchr.name}
                                                        </p>
                                                    )}
                                                    {cell?.note && (
                                                        <p className="text-[9px] italic opacity-50 mt-0.5">{cell.note}</p>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="rounded-lg border border-dashed border-slate-200 py-3 text-center">
                                                    <span className="text-[10px] text-slate-300">—</span>
                                                </div>
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <p className="text-xs text-slate-400 text-right">Last updated: {new Date(timetable.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
        </div>
    );
}
