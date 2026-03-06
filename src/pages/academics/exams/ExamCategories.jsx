import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Calendar, FileText, X, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import api from '../../../services/api';
import { useToast } from '../../../components/ui/Toast';

export default function ExamCategories() {
    const [categories, setCategories] = useState([]);
    const [academicYears, setAcademicYears] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const { addToast } = useToast();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [catRes, yearRes] = await Promise.all([
                api.get('/exams/categories'),
                api.get('/academic-years')
            ]);
            setCategories(catRes.data);
            setAcademicYears(yearRes.data);
        } catch (error) {
            addToast("Failed to load exam categories", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure? This action cannot be undone and will fail if exams are scheduled under this category.")) return;

        try {
            await api.delete(`/exams/categories/${id}`);
            addToast("Category deleted successfully", "success");
            fetchData();
        } catch (error) {
            addToast(error.response?.data?.message || "Failed to delete category", "error");
        }
    };

    const handleEdit = (category) => {
        setEditingCategory(category);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingCategory(null);
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-lg font-bold text-slate-800">Exam Categories</h2>
                    <p className="text-sm text-slate-500">Configure terms and examination types for the academic year.</p>
                </div>
                <button
                    onClick={() => { setEditingCategory(null); setIsModalOpen(true); }}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-indigo-700 transition-colors"
                >
                    <Plus size={16} /> Create Category
                </button>
            </div>

            {isLoading ? (
                <div className="flex justify-center p-8 text-slate-500">
                    <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                    Loading categories...
                </div>
            ) : categories.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                    <FileText className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                    <h3 className="text-sm font-medium text-slate-900">No exam categories configured</h3>
                    <p className="text-sm text-slate-500 mt-1">Get started by creating your first exam category.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
                    {categories.map((cat) => (
                        <div key={cat._id} className="group border border-slate-200 rounded-xl p-5 hover:shadow-md transition-all bg-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                <button
                                    onClick={() => handleEdit(cat)}
                                    className="p-1.5 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 rounded-md transition-colors"
                                    title="Edit"
                                >
                                    <Edit2 size={14} />
                                </button>
                                <button
                                    onClick={() => handleDelete(cat._id)}
                                    className="p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-md transition-colors"
                                    title="Delete"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>

                            <div className="mb-3">
                                <h3 className="font-bold text-slate-900 text-lg pr-12">{cat.name}</h3>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold mt-1 uppercase tracking-wider ${cat.status === 'Active' ? 'bg-green-100 text-green-700' :
                                    cat.status === 'Completed' ? 'bg-slate-100 text-slate-700' :
                                        'bg-yellow-100 text-yellow-700'
                                    }`}>
                                    {cat.status}
                                </span>
                            </div>

                            {cat.description && <p className="text-sm text-slate-500 mb-4 line-clamp-2 h-10">{cat.description}</p>}

                            <div className="space-y-2 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                <div className="flex justify-between items-center">
                                    <span className="flex items-center gap-2 text-slate-500"><Calendar size={13} /> Year</span>
                                    <span className="font-semibold text-slate-800">{cat.academicYear?.name || 'Unknown'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="flex items-center gap-2 text-slate-500"><FileText size={13} /> Weightage</span>
                                    <span className="font-bold text-indigo-600">{cat.weightage}%</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <CategoryModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSuccess={() => { handleCloseModal(); fetchData(); }}
                academicYears={academicYears}
                category={editingCategory}
            />
        </div>
    );
}

function CategoryModal({ isOpen, onClose, onSuccess, academicYears, category }) {
    const isEdit = !!category;
    const { register, handleSubmit, reset, formState: { errors } } = useForm();
    const [isSaving, setIsSaving] = useState(false);
    const { addToast } = useToast();

    // Reset form when modal opens or category changes
    useEffect(() => {
        if (isOpen) {
            if (category) {
                reset({
                    name: category.name,
                    academicYear: category.academicYear?._id || '',
                    weightage: category.weightage || 100,
                    status: category.status || 'Active',
                    description: category.description || ''
                });
            } else {
                reset({
                    name: '',
                    academicYear: '',
                    weightage: 100,
                    status: 'Active',
                    description: ''
                });
            }
        }
    }, [isOpen, category, reset]);

    const onSubmit = async (data) => {
        setIsSaving(true);
        try {
            if (isEdit) {
                await api.put(`/exams/categories/${category._id}`, data);
                addToast("Exam category updated successfully", "success");
            } else {
                await api.post('/exams/categories', data);
                addToast("Exam category created successfully", "success");
            }
            onSuccess();
        } catch (error) {
            addToast(error.response?.data?.message || `Failed to ${isEdit ? 'update' : 'create'} category`, "error");
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h2 className="text-xl font-bold text-slate-900">{isEdit ? 'Edit' : 'Create'} Exam Category</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-lg transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Category Name *</label>
                        <input
                            {...register('name', { required: "Category name is required" })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                            placeholder="e.g. Mid-Term 2024"
                        />
                        {errors.name && <p className="text-red-500 text-xs mt-1 font-medium">{errors.name.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Academic Year *</label>
                        <select
                            {...register('academicYear', { required: "Academic Year is required" })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                        >
                            <option value="">Select Academic Year</option>
                            {academicYears.map(year => (
                                <option key={year._id} value={year._id}>{year.name}</option>
                            ))}
                        </select>
                        {errors.academicYear && <p className="text-red-500 text-xs mt-1 font-medium">{errors.academicYear.message}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Weightage (%)</label>
                            <input
                                type="number"
                                {...register('weightage', { min: 0, max: 100 })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Status</label>
                            <select
                                {...register('status')}
                                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                            >
                                <option value="Draft">Draft</option>
                                <option value="Active">Active</option>
                                <option value="Completed">Completed</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Description</label>
                        <textarea
                            {...register('description')}
                            rows="2"
                            className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none resize-none transition-all"
                            placeholder="Briefly describe this exam's scope..."
                        ></textarea>
                    </div>

                    <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-xl font-semibold transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50"
                        >
                            {isSaving ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <Save size={18} />
                            )}
                            {isEdit ? 'Update' : 'Save'} Category
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
