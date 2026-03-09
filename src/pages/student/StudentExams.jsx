import React, { useState, useEffect } from 'react';
import { BookOpen, CheckCircle2, Award, AlertCircle, Sparkles, TrendingUp, Presentation, Percent } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import clsx from 'clsx';

export default function StudentExams() {
    const { user } = useAuth();
    const [examData, setExamData] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const { addToast } = useToast();

    const fetchStudentMarks = async () => {
        setIsLoading(true);
        try {
            const res = await api.get(`/exams/student/${user.profileId}`);
            setExamData(res.data);
        } catch (error) {
            addToast("Failed to load exam results", "error");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user?.profileId) {
            fetchStudentMarks();
        }
    }, [user]);

    const categories = Object.keys(examData);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] animate-pulse">
                <div className="w-16 h-16 bg-indigo-100 rounded-3xl flex items-center justify-center mb-4">
                    <Award size={32} className="text-indigo-400" />
                </div>
                <p className="text-slate-400 font-medium tracking-wide">Gathering your achievements...</p>
            </div>
        );
    }

    if (categories.length === 0) {
        return (
            <div className="max-w-5xl mx-auto p-6 animate-in fade-in zoom-in duration-500">
                <div className="relative overflow-hidden bg-white rounded-[3rem] p-12 text-center shadow-2xl shadow-indigo-500/5 border border-slate-100 mt-8">
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-50/50 via-white to-violet-50/50 pointer-events-none"></div>
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-violet-500/10 rounded-full blur-3xl"></div>

                    <div className="relative z-10 flex flex-col items-center justify-center">
                        <div className="w-24 h-24 bg-gradient-to-br from-indigo-100 to-violet-100 rounded-[2rem] flex items-center justify-center shadow-inner mb-6 rotate-3">
                            <BookOpen size={40} className="text-indigo-600" />
                        </div>
                        <h3 className="text-3xl font-black text-slate-900 tracking-tight mb-2">No Exam Results Yet</h3>
                        <p className="text-slate-500 max-w-md mx-auto text-lg leading-relaxed">
                            Your grades will appear here as soon as your teachers publish the assessment results. Keep up the great work!
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-10 max-w-6xl mx-auto pb-24">

            {/* Header Hero Section */}
            <div className="relative rounded-[3rem] overflow-hidden bg-slate-900 shadow-2xl animate-in slide-in-from-top-8 fade-in duration-700">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 to-violet-600/20 mix-blend-overlay"></div>
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3"></div>

                <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row items-center gap-8">
                    <div className="w-20 h-20 shrink-0 bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2rem] flex items-center justify-center shadow-[0_0_40px_rgba(99,102,241,0.3)]">
                        <Award size={36} className="text-indigo-300" />
                    </div>
                    <div className="text-center md:text-left flex-1 space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/10">
                            <Sparkles size={12} className="text-yellow-400" />
                            <span className="text-[10px] font-black tracking-widest text-indigo-200 uppercase">Academic Record</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter">Examination Results</h1>
                        <p className="text-indigo-200/80 font-medium max-w-xl text-lg relative z-10">Review your academic progress, performance metrics, and subject-wise breakdowns.</p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-10">
                {categories.map((categoryName, idx) => {
                    const categoryInfo = examData[categoryName];
                    const results = categoryInfo.results || [];

                    // Calculate totals
                    const totalObtained = results.reduce((sum, r) => sum + (r.marksObtained || 0), 0);
                    const totalMax = results.reduce((sum, r) => sum + (r.maxMarks || 0), 0);
                    const percentage = totalMax > 0 ? ((totalObtained / totalMax) * 100).toFixed(1) : 0;

                    const pValue = parseFloat(percentage);
                    let colorTheme = 'emerald';
                    if (pValue < 50) colorTheme = 'rose';
                    else if (pValue < 75) colorTheme = 'amber';

                    const colorMaps = {
                        emerald: { bg: 'bg-emerald-500', text: 'text-emerald-600', light: 'bg-emerald-50', border: 'border-emerald-200', glow: 'shadow-emerald-500/20' },
                        amber: { bg: 'bg-amber-500', text: 'text-amber-600', light: 'bg-amber-50', border: 'border-amber-200', glow: 'shadow-amber-500/20' },
                        rose: { bg: 'bg-rose-500', text: 'text-rose-600', light: 'bg-rose-50', border: 'border-rose-200', glow: 'shadow-rose-500/20' }
                    };
                    const theme = colorMaps[colorTheme];

                    return (
                        <div
                            key={categoryName}
                            className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/40 border border-slate-200/60 overflow-hidden break-inside-avoid animate-in fade-in slide-in-from-bottom-8 duration-500"
                            style={{ animationDelay: `${idx * 150}ms`, animationFillMode: 'both' }}
                        >
                            {/* Category Header */}
                            <div className="relative p-8 md:p-10 border-b border-slate-100 bg-slate-50/50 overflow-hidden">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-slate-200/20 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2"></div>

                                <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600">
                                                <Presentation size={18} />
                                            </div>
                                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">{categoryName}</h2>
                                        </div>
                                        <p className="text-sm font-bold text-slate-500 ml-12">Weightage: <span className="text-indigo-600 px-2 py-0.5 bg-indigo-50 rounded-md border border-indigo-100">{categoryInfo.weightage}%</span> towards final grade</p>
                                    </div>

                                    {/* Stats Glass Pill */}
                                    <div className="flex items-center bg-white p-2 pr-6 rounded-3xl shadow-lg shadow-slate-200/40 border border-slate-100 gap-4">
                                        <div className={clsx("w-14 h-14 rounded-2xl flex flex-col items-center justify-center text-white shadow-lg shrink-0", theme.bg, theme.glow)}>
                                            <Percent size={18} className="mb-0.5 opacity-80" />
                                            <span className="font-black text-sm tracking-tighter leading-none">{percentage}%</span>
                                        </div>

                                        <div className="flex items-center gap-6 px-2">
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Score</p>
                                                <p className="font-black text-2xl text-slate-900 tracking-tighter leading-none">
                                                    {totalObtained} <span className="text-sm text-slate-400 font-bold">/ {totalMax}</span>
                                                </p>
                                            </div>

                                            <div className="w-px h-10 bg-slate-100"></div>

                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Performance</p>
                                                <p className={clsx("font-black text-lg tracking-tight", theme.text)}>
                                                    {pValue >= 75 ? 'Excellent' : pValue >= 50 ? 'Average' : 'Needs Work'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Marks Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-white">
                                        <tr className="border-b border-slate-100">
                                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Subject Details</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Marks Obtained</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Grade Log</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Attendance Status</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Teacher Remarks</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50/80">
                                        {results.map((res, idx) => {
                                            const isAbsent = res.status === 'Absent';
                                            const marksText = res.marksObtained !== null ? res.marksObtained : '-';

                                            return (
                                                <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                                                    <td className="px-8 py-5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:border-indigo-100 transition-colors">
                                                                <BookOpen size={16} />
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-slate-900 tracking-tight">{res.subject?.name}</div>
                                                                <div className="text-xs font-semibold text-slate-400 tracking-wider uppercase">{res.subject?.code}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        {isAbsent ? (
                                                            <span className="text-slate-300 font-bold">-</span>
                                                        ) : (
                                                            <div className="flex items-end gap-1">
                                                                <span className="font-black text-slate-800 text-lg leading-none">{marksText}</span>
                                                                <span className="text-slate-400 text-xs font-bold leading-relaxed">/ {res.maxMarks}</span>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        {res.grade ? (
                                                            <span className={clsx(
                                                                "inline-flex items-center justify-center px-3 py-1.5 rounded-xl text-sm font-black border tracking-tight shadow-sm",
                                                                res.grade.includes('A') ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                                                                    res.grade.includes('B') ? 'bg-indigo-50 border-indigo-200 text-indigo-700' :
                                                                        res.grade.includes('C') || res.grade.includes('D') ? 'bg-amber-50 border-amber-200 text-amber-700' :
                                                                            'bg-rose-50 border-rose-200 text-rose-700'
                                                            )}>
                                                                {res.grade}
                                                            </span>
                                                        ) : <span className="text-slate-300 font-bold">-</span>}
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        {res.status === 'Present' ? (
                                                            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-full w-fit tracking-wide shadow-sm">
                                                                <CheckCircle2 size={14} /> Present
                                                            </span>
                                                        ) : (
                                                            <span className="flex items-center gap-1.5 text-xs font-bold text-rose-600 bg-rose-50 border border-rose-100 px-3 py-1.5 rounded-full w-fit tracking-wide shadow-sm">
                                                                <AlertCircle size={14} /> {res.status}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        {res.remarks ? (
                                                            <span className="text-sm font-medium text-slate-600 leading-relaxed block max-w-xs">{res.remarks}</span>
                                                        ) : (
                                                            <span className="text-slate-300 text-xs font-medium italic">No remarks provided</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
