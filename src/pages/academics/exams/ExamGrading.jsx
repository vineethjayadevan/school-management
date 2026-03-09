import React, { useState, useEffect } from 'react';
import { Search, Save, CheckCircle2 } from 'lucide-react';
import api from '../../../services/api';
import { useToast } from '../../../components/ui/Toast';
import { format } from 'date-fns';

export default function ExamGrading() {
    const [schedules, setSchedules] = useState([]);
    const [selectedSchedule, setSelectedSchedule] = useState('');
    const [gradingData, setGradingData] = useState(null); // { schedule, marks: [] }
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const { addToast } = useToast();

    // Map for editing marks in state before saving
    const [marksObj, setMarksObj] = useState({});

    useEffect(() => {
        // Fetch schedules so teacher can pick which one to grade
        api.get('/exams/schedules')
            .then(res => setSchedules(res.data))
            .catch(err => addToast('Failed to load schedules', 'error'));
    }, [addToast]);

    useEffect(() => {
        if (selectedSchedule) {
            fetchMarks(selectedSchedule);
        } else {
            setGradingData(null);
            setMarksObj({});
        }
    }, [selectedSchedule]);

    const fetchMarks = async (scheduleId) => {
        setIsLoading(true);
        try {
            const res = await api.get(`/exams/schedules/${scheduleId}/marks`);
            setGradingData(res.data);

            // Initialize local editable state
            const initialMarks = {};
            res.data.marks.forEach(item => {
                initialMarks[item.student._id] = {
                    marksObtained: item.mark.marksObtained !== null ? item.mark.marksObtained : '',
                    grade: item.mark.grade || '',
                    remarks: item.mark.remarks || '',
                    status: item.mark.status || 'Present'
                };
            });
            setMarksObj(initialMarks);
        } catch (error) {
            addToast("Failed to load generic marks", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleMarkChange = (studentId, field, value) => {
        setMarksObj(prev => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                [field]: value
            }
        }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const marksArray = Object.keys(marksObj).map(studentId => ({
                studentId,
                marksObtained: marksObj[studentId].marksObtained === '' ? null : Number(marksObj[studentId].marksObtained),
                grade: marksObj[studentId].grade,
                remarks: marksObj[studentId].remarks,
                status: marksObj[studentId].status
            }));

            await api.post(`/exams/schedules/${selectedSchedule}/marks`, { marksArray });
            addToast("Marks saved successfully", "success");
            fetchMarks(selectedSchedule); // Refresh to lock in the new status
        } catch (error) {
            addToast(error.response?.data?.message || "Failed to save marks", "error");
        } finally {
            setIsSaving(false);
        }
    };

    // Helper to calculate Grade (Simplistic example, can be customized)
    const calculateGrade = (studentId) => {
        const markStr = marksObj[studentId]?.marksObtained;
        if (marksObj[studentId]?.status === 'Absent') return 'F';
        if (markStr === '' || markStr === null) return '';

        const mark = Number(markStr);
        if (isNaN(mark)) return '';

        const max = gradingData?.schedule?.maxMarks || 100;
        const percentage = (mark / max) * 100;

        let calculatedGrade = '';
        if (percentage >= 90) calculatedGrade = 'A+';
        else if (percentage >= 80) calculatedGrade = 'A';
        else if (percentage >= 70) calculatedGrade = 'B';
        else if (percentage >= 60) calculatedGrade = 'C';
        else if (percentage >= 50) calculatedGrade = 'D';
        else if (percentage >= gradingData?.schedule?.passingMarks) calculatedGrade = 'E';
        else calculatedGrade = 'F';

        handleMarkChange(studentId, 'grade', calculatedGrade);
    };

    return (
        <div className="p-6">
            <div className="max-w-xl mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-1">Select Exam Schedule to Grade</label>
                <div className="relative">
                    <select
                        value={selectedSchedule}
                        onChange={(e) => setSelectedSchedule(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700"
                    >
                        <option value="">-- Choose Schedule --</option>
                        {schedules.map(s => (
                            <option key={s._id} value={s._id}>
                                {s.examCategory?.name} | {s.class?.name} - {s.section} | {s.subject?.name} | {s.date ? format(new Date(s.date), 'dd MMM yyyy') : ''}
                            </option>
                        ))}
                    </select>
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                </div>
            </div>

            {isLoading && <div className="text-center py-8 text-slate-500">Loading student list...</div>}

            {gradingData && !isLoading && (
                <div className="animate-in fade-in duration-300">
                    <div className="flex justify-between items-center mb-4 bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                        <div>
                            <h3 className="font-bold text-indigo-900 flex items-center gap-2">
                                {gradingData.schedule.subject?.name} Marks Entry
                                {gradingData.schedule.status === 'Results Published' && (
                                    <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full"><CheckCircle2 size={12} /> Published</span>
                                )}
                            </h3>
                            <p className="text-sm text-indigo-700 mt-1">
                                {gradingData.schedule.class?.name} - {gradingData.schedule.section} | Max Marks: {gradingData.schedule.maxMarks} | Passing: {gradingData.schedule.passingMarks}
                            </p>
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="bg-indigo-600 text-white px-5 py-2 rounded-lg font-medium flex items-center gap-2 hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                        >
                            {isSaving ? 'Saving...' : <><Save size={18} /> Save Marks</>}
                        </button>
                    </div>

                    {gradingData.marks.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl text-slate-500">
                            No active students found in this class section.
                        </div>
                    ) : (
                        <div className="overflow-x-auto border border-slate-200 rounded-xl">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                                    <tr>
                                        <th className="px-4 py-3 text-sm w-16 text-center">Roll</th>
                                        <th className="px-4 py-3 text-sm border-l border-slate-200">Student Name</th>
                                        <th className="px-4 py-3 text-sm border-l border-slate-200 w-32">Status</th>
                                        <th className="px-4 py-3 text-sm border-l border-slate-200 w-32">Marks</th>
                                        <th className="px-4 py-3 text-sm border-l border-slate-200 w-24">Grade</th>
                                        <th className="px-4 py-3 text-sm border-l border-slate-200">Remarks</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {gradingData.marks.map((row, idx) => {
                                        const sd = row.student;
                                        const markState = marksObj[sd._id] || {};
                                        const isAbsent = markState.status === 'Absent';

                                        return (
                                            <tr key={sd._id} className="hover:bg-slate-50/50">
                                                <td className="px-4 py-2 text-center text-slate-500 text-sm">{sd.rollNo || '-'}</td>
                                                <td className="px-4 py-2 border-l border-slate-100">
                                                    <div className="font-medium text-slate-900 text-sm">{sd.name}</div>
                                                    <div className="text-xs text-slate-400">{sd.admissionNo}</div>
                                                </td>
                                                <td className="px-4 py-2 border-l border-slate-100">
                                                    <select
                                                        value={markState.status}
                                                        onChange={(e) => handleMarkChange(sd._id, 'status', e.target.value)}
                                                        className={`w-full px-2 py-1.5 border rounded-md text-sm outline-none focus:ring-2 focus:ring-indigo-500 ${isAbsent ? 'bg-red-50 text-red-700 border-red-200' : 'bg-white border-slate-200 text-slate-700'
                                                            }`}
                                                    >
                                                        <option value="Present">Present</option>
                                                        <option value="Absent">Absent</option>
                                                        <option value="Excused">Excused</option>
                                                    </select>
                                                </td>
                                                <td className="px-4 py-2 border-l border-slate-100 bg-slate-50/30">
                                                    <input
                                                        type="number"
                                                        value={markState.marksObtained}
                                                        onChange={(e) => handleMarkChange(sd._id, 'marksObtained', e.target.value)}
                                                        onBlur={() => calculateGrade(sd._id)}
                                                        disabled={isAbsent}
                                                        max={gradingData.schedule.maxMarks}
                                                        className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100 disabled:text-slate-400 font-medium text-center"
                                                        placeholder="00"
                                                    />
                                                </td>
                                                <td className="px-4 py-2 border-l border-slate-100">
                                                    <input
                                                        type="text"
                                                        value={isAbsent ? 'F' : markState.grade}
                                                        onChange={(e) => handleMarkChange(sd._id, 'grade', e.target.value)}
                                                        disabled={isAbsent}
                                                        className="w-full px-2 py-1.5 border border-slate-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100 text-center font-bold text-slate-700 uppercase"
                                                        maxLength={3}
                                                    />
                                                </td>
                                                <td className="px-4 py-2 border-l border-slate-100">
                                                    <input
                                                        type="text"
                                                        value={markState.remarks}
                                                        onChange={(e) => handleMarkChange(sd._id, 'remarks', e.target.value)}
                                                        className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-300"
                                                        placeholder="Optional remarks..."
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
