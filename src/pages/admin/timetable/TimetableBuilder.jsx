import React, { useState, useEffect, useRef } from 'react';
import { Save, CheckCircle, Grid3X3, X, AlertTriangle } from 'lucide-react';
import api from '../../../services/api';
import { useToast } from '../../../components/ui/Toast';

const SUBJECT_TYPE_COLORS = {
    'Core': 'bg-indigo-50 border-indigo-200 text-indigo-800',
    'Elective': 'bg-emerald-50 border-emerald-200 text-emerald-800',
    'Co-Curricular': 'bg-violet-50 border-violet-200 text-violet-800',
};

function CellPopover({ slot, periodSlot, daySubjects, staffList, onSave, onClose }) {
    const [subject, setSubject] = useState(slot?.subject?._id || slot?.subject || '');
    const [teacher, setTeacher] = useState(slot?.teacher?._id || slot?.teacher || '');
    const [note, setNote] = useState(slot?.note || '');
    const ref = useRef(null);

    useEffect(() => {
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [onClose]);

    return (
        <div ref={ref} className="absolute z-50 top-full left-0 mt-1 w-64 bg-white rounded-xl shadow-xl border border-slate-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">{periodSlot?.label}</p>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={14} /></button>
            </div>

            <div>
                <label className="block text-xs text-slate-500 mb-1">Subject</label>
                <select value={subject} onChange={e => setSubject(e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400">
                    <option value="">— None —</option>
                    {daySubjects.map(s => (
                        <option key={s._id} value={s._id}>{s.name}</option>
                    ))}
                </select>
            </div>

            <div>
                <label className="block text-xs text-slate-500 mb-1">Teacher (optional)</label>
                <select value={teacher} onChange={e => setTeacher(e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400">
                    <option value="">— Unassigned —</option>
                    {staffList.map(s => (
                        <option key={s._id} value={s._id}>{s.name}</option>
                    ))}
                </select>
            </div>

            <div>
                <label className="block text-xs text-slate-500 mb-1">Note (optional)</label>
                <input type="text" value={note} onChange={e => setNote(e.target.value)}
                    placeholder="e.g. Lab session"
                    className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400" />
            </div>

            <button onClick={() => onSave({ subject, teacher, note })}
                className="w-full px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors">
                Apply
            </button>
        </div>
    );
}

export default function TimetableBuilder() {
    const { addToast } = useToast();
    const [academicYears, setAcademicYears] = useState([]);
    const [classes, setClasses] = useState([]);
    const [staffList, setStaffList] = useState([]);

    const [selectedYear, setSelectedYear] = useState('');
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSection, setSelectedSection] = useState('');

    const [template, setTemplate] = useState(null);
    const [classSubjects, setClassSubjects] = useState([]);

    // schedule: { [day]: { [slotNumber]: { subject, teacher, note } } }
    const [schedule, setSchedule] = useState({});
    const [activeCell, setActiveCell] = useState(null); // { day, slotNumber }
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [saveError, setSaveError] = useState(null);
    const [loading, setLoading] = useState(false);

    // Initial data load
    useEffect(() => {
        Promise.all([
            api.get('/academic-years'),
            api.get('/academics/classes'),
            api.get('/staff'),
        ]).then(([yearsRes, classesRes, staffRes]) => {
            setAcademicYears(yearsRes.data || []);
            setClasses(classesRes.data || []);
            // Only show teaching staff in teacher dropdown
            const teachingStaff = (staffRes.data || []).filter(s =>
                s.category === 'Teacher' ||
                s.category === 'Teaching' ||
                s.role?.toLowerCase().includes('teacher')
            );
            setStaffList(teachingStaff);
            const active = yearsRes.data?.find(y => y.isActive);
            if (active) setSelectedYear(active._id);
        });
    }, []);

    // When year changes, load period template and clear stale data
    useEffect(() => {
        if (!selectedYear) return;
        setClassSubjects([]);
        api.get(`/period-template?academicYear=${selectedYear}`)
            .then(r => setTemplate(r.data || null));
    }, [selectedYear]);

    // When year+class change, load subject matrix
    useEffect(() => {
        if (!selectedYear || !selectedClass) return;
        api.get(`/class-subject-matrix?academicYear=${selectedYear}&className=${encodeURIComponent(selectedClass)}`)
            .then(r => {
                const entry = (r.data || [])[0];
                setClassSubjects(entry?.subjects || []);
            });
    }, [selectedYear, selectedClass]);

    // When year+class+section change, load existing timetable
    useEffect(() => {
        if (!selectedYear || !selectedClass || !selectedSection) return;
        setLoading(true);
        api.get(`/timetable?academicYear=${selectedYear}&className=${encodeURIComponent(selectedClass)}&section=${selectedSection}`)
            .then(r => {
                if (r.data?.schedule) {
                    const map = {};
                    r.data.schedule.forEach(dayEntry => {
                        map[dayEntry.day] = {};
                        dayEntry.slots.forEach(slot => {
                            map[dayEntry.day][slot.slotNumber] = {
                                subject: slot.subject?._id || slot.subject || '',
                                teacher: slot.teacher?._id || slot.teacher || '',
                                note: slot.note || ''
                            };
                        });
                    });
                    setSchedule(map);
                } else {
                    setSchedule({});
                }
            })
            .finally(() => setLoading(false));
    }, [selectedYear, selectedClass, selectedSection]);

    const selectedClassObj = classes.find(c => c.name === selectedClass);
    const sections = selectedClassObj?.sections?.map(s => s.name) || [];

    const workingDays = template?.workingDays || [];
    const slots = template?.slots || [];

    const getCellValue = (day, slotNumber) => schedule[day]?.[slotNumber] || {};

    const handleCellSave = (day, slotNumber, value) => {
        setSchedule(prev => ({
            ...prev,
            [day]: { ...(prev[day] || {}), [slotNumber]: value }
        }));
        setActiveCell(null);
    };

    const buildScheduleArray = () => {
        return workingDays.map(day => ({
            day,
            // Skip break slots — the template is source of truth for breaks
            slots: slots
                .filter(slot => !slot.isBreak)
                .map(slot => ({
                    slotNumber: slot.slotNumber,
                    ...(schedule[day]?.[slot.slotNumber] || { subject: null, teacher: null, note: '' })
                }))
        }));
    };

    const handleSave = async () => {
        if (!selectedYear || !selectedClass || !selectedSection || !template) return;
        setSaving(true);
        setSaveError(null);
        try {
            await api.post('/timetable', {
                academicYear: selectedYear,
                className: selectedClass,
                section: selectedSection,
                periodTemplate: template._id,
                schedule: buildScheduleArray()
            });
            setSaved(true);
            addToast('Timetable saved successfully!', 'success');
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            const errData = err.response?.data;
            if (errData?.conflicts?.length > 0) {
                const c = errData.conflicts[0];
                const msg = `Teacher conflict: already assigned to ${c.conflictingClass} on ${c.day} (Slot ${c.slotNumber})`;
                setSaveError(msg);
                addToast(msg, 'error');
            } else {
                const msg = errData?.message || 'Failed to save timetable';
                setSaveError(msg);
                addToast(msg, 'error');
            }
        } finally {
            setSaving(false);
        }
    };

    const getSubjectInfo = (subjectId) => classSubjects.find(s => s._id === subjectId);
    const getTeacherName = (teacherId) => staffList.find(s => s._id === teacherId)?.name;

    const isCellActive = (day, slotNum) => activeCell?.day === day && activeCell?.slotNumber === slotNum;

    return (
        <div className="space-y-5">
            {/* Selectors */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Academic Year</label>
                    <select value={selectedYear} onChange={e => { setSelectedYear(e.target.value); setSchedule({}); }}
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        <option value="">Select...</option>
                        {academicYears.map(y => <option key={y._id} value={y._id}>{y.name}{y.isActive ? ' ★' : ''}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Class</label>
                    <select value={selectedClass} onChange={e => { setSelectedClass(e.target.value); setSelectedSection(''); setSchedule({}); }}
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        <option value="">Select...</option>
                        {classes.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Section</label>
                    <select value={selectedSection} onChange={e => { setSelectedSection(e.target.value); setSchedule({}); }}
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        <option value="">Select...</option>
                        {sections.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                <div className="flex items-end">
                    <button onClick={handleSave}
                        disabled={saving || !selectedYear || !selectedClass || !selectedSection || !template}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm shadow-sm disabled:opacity-50 transition-colors">
                        {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : saved ? <CheckCircle size={15} /> : <Save size={15} />}
                        {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Timetable'}
                    </button>
                </div>
            </div>

            {/* Warnings */}
            {selectedYear && !template && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
                    ⚠️ No period template configured for this year. Go to <strong>Period Setup</strong> tab first.
                </div>
            )}
            {selectedYear && selectedClass && classSubjects.length === 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
                    ⚠️ No subjects mapped for <strong>{selectedClass}</strong>. Go to <strong>Subject Mapping</strong> tab first.
                </div>
            )}
            {saveError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center gap-2">
                    <AlertTriangle size={15} className="flex-shrink-0" />
                    {saveError}
                </div>
            )}

            {/* Grid */}
            {template && selectedClass && selectedSection && (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full table-fixed border-collapse text-sm">
                        <thead>
                            <tr className="bg-slate-50">
                                <th className="w-32 px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-r border-slate-200">
                                    Slot
                                </th>
                                {workingDays.map(day => (
                                    <th key={day} className="px-3 py-3 text-center text-xs font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200 border-r last:border-r-0">
                                        {day.slice(0, 3)}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {slots.map((slot, sIdx) => (
                                <tr key={slot.slotNumber} className={sIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                                    {/* Slot label */}
                                    <td className={`px-4 py-3 border-r border-b border-slate-200 ${slot.isBreak ? 'bg-amber-50' : ''}`}>
                                        <p className={`text-xs font-bold ${slot.isBreak ? 'text-amber-600' : 'text-slate-700'}`}>
                                            {slot.label}
                                        </p>
                                        <p className="text-[10px] text-slate-400">{slot.startTime} – {slot.endTime}</p>
                                    </td>

                                    {workingDays.map(day => {
                                        const cell = getCellValue(day, slot.slotNumber);
                                        const subInfo = getSubjectInfo(cell.subject);
                                        const teacherName = getTeacherName(cell.teacher);
                                        const colorClass = SUBJECT_TYPE_COLORS[subInfo?.type] || '';
                                        const isActive = isCellActive(day, slot.slotNumber);

                                        if (slot.isBreak) {
                                            return (
                                                <td key={day} className="px-2 py-3 border-b border-r border-slate-200 last:border-r-0 bg-amber-50 text-center">
                                                    <span className="text-[10px] font-semibold text-amber-500 uppercase tracking-wider">Break</span>
                                                </td>
                                            );
                                        }

                                        return (
                                            <td key={day} className="px-2 py-2 border-b border-r border-slate-200 last:border-r-0 relative">
                                                <button
                                                    onClick={() => setActiveCell(isActive ? null : { day, slotNumber: slot.slotNumber })}
                                                    className={`w-full min-h-[52px] rounded-lg border-2 flex flex-col items-start justify-center px-2 py-1.5 text-left transition-all hover:shadow-sm
                                                        ${subInfo ? `${colorClass}` : 'border-dashed border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/30'}
                                                        ${isActive ? 'ring-2 ring-indigo-400 ring-offset-1' : ''}`}
                                                >
                                                    {subInfo ? (
                                                        <>
                                                            <span className="text-xs font-semibold leading-tight">{subInfo.name}</span>
                                                            {teacherName && <span className="text-[10px] opacity-70 mt-0.5 leading-tight">{teacherName}</span>}
                                                        </>
                                                    ) : (
                                                        <span className="text-[10px] text-slate-300 font-medium w-full text-center">+ assign</span>
                                                    )}
                                                </button>

                                                {isActive && (
                                                    <CellPopover
                                                        slot={cell}
                                                        periodSlot={slot}
                                                        daySubjects={classSubjects}
                                                        staffList={staffList}
                                                        onSave={(val) => handleCellSave(day, slot.slotNumber, val)}
                                                        onClose={() => setActiveCell(null)}
                                                    />
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Empty state */}
            {(!selectedClass || !selectedSection) && (
                <div className="text-center py-20 text-slate-400">
                    <Grid3X3 size={40} className="mx-auto mb-3 text-slate-300" />
                    <p className="font-medium">Select a class and section to build the timetable</p>
                    <p className="text-xs mt-1">Make sure Period Setup and Subject Mapping are done first</p>
                </div>
            )}
        </div>
    );
}
