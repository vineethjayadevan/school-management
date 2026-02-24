import { useState, useEffect } from 'react';
import { BookOpen, Layers, Plus, Edit2, Trash2, X, AlertCircle, Save, ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import api from '../../services/api';
import { useToast } from '../../components/ui/Toast';
import AcademicYears from '../admin/AcademicYears';

export default function Academics() {
    const [activeTab, setActiveTab] = useState('classes');
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [staff, setStaff] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const { addToast } = useToast();

    // Modals
    const [isClassModalOpen, setIsClassModalOpen] = useState(false);
    const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null); // For Editing

    // Initial Data Fetch
    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [classRes, subjectRes, staffRes] = await Promise.all([
                api.get('/academics/classes'),
                api.get('/academics/subjects'),
                api.get('/staff')
            ]);
            setClasses(classRes.data);
            setSubjects(subjectRes.data);
            setStaff(staffRes.data);
        } catch (error) {
            addToast("Failed to load academic data", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (type, id) => {
        if (!confirm("Are you sure you want to delete this item? This action cannot be undone.")) return;

        try {
            await api.delete(`/academics/${type}/${id}`);
            addToast(`${type === 'classes' ? 'Class' : 'Subject'} deleted successfully`, "success");
            fetchData();
        } catch (error) {
            addToast(`Failed to delete`, "error");
        }
    };

    const handleEdit = (type, item) => {
        setSelectedItem(item);
        if (type === 'classes') {
            setIsClassModalOpen(true);
        } else {
            setIsSubjectModalOpen(true);
        }
    };

    const handleAdd = (type) => {
        setSelectedItem(null); // Clear selection for Add
        if (type === 'classes') {
            setIsClassModalOpen(true);
        } else {
            setIsSubjectModalOpen(true);
        }
    };

    // Filter staff
    const teachers = staff.filter(s => s.role === 'Teacher' || s.category === 'Teacher');
    const nannies = staff.filter(s => s.role === 'Non-Teaching' || s.category === 'Non-Teaching');

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Academic Setup</h1>
                    <p className="text-slate-500">Manage classes, sections, and subjects.</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('classes')}
                    className={`flex items-center gap-2 px-6 py-3 font-medium text-sm transition-colors border-b-2 ${activeTab === 'classes'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                >
                    <Layers size={18} />
                    Classes & Sections
                </button>
                <button
                    onClick={() => setActiveTab('subjects')}
                    className={`flex items-center gap-2 px-6 py-3 font-medium text-sm transition-colors border-b-2 ${activeTab === 'subjects'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                >
                    <BookOpen size={18} />
                    Subjects
                </button>
                <button
                    onClick={() => setActiveTab('academic_years')}
                    className={`flex items-center gap-2 px-6 py-3 font-medium text-sm transition-colors border-b-2 ${activeTab === 'academic_years'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                        }`}
                >
                    <Calendar size={18} />
                    Academic Years
                </button>
            </div>

            {/* Content */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 min-h-[400px]">
                {isLoading ? (
                    <div className="flex justify-center items-center h-40 text-slate-500">Loading data...</div>
                ) : (
                    <>
                        {activeTab === 'classes' && (
                            <div className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-semibold text-slate-900">Class List</h3>
                                    <button onClick={() => handleAdd('classes')} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-indigo-700">
                                        <Plus size={16} /> Add Class
                                    </button>
                                </div>

                                {classes.length === 0 ? (
                                    <div className="text-center py-10 text-slate-500">No classes found. Add one to get started.</div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {classes.map((cls) => (
                                            <div key={cls._id} className="border border-slate-200 rounded-lg p-4 hover:border-indigo-200 transition-colors group bg-slate-50/50">
                                                <div className="flex justify-between items-start mb-4 border-b border-slate-200 pb-2">
                                                    <h4 className="font-bold text-lg text-slate-900">{cls.name}</h4>
                                                    <div className="flex gap-2">
                                                        <button onClick={() => handleEdit('classes', cls)} className="text-slate-400 hover:text-indigo-600 p-1 rounded hover:bg-indigo-50 transition-colors"><Edit2 size={16} /></button>
                                                        <button onClick={() => handleDelete('classes', cls._id)} className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors"><Trash2 size={16} /></button>
                                                    </div>
                                                </div>

                                                <div className="space-y-3">
                                                    {(cls.sections || []).map((sec, idx) => (
                                                        <div key={idx} className="bg-white p-3 rounded-md border border-slate-200 shadow-sm">
                                                            <div className="flex justify-between items-center mb-2">
                                                                <span className="font-semibold text-indigo-600">Section {sec.name}</span>
                                                            </div>
                                                            <div className="text-xs text-slate-500 space-y-1">
                                                                <div className="flex justify-between">
                                                                    <span>Teacher:</span>
                                                                    <span className="font-medium text-slate-700">{sec.classTeacher?.name || 'Not Assigned'}</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span>Aunty:</span>
                                                                    <span className="font-medium text-slate-700">{sec.nanny?.name || 'Not Assigned'}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {(!cls.sections || cls.sections.length === 0) && (
                                                        <div className="text-sm text-slate-400 italic text-center py-2">No sections added</div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'subjects' && (
                            <div className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-semibold text-slate-900">Subject List</h3>
                                    <button onClick={() => handleAdd('subjects')} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-indigo-700">
                                        <Plus size={16} /> Add Subject
                                    </button>
                                </div>

                                {subjects.length === 0 ? (
                                    <div className="text-center py-10 text-slate-500">No subjects found. Add one to get started.</div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                                                <tr>
                                                    <th className="px-6 py-3">Code</th>
                                                    <th className="px-6 py-3">Subject Name</th>
                                                    <th className="px-6 py-3">Type</th>
                                                    <th className="px-6 py-3 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {subjects.map((sub) => (
                                                    <tr key={sub._id} className="hover:bg-slate-50">
                                                        <td className="px-6 py-4 text-slate-500 font-mono text-xs">{sub.code}</td>
                                                        <td className="px-6 py-4 font-medium text-slate-900">{sub.name}</td>
                                                        <td className="px-6 py-4">
                                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${sub.type === 'Core' ? 'bg-indigo-100 text-indigo-700' : 'bg-purple-100 text-purple-700'}`}>
                                                                {sub.type}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            {/* Only allow deleting subjects for now as per previous logic, or implement edit later */}
                                                            <button onClick={() => handleDelete('subjects', sub._id)} className="text-slate-400 hover:text-red-600"><Trash2 size={16} /></button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'academic_years' && (
                            <div className="animate-in fade-in duration-300">
                                <AcademicYears isInline={true} />
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Modals */}
            <AddClassModal
                isOpen={isClassModalOpen}
                onClose={() => setIsClassModalOpen(false)}
                onSuccess={() => { setIsClassModalOpen(false); fetchData(); }}
                initialData={selectedItem}
                teachers={teachers}
                nannies={nannies}
            />
            <AddSubjectModal
                isOpen={isSubjectModalOpen}
                onClose={() => setIsSubjectModalOpen(false)}
                onSuccess={() => { setIsSubjectModalOpen(false); fetchData(); }}
                initialData={selectedItem}
            />
        </div>
    );
}

function AddClassModal({ isOpen, onClose, onSuccess, initialData, teachers, nannies }) {
    const { register, control, handleSubmit, reset, setValue, formState: { errors } } = useForm({
        defaultValues: {
            name: '',
            sections: [{ name: '', classTeacher: '', nanny: '' }]
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "sections"
    });

    const { addToast } = useToast();

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setValue('name', initialData.name);
                // Map existing sections if they exist, ensuring IDs are used for selects
                const mappedSections = (initialData.sections || []).map(sec => ({
                    name: sec.name || sec, // Handle legacy string sections if any remain
                    classTeacher: sec.classTeacher?._id || sec.classTeacher || '',
                    nanny: sec.nanny?._id || sec.nanny || ''
                }));
                if (mappedSections.length > 0) {
                    setValue('sections', mappedSections);
                } else {
                    setValue('sections', []);
                }
            } else {
                reset({
                    name: '',
                    sections: [{ name: '', classTeacher: '', nanny: '' }]
                });
            }
        }
    }, [isOpen, initialData, reset, setValue]);

    const onSubmit = async (data) => {
        try {
            if (initialData) {
                await api.put(`/academics/classes/${initialData._id}`, data);
                addToast("Class updated successfully", "success");
            } else {
                await api.post('/academics/classes', data);
                addToast("Class added successfully", "success");
            }
            onSuccess();
        } catch (error) {
            addToast(error.response?.data?.message || "Failed to save class", "error");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h2 className="text-xl font-bold text-slate-900">{initialData ? 'Edit Class' : 'Add New Class'}</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Class Name</label>
                        <input
                            {...register('name', { required: "Class Name is required" })}
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="e.g. Grade 1"
                        />
                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <label className="block text-sm font-medium text-slate-700">Sections</label>
                            <button
                                type="button"
                                onClick={() => append({ name: '', classTeacher: '', nanny: '' })}
                                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                            >
                                <Plus size={16} /> Add Section
                            </button>
                        </div>

                        <div className="space-y-4">
                            {fields.map((field, index) => (
                                <div key={field.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200 relative group">
                                    <button
                                        type="button"
                                        onClick={() => remove(index)}
                                        className="absolute top-2 right-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Remove Section"
                                    >
                                        <X size={16} />
                                    </button>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 mb-1">Section Name</label>
                                            <input
                                                {...register(`sections.${index}.name`, { required: true })}
                                                className="w-full px-3 py-2 border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                                placeholder="e.g. A"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 mb-1">Class Teacher</label>
                                            <select
                                                {...register(`sections.${index}.classTeacher`)}
                                                className="w-full px-3 py-2 border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                            >
                                                <option value="">Select Teacher</option>
                                                {teachers.map(t => (
                                                    <option key={t._id} value={t._id}>{t.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-500 mb-1">Aunty (Nanny)</label>
                                            <select
                                                {...register(`sections.${index}.nanny`)}
                                                className="w-full px-3 py-2 border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                            >
                                                <option value="">Select Aunty</option>
                                                {nannies.map(n => (
                                                    <option key={n._id} value={n._id}>{n.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {fields.length === 0 && (
                                <div className="text-center py-4 text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-lg">
                                    No sections added. Click "Add Section" to create one.
                                </div>
                            )}
                        </div>
                    </div>
                </form>

                <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-medium transition-colors">Cancel</button>
                    <button onClick={handleSubmit(onSubmit)} className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 shadow-sm transition-colors flex items-center gap-2">
                        <Save size={18} />
                        {initialData ? 'Update Class' : 'Create Class'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function AddSubjectModal({ isOpen, onClose, onSuccess, initialData }) {
    const { register, handleSubmit, reset, setValue } = useForm();
    const { addToast } = useToast();

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setValue('code', initialData.code);
                setValue('type', initialData.type);
                setValue('name', initialData.name);
                setValue('description', initialData.description || '');
            } else {
                reset({ code: '', type: 'Core', name: '', description: '' });
            }
        }
    }, [isOpen, initialData, reset, setValue]);

    const onSubmit = async (data) => {
        try {
            await api.post('/academics/subjects', data);
            addToast("Subject added successfully", "success");
            onSuccess();
        } catch (error) {
            addToast(error.response?.data?.message || "Failed to add subject", "error");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl w-full max-w-md shadow-2xl overflow-hidden p-6 animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-slate-900">Add New Subject</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                </div>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Subject Code</label>
                            <input
                                {...register('code', { required: true })}
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="e.g. MATH101"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                            <select
                                {...register('type')}
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            >
                                <option value="Core">Core</option>
                                <option value="Elective">Elective</option>
                                <option value="Co-Curricular">Co-Curricular</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Subject Name</label>
                        <input
                            {...register('name', { required: true })}
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="e.g. Mathematics"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                        <textarea
                            {...register('description')}
                            rows="3"
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="Optional description..."
                        ></textarea>
                    </div>
                    <div className="pt-4 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-lg font-medium">Cancel</button>
                        <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700">Add Subject</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
