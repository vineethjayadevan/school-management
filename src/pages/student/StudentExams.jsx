import React, { useState, useEffect } from 'react';
import { BookOpen, CheckCircle2, Award, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';

export default function StudentExams() {
    const { user } = useAuth();
    const [examData, setExamData] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const { addToast } = useToast();

    useEffect(() => {
        if (user?.studentId) {
            fetchStudentMarks();
        }
    }, [user]);

    const fetchStudentMarks = async () => {
        setIsLoading(true);
        try {
            // Using the new endpoint we created in examController
            const res = await api.get(`/exams/student/${user.studentId}`);
            setExamData(res.data);
        } catch (error) {
            addToast("Failed to load exam results", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const categories = Object.keys(examData);

    if (isLoading) {
        return <div className="p-6 text-center text-slate-500">Loading your exam results...</div>;
    }

    if (categories.length === 0) {
        return (
            <div className="p-6">
                <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl shadow-sm">
                    <BookOpen className="mx-auto h-16 w-16 text-slate-200 mb-4" />
                    <h3 className="text-lg font-bold text-slate-900 mb-2">No Exam Results Yet</h3>
                    <p className="text-slate-500">Your exam results will appear here once published by your teachers.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-8 max-w-5xl mx-auto animate-in fade-in duration-300">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2 mb-2">
                    <Award className="text-indigo-600" />
                    Examination Results
                </h1>
                <p className="text-slate-500">View your performance across all terms and assessments.</p>
            </div>

            {categories.map(categoryName => {
                const categoryInfo = examData[categoryName];
                const results = categoryInfo.results || [];

                // Calculate totals
                const totalObtained = results.reduce((sum, r) => sum + (r.marksObtained || 0), 0);
                const totalMax = results.reduce((sum, r) => sum + (r.maxMarks || 0), 0);
                const percentage = totalMax > 0 ? ((totalObtained / totalMax) * 100).toFixed(1) : 0;

                return (
                    <div key={categoryName} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden break-inside-avoid">
                        {/* Category Header */}
                        <div className="bg-slate-50 border-b border-slate-200 p-6">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900">{categoryName}</h2>
                                    <p className="text-sm text-slate-500 mt-1">Weightage: {categoryInfo.weightage}% towards final grade</p>
                                </div>

                                {/* Score Badge */}
                                <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100">
                                    <div className="text-right">
                                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Score</div>
                                        <div className="font-bold text-indigo-700 text-lg">
                                            {totalObtained} <span className="text-sm text-slate-400 font-medium">/ {totalMax}</span>
                                        </div>
                                    </div>
                                    <div className="w-px h-10 bg-slate-200 mx-1"></div>
                                    <div className="text-center">
                                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Percentage</div>
                                        <div className={`font-bold text-lg ${percentage >= 75 ? 'text-green-600' : percentage >= 50 ? 'text-yellow-600' : 'text-red-500'}`}>
                                            {percentage}%
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Marks Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-white border-b border-slate-100">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Subject</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Marks</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Grade</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Remarks</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {results.map((res, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-slate-900">{res.subject?.name}</div>
                                                <div className="text-xs text-slate-400">{res.subject?.code}</div>
                                            </td>
                                            <td className="px-6 py-4 font-medium">
                                                {res.status === 'Absent' ? (
                                                    <span className="text-slate-300">-</span>
                                                ) : (
                                                    <span>
                                                        {res.marksObtained !== null ? res.marksObtained : '-'}
                                                        <span className="text-slate-400 text-xs font-normal"> / {res.maxMarks}</span>
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {res.grade ? (
                                                    <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-md text-sm font-bold ${res.grade.includes('A') ? 'bg-green-100 text-green-700' :
                                                        res.grade.includes('B') ? 'bg-blue-100 text-blue-700' :
                                                            res.grade.includes('C') || res.grade.includes('D') ? 'bg-yellow-100 text-yellow-700' :
                                                                'bg-red-100 text-red-700'
                                                        }`}>
                                                        {res.grade}
                                                    </span>
                                                ) : <span className="text-slate-300">-</span>}
                                            </td>
                                            <td className="px-6 py-4">
                                                {res.status === 'Present' ? (
                                                    <span className="flex items-center gap-1.5 text-xs font-medium text-green-600 bg-green-50 px-2.5 py-1 rounded-full w-fit">
                                                        <CheckCircle2 size={14} /> Present
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1.5 text-xs font-medium text-red-600 bg-red-50 px-2.5 py-1 rounded-full w-fit">
                                                        <AlertCircle size={14} /> {res.status}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600">
                                                {res.remarks || <span className="text-slate-300 text-xs italic">No remarks</span>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
