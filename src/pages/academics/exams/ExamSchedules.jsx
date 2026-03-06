import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Calendar, Clock, BookOpen, User, X, Filter } from 'lucide-react';
import { useForm } from 'react-hook-form';
import api from '../../../services/api';
import { useToast } from '../../../components/ui/Toast';
import { format } from 'date-fns';
import { useAuth } from '../../../context/AuthContext';

export default function ExamSchedules() {
    const { user } = useAuth();
    const isAdmin = user?.role === 'Admin' || user?.role === 'SuperAdmin';
    const [schedules, setSchedules] = useState([]);
    const [categories, setCategories] = useState([]);
    const [classes, setClasses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { addToast } = useToast();

    // Filters
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedClass, setSelectedClass] = useState('');

    useEffect(() => {
        fetchMetadata();
    }, []);

    useEffect(() => {
        fetchSchedules();
    }, [selectedCategory, selectedClass]);

    const fetchMetadata = async () => {
        try {
            const [catRes, classRes] = await Promise.all([
                api.get('/exams/categories'),
                api.get('/academics/classes')
            ]);
            setCategories(catRes.data.filter(c => c.status === 'Active'));
            setClasses(classRes.data);
        } catch (error) {
            console.error("Failed to load metadata");
        }
    };

    const fetchSchedules = async () => {
        setIsLoading(true);
        try {
            let url = '/exams/schedules?';
            if (selectedCategory) url += `examCategory=${selectedCategory}&`;
            if (selectedClass) url += `class=${selectedClass}&`;

            const res = await api.get(url);
            setSchedules(res.data);
        } catch (error) {
            addToast("Failed to load schedules", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Delete this schedule? You can't undo this if marks exist.")) return;
        try {
            await api.delete(`/exams/schedules/${id}`);
            addToast("Schedule deleted", "success");
            fetchSchedules();
        } catch (error) {
            addToast(error.response?.data?.message || "Failed to delete", "error");
        }
    };

    return (
        <div className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div className="flex gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-48">
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="w-full pl-3 pr-8 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none bg-white"
                        >
                            <option value="">All Categories</option>
                            {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                        </select>
                        <Filter className="absolute right-3 top-2.5 text-slate-400 pointer-events-none" size={16} />
                    </div>
                    <div className="relative flex-1 md:w-48">
                        <select
                            value={selectedClass}
                            onChange={(e) => setSelectedClass(e.target.value)}
                            className="w-full pl-3 pr-8 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none bg-white"
                        >
                            <option value="">All Classes</option>
                            {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                        </select>
                        <Filter className="absolute right-3 top-2.5 text-slate-400 pointer-events-none" size={16} />
                    </div>
                </div>

                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-indigo-700 shrink-0"
                >
                    <Plus size={16} /> Schedule Exam
                </button>
            </div>

            {isLoading ? (
                <div className="text-center py-10 text-slate-500">Loading schedules...</div>
            ) : schedules.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
                    <Calendar className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                    <h3 className="text-sm font-medium text-slate-900">No schedules found</h3>
                    <p className="text-sm text-slate-500 mt-1">Adjust your filters or create a new schedule.</p>
                </div>
            ) : (
                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-medium border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-3">Category</th>
                                <th className="px-4 py-3">Class/Sec</th>
                                <th className="px-4 py-3">Subject</th>
                                <th className="px-4 py-3">Date & Time</th>
                                <th className="px-4 py-3">Teacher</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 text-sm">
                            {schedules.map(sch => (
                                <tr key={sch._id} className="hover:bg-slate-50">
                                    <td className="px-4 py-3 font-medium text-slate-900">{sch.examCategory?.name}</td>
                                    <td className="px-4 py-3">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
                                            {sch.class?.name} - {sch.section}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <BookOpen size={14} className="text-slate-400" />
                                            {sch.subject?.name} <span className="text-slate-400 text-xs">({sch.subject?.code})</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-col">
                                            <span className="text-slate-900">{format(new Date(sch.date), 'MMM dd, yyyy')}</span>
                                            {(sch.startTime || sch.endTime) && (
                                                <span className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                                    <Clock size={12} /> {sch.startTime} - {sch.endTime}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-slate-600 flex items-center gap-1.5 mt-2 md:mt-0">
                                        <User size={14} className="text-slate-400" />
                                        {sch.scheduledBy?.name}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <button onClick={() => handleDelete(sch._id)} className="text-slate-400 hover:text-red-500 p-1 rounded-md hover:bg-red-50 transition-colors">
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <AddScheduleModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => { setIsModalOpen(false); fetchSchedules(); }}
                categories={categories}
                classes={classes}
            />
        </div>
    );
}

function AddScheduleModal({ isOpen, onClose, onSuccess, categories, classes }) {
    const { register, handleSubmit, reset, watch, formState: { errors } } = useForm();
    const { addToast } = useToast();
    const [subjects, setSubjects] = useState([]);

    const selectedClassId = watch('class');

    // In a real app, when a class is selected, fetch the subjects mapped to that class.
    // For simplicity, we'll fetch all subjects here, but you can refine this.
    useEffect(() => {
        if (isOpen) {
            api.get('/academics/subjects').then(res => setSubjects(res.data)).catch(console.error);
        }
    }, [isOpen]);

    const onSubmit = async (data) => {
        try {
            await api.post('/exams/schedules', data);
            addToast("Exam scheduled successfully", "success");
            reset();
            onSuccess();
        } catch (error) {
            addToast(error.response?.data?.message || "Failed to schedule exam", "error");
        }
    };

    if (!isOpen) return null;

    const selectedClassObj = classes.find(c => c._id === selectedClassId);
    const sections = selectedClassObj ? (selectedClassObj.sections || [selectedClassObj.sectionStr]) : [];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-slate-900">Schedule Exam</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Exam Category *</label>
                        <select
                            {...register('examCategory', { required: "Category is required" })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                            <option value="">Select Category</option>
                            {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                        </select>
                        {errors.examCategory && <p className="text-red-500 text-xs mt-1">{errors.examCategory.message}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Class *</label>
                            <select
                                {...register('class', { required: "Class is required" })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            >
                                <option value="">Select Class</option>
                                {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Section *</label>
                            <select
                                {...register('section', { required: "Section is required" })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                disabled={!selectedClassId}
                            >
                                <option value="">Select Section</option>
                                {sections.map((s, idx) => (
                                    <option key={idx} value={s.name || s}>{s.name || s}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Subject *</label>
                        <select
                            {...register('subject', { required: "Subject is required" })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                            <option value="">Select Subject</option>
                            {subjects.map(s => <option key={s._id} value={s._id}>{s.name} ({s.code})</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Date *</label>
                            <input
                                type="date"
                                {...register('date', { required: true })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Start Time</label>
                            <input
                                type="time"
                                {...register('startTime')}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">End Time</label>
                            <input
                                type="time"
                                {...register('endTime')}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Max Marks *</label>
                            <input
                                type="number"
                                {...register('maxMarks', { required: true, valueAsNumber: true })}
                                defaultValue={100}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Passing Marks *</label>
                            <input
                                type="number"
                                {...register('passingMarks', { required: true, valueAsNumber: true })}
                                defaultValue={35}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-6">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg font-medium">Cancel</button>
                        <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700">Save Schedule</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
