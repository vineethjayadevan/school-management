import React, { useState } from 'react';
import { Calendar, Clock, BookOpen, Grid3X3 } from 'lucide-react';
import PeriodTemplateManager from './PeriodTemplateManager';
import ClassSubjectSetup from './ClassSubjectSetup';
import TimetableBuilder from './TimetableBuilder';

const TABS = [
    { id: 'periods', label: 'Period Setup', icon: Clock, desc: 'Configure daily slots & working days' },
    { id: 'subjects', label: 'Subject Mapping', icon: BookOpen, desc: 'Assign subjects to each class' },
    { id: 'builder', label: 'Build Timetable', icon: Grid3X3, desc: 'Fill in the weekly schedule' },
];

export default function TimetablePage() {
    const [activeTab, setActiveTab] = useState('periods');

    return (
        <div className="space-y-6 w-full mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-100 rounded-xl">
                    <Calendar size={24} className="text-indigo-600" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Timetable Management</h1>
                    <p className="text-sm text-slate-500">Configure period structure, subject mapping, and weekly schedules</p>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 border-b border-slate-200">
                {TABS.map((tab, idx) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    const isLocked = idx > 0 && activeTab === 'periods'; // Soft guide — not hard lock
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all -mb-px
                                ${isActive
                                    ? 'border-indigo-600 text-indigo-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                                }`}
                        >
                            <Icon size={16} />
                            <span>{tab.label}</span>
                            <span className={`hidden sm:inline text-[10px] font-normal ${isActive ? 'text-indigo-400' : 'text-slate-400'}`}>
                                {tab.desc}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Tab Content */}
            <div>
                {activeTab === 'periods' && <PeriodTemplateManager />}
                {activeTab === 'subjects' && <ClassSubjectSetup />}
                {activeTab === 'builder' && <TimetableBuilder />}
            </div>
        </div>
    );
}
