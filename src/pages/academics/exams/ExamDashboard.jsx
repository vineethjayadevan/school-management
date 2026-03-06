import React, { useState } from 'react';
import {
    LayoutDashboard,
    CalendarDays,
    PenTool,
    BookOpen,
    ClipboardList
} from 'lucide-react';
import ExamCategories from './ExamCategories';
import ExamSchedules from './ExamSchedules';
import ExamGrading from './ExamGrading';
import { useAuth } from '../../../context/AuthContext';

export default function ExamDashboard() {
    const { user } = useAuth();
    const isAdmin = user?.role === 'Admin' || user?.role === 'SuperAdmin';

    // Default tab
    const [activeTab, setActiveTab] = useState('schedules');

    const tabs = [
        { id: 'schedules', label: 'Exam Schedules', icon: CalendarDays },
        { id: 'grading', label: 'Enter Marks', icon: PenTool }
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'schedules':
                return <ExamSchedules />;
            case 'grading':
                return <ExamGrading />;
            default:
                return <ExamSchedules />;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <BookOpen className="text-indigo-600" />
                        Examinations
                    </h1>
                    <p className="text-slate-500">Manage exam categories, scheduling, and student marks.</p>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-2 inline-flex flex-wrap gap-2 w-full sm:w-auto">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex flex-1 sm:flex-none items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive
                                ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                }`}
                        >
                            <Icon size={18} className={isActive ? 'text-indigo-600' : 'text-slate-400'} />
                            <span className="whitespace-nowrap">{tab.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Main Content Area */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 min-h-[500px]">
                {renderContent()}
            </div>
        </div>
    );
}
