import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Clock, Coffee, Save, CheckCircle } from 'lucide-react';
import api from '../../../services/api';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const defaultSlot = () => ({
    slotNumber: 1,
    label: 'Period 1',
    startTime: '09:00',
    endTime: '09:45',
    isBreak: false
});

export default function PeriodTemplateManager() {
    const [academicYears, setAcademicYears] = useState([]);
    const [selectedYear, setSelectedYear] = useState('');
    const [workingDays, setWorkingDays] = useState(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
    const [slots, setSlots] = useState([defaultSlot()]);
    const [templateName, setTemplateName] = useState('Standard School Day');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        api.get('/academic-years').then(r => {
            setAcademicYears(r.data || []);
            const active = r.data?.find(y => y.isActive);
            if (active) setSelectedYear(active._id);
        });
    }, []);

    useEffect(() => {
        if (!selectedYear) return;
        setLoading(true);
        api.get(`/period-template?academicYear=${selectedYear}`)
            .then(r => {
                if (r.data) {
                    setTemplateName(r.data.name || 'Standard School Day');
                    setWorkingDays(r.data.workingDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
                    setSlots(r.data.slots?.length > 0 ? r.data.slots : [defaultSlot()]);
                } else {
                    // Reset for new year
                    setTemplateName('Standard School Day');
                    setWorkingDays(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
                    setSlots([defaultSlot()]);
                }
            })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [selectedYear]);

    const toggleDay = (day) => {
        setWorkingDays(prev =>
            prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
        );
    };

    const addSlot = () => {
        const nextNum = slots.length + 1;
        setSlots(prev => [...prev, {
            slotNumber: nextNum,
            label: `Period ${nextNum}`,
            startTime: '',
            endTime: '',
            isBreak: false
        }]);
    };

    const addBreak = () => {
        const nextNum = slots.length + 1;
        setSlots(prev => [...prev, {
            slotNumber: nextNum,
            label: 'Lunch Break',
            startTime: '',
            endTime: '',
            isBreak: true
        }]);
    };

    const updateSlot = (idx, field, value) => {
        setSlots(prev => prev.map((s, i) =>
            i === idx ? { ...s, [field]: value } : s
        ));
    };

    const removeSlot = (idx) => {
        setSlots(prev => {
            const updated = prev.filter((_, i) => i !== idx);
            // Re-number
            return updated.map((s, i) => ({ ...s, slotNumber: i + 1 }));
        });
    };

    const handleSave = async () => {
        if (!selectedYear) return;
        setSaving(true);
        try {
            await api.post('/period-template', {
                academicYear: selectedYear,
                name: templateName,
                workingDays,
                slots: slots.map((s, i) => ({ ...s, slotNumber: i + 1 }))
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6 max-w-3xl">
            {/* Year selector + Template name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Academic Year</label>
                    <select
                        value={selectedYear}
                        onChange={e => setSelectedYear(e.target.value)}
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="">Select year...</option>
                        {academicYears.map(y => (
                            <option key={y._id} value={y._id}>{y.name}{y.isActive ? ' (Active)' : ''}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Template Name</label>
                    <input
                        type="text"
                        value={templateName}
                        onChange={e => setTemplateName(e.target.value)}
                        placeholder="e.g. Standard School Day"
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
            </div>

            {/* Working Days */}
            <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Working Days</label>
                <div className="flex flex-wrap gap-2">
                    {DAYS.map(day => (
                        <button
                            key={day}
                            onClick={() => toggleDay(day)}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium border-2 transition-all
                                ${workingDays.includes(day)
                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                                    : 'border-slate-200 text-slate-500 hover:border-indigo-300'
                                }`}
                        >
                            {day.slice(0, 3)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Period Slots */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Period Slots ({slots.length})
                    </label>
                    <div className="flex gap-2">
                        <button onClick={addBreak}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 transition-colors">
                            <Coffee size={13} /> Add Break
                        </button>
                        <button onClick={addSlot}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 transition-colors">
                            <Plus size={13} /> Add Period
                        </button>
                    </div>
                </div>

                <div className="space-y-2">
                    {slots.map((slot, idx) => (
                        <div key={idx}
                            className={`flex items-center gap-3 p-3 rounded-xl border transition-all
                                ${slot.isBreak ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200'}`}>
                            {/* Slot number badge */}
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0
                                ${slot.isBreak ? 'bg-amber-200 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>
                                {idx + 1}
                            </div>

                            {/* Break icon or clock */}
                            {slot.isBreak
                                ? <Coffee size={15} className="text-amber-500 flex-shrink-0" />
                                : <Clock size={15} className="text-slate-400 flex-shrink-0" />
                            }

                            {/* Label */}
                            <input
                                type="text"
                                value={slot.label}
                                onChange={e => updateSlot(idx, 'label', e.target.value)}
                                placeholder="Label"
                                className="flex-1 min-w-0 px-2 py-1 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                            />

                            {/* Start Time */}
                            <input
                                type="time"
                                value={slot.startTime}
                                onChange={e => updateSlot(idx, 'startTime', e.target.value)}
                                className="px-2 py-1 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 w-28"
                            />
                            <span className="text-slate-400 text-xs">→</span>
                            {/* End Time */}
                            <input
                                type="time"
                                value={slot.endTime}
                                onChange={e => updateSlot(idx, 'endTime', e.target.value)}
                                className="px-2 py-1 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 w-28"
                            />

                            {/* Break toggle */}
                            <button
                                title={slot.isBreak ? 'Mark as Period' : 'Mark as Break'}
                                onClick={() => updateSlot(idx, 'isBreak', !slot.isBreak)}
                                className={`px-2 py-1 text-[10px] font-bold rounded-md border transition-colors
                                    ${slot.isBreak ? 'bg-amber-100 border-amber-300 text-amber-700' : 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-amber-50'}`}>
                                {slot.isBreak ? 'BREAK' : 'PERIOD'}
                            </button>

                            {/* Remove */}
                            <button onClick={() => removeSlot(idx)}
                                className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Save Button */}
            <div className="flex items-center gap-3 pt-2">
                <button
                    onClick={handleSave}
                    disabled={saving || !selectedYear}
                    className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-sm disabled:opacity-50 transition-colors"
                >
                    {saving ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : saved ? (
                        <CheckCircle size={16} />
                    ) : (
                        <Save size={16} />
                    )}
                    {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Period Template'}
                </button>
                {saved && <span className="text-sm text-emerald-600 font-medium">✓ Template saved successfully</span>}
            </div>
        </div>
    );
}
