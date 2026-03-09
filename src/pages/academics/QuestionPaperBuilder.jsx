import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft, Plus, Trash2, GripVertical, Check, X } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const QUESTION_TYPES = [
    { value: 'ShortAnswer', label: 'Short Answer' },
    { value: 'LongAnswer', label: 'Long Answer' },
    { value: 'MCQ', label: 'Multiple Choice (MCQ)' },
    { value: 'TrueFalse', label: 'True / False' }
];

export default function QuestionPaperBuilder() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [examCategories, setExamCategories] = useState([]);

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        classId: '',
        subject: '',
        examType: '',
        academicYear: '', // Will be set dynamically by fetchInitialData
        examDate: '',
        duration: '',
        instructions: '',
        status: 'Draft',
        sections: [
            {
                title: 'Section A',
                instructions: '',
                questions: [
                    { text: '', type: 'ShortAnswer', marks: 1, options: [''], correctAnswer: '' }
                ]
            }
        ]
    });

    useEffect(() => {
        fetchInitialData();
        if (id) {
            fetchQuestionPaper();
        }
    }, [id]);

    const fetchInitialData = async () => {
        try {
            const [classesRes, subjectsRes, examTypesRes, academicYearsRes] = await Promise.all([
                api.get('/academics/classes'),
                api.get('/academics/subjects'),
                api.get('/exams/categories'),
                api.get('/academic-years')
            ]);

            setClasses(classesRes.data || []);
            setSubjects(subjectsRes.data || []);
            setExamCategories(examTypesRes.data || []);

            if (!id && academicYearsRes.data?.length > 0) {
                const activeYear = academicYearsRes.data.find(y => y.isActive);
                if (activeYear) {
                    setFormData(prev => ({ ...prev, academicYear: activeYear.name }));
                }
            }
        } catch (error) {
            console.error('Error fetching initial data:', error);
            // Non-blocking error
        }
    };

    const fetchQuestionPaper = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/question-papers/${id}`);
            const data = res.data;
            if (data.examDate) {
                data.examDate = new Date(data.examDate).toISOString().split('T')[0];
            } else {
                data.examDate = '';
            }
            if (data.classId && typeof data.classId === 'object') {
                data.classId = data.classId._id;
            }
            setFormData(data);
        } catch (error) {
            console.error('Error fetching paper:', error);
            toast.error('Failed to load question paper');
            navigate('/teacher/question-papers');
        } finally {
            setLoading(false);
        }
    };

    const calculateTotalMarks = () => {
        let total = 0;
        formData.sections.forEach(sec => {
            sec.questions.forEach(q => {
                total += Number(q.marks) || 0;
            });
        });
        return total;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Section Management
    const addSection = () => {
        setFormData(prev => ({
            ...prev,
            sections: [
                ...prev.sections,
                { title: `Section ${String.fromCharCode(65 + prev.sections.length)}`, instructions: '', questions: [] }
            ]
        }));
    };

    const removeSection = (sIndex) => {
        setFormData(prev => {
            const newSections = [...prev.sections];
            newSections.splice(sIndex, 1);
            return { ...prev, sections: newSections };
        });
    };

    const updateSection = (sIndex, field, value) => {
        const newSections = [...formData.sections];
        newSections[sIndex][field] = value;
        setFormData({ ...formData, sections: newSections });
    };

    // Question Management
    const addQuestion = (sIndex) => {
        const newSections = [...formData.sections];
        newSections[sIndex].questions.push({ text: '', type: 'ShortAnswer', marks: 1, options: [''], correctAnswer: '' });
        setFormData({ ...formData, sections: newSections });
    };

    const removeQuestion = (sIndex, qIndex) => {
        const newSections = [...formData.sections];
        newSections[sIndex].questions.splice(qIndex, 1);
        setFormData({ ...formData, sections: newSections });
    };

    const updateQuestion = (sIndex, qIndex, field, value) => {
        const newSections = [...formData.sections];
        newSections[sIndex].questions[qIndex][field] = value;

        // Auto-configure options if type changes
        if (field === 'type') {
            if (value === 'MCQ') {
                newSections[sIndex].questions[qIndex].options = ['Option A', 'Option B', 'Option C', 'Option D'];
            } else if (value === 'TrueFalse') {
                newSections[sIndex].questions[qIndex].options = ['True', 'False'];
            } else {
                newSections[sIndex].questions[qIndex].options = [];
            }
        }

        setFormData({ ...formData, sections: newSections });
    };

    const updateOption = (sIndex, qIndex, oIndex, value) => {
        const newSections = [...formData.sections];
        newSections[sIndex].questions[qIndex].options[oIndex] = value;
        setFormData({ ...formData, sections: newSections });
    };

    const addOption = (sIndex, qIndex) => {
        const newSections = [...formData.sections];
        newSections[sIndex].questions[qIndex].options.push(`Option ${newSections[sIndex].questions[qIndex].options.length + 1}`);
        setFormData({ ...formData, sections: newSections });
    };

    const removeOption = (sIndex, qIndex, oIndex) => {
        const newSections = [...formData.sections];
        newSections[sIndex].questions[qIndex].options.splice(oIndex, 1);
        setFormData({ ...formData, sections: newSections });
    };

    // Save Action
    const handleSave = async (statusOverride) => {
        if (!formData.title || !formData.classId || !formData.subject || !formData.examType) {
            toast.error('Title, Class, Subject, and Exam Type are required');
            return;
        }

        setSaving(true);
        const payload = { ...formData };
        if (statusOverride) {
            payload.status = statusOverride;
        }

        if (!payload.examDate) {
            payload.examDate = null;
        }

        try {
            if (id) {
                await api.put(`/question-papers/${id}`, payload);
                toast.success('Question paper updated');
            } else {
                const res = await api.post('/question-papers', payload);
                toast.success('Question paper created');
                navigate(`/teacher/question-papers/edit/${res.data._id}`, { replace: true });
            }
            if (statusOverride === 'Published') {
                navigate('/teacher/question-papers');
            }
        } catch (error) {
            console.error('Save error:', error);
            toast.error(error.response?.data?.message || 'Failed to save question paper');
        } finally {
            setSaving(false);
            if (statusOverride) {
                setFormData(prev => ({ ...prev, status: statusOverride }));
            }
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500 flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>;

    const totalMarks = calculateTotalMarks();

    return (
        <div className="space-y-6 pb-20">
            {/* Header / Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sticky top-0 bg-slate-50/90 backdrop-blur-md py-4 z-40 border-b border-slate-200 -mx-6 px-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/teacher/question-papers')}
                        className="p-2 hover:bg-slate-200 rounded-lg transition-colors text-slate-600"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">
                            {id ? 'Edit Question Paper' : 'Build Question Paper'}
                        </h1>
                        <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium border ${formData.status === 'Published'
                                ? 'bg-green-100 text-green-700 border-green-200'
                                : 'bg-amber-100 text-amber-700 border-amber-200'
                                }`}>
                                {formData.status}
                            </span>
                            <span className="text-sm font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                                Total Marks: {totalMarks}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={() => handleSave('Draft')}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                        <Save size={18} />
                        <span>Save Draft</span>
                    </button>
                    <button
                        onClick={() => handleSave('Published')}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                    >
                        <Check size={18} />
                        <span>{saving ? 'Publishing...' : 'Publish Paper'}</span>
                    </button>
                </div>
            </div>

            {/* Paper Metadata Form */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">Paper Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="lg:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Academic Year</label>
                        <input
                            type="text"
                            value={formData.academicYear || 'Loading...'}
                            disabled
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-500 outline-none cursor-not-allowed"
                        />
                    </div>
                    <div className="lg:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Paper Title *</label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="e.g., Mid-Term Examination 2024"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Class *</label>
                        <select
                            name="classId"
                            value={formData.classId}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            required
                        >
                            <option value="">Select Class</option>
                            {classes.map(c => (
                                <option key={c._id} value={c._id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Subject *</label>
                        <select
                            name="subject"
                            value={formData.subject}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            required
                        >
                            <option value="">Select Subject</option>
                            {subjects.map(s => (
                                <option key={s._id} value={s.name}>{s.name} {s.code ? `(${s.code})` : ''}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Exam Type *</label>
                        <select
                            name="examType"
                            value={formData.examType}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            required
                        >
                            <option value="">Select Exam Type</option>
                            {examCategories.map(cat => (
                                <option key={cat._id} value={cat.name}>{cat.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Exam Date</label>
                        <input
                            type="date"
                            name="examDate"
                            value={formData.examDate}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Duration</label>
                        <input
                            type="text"
                            name="duration"
                            value={formData.duration}
                            onChange={handleChange}
                            placeholder="e.g., 2 Hours"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                    <div className="lg:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">General Instructions</label>
                        <input
                            type="text"
                            name="instructions"
                            value={formData.instructions}
                            onChange={handleChange}
                            placeholder="e.g., All questions are compulsory."
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* Sections Builder */}
            <div className="space-y-6">
                {formData.sections.map((section, sIndex) => (
                    <div key={sIndex} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden group">
                        {/* Section Header */}
                        <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-start gap-4">
                            <div className="cursor-move text-slate-400 mt-2">
                                <GripVertical size={20} />
                            </div>
                            <div className="flex-1 space-y-3">
                                <div className="flex justify-between items-center gap-4">
                                    <input
                                        type="text"
                                        value={section.title}
                                        onChange={(e) => updateSection(sIndex, 'title', e.target.value)}
                                        placeholder="Section Title (e.g., Section A - Objective)"
                                        className="font-semibold text-lg bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:bg-white outline-none px-1 py-0.5 transition-colors w-full sm:w-1/2"
                                    />
                                    <button
                                        onClick={() => removeSection(sIndex)}
                                        className="text-red-500 hover:bg-red-50 p-1.5 rounded transition-colors opacity-0 group-hover:opacity-100"
                                        title="Delete Section"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                                <input
                                    type="text"
                                    value={section.instructions}
                                    onChange={(e) => updateSection(sIndex, 'instructions', e.target.value)}
                                    placeholder="Section Instructions (Optional)"
                                    className="text-sm text-slate-600 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:bg-white outline-none px-1 py-0.5 transition-colors w-full"
                                />
                            </div>
                        </div>

                        {/* Questions List */}
                        <div className="p-4 space-y-4">
                            {section.questions.map((question, qIndex) => (
                                <div key={qIndex} className="flex gap-3 items-start relative pb-4 border-b border-slate-100 last:border-0 hover:bg-slate-50/50 p-2 rounded -mx-2 transition-colors">
                                    <div className="font-medium text-slate-400 w-6 flex-shrink-0 pt-2 text-right">
                                        Q{qIndex + 1}.
                                    </div>
                                    <div className="flex-1 space-y-3">
                                        <div className="flex flex-col sm:flex-row gap-2 items-start">
                                            <textarea
                                                value={question.text}
                                                onChange={(e) => updateQuestion(sIndex, qIndex, 'text', e.target.value)}
                                                placeholder="Enter question text here..."
                                                className="flex-1 w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none min-h-[60px] resize-y"
                                            />
                                            <div className="flex gap-2 w-full sm:w-auto flex-shrink-0">
                                                <select
                                                    value={question.type}
                                                    onChange={(e) => updateQuestion(sIndex, qIndex, 'type', e.target.value)}
                                                    className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white min-w-[140px]"
                                                >
                                                    {QUESTION_TYPES.map(qt => (
                                                        <option key={qt.value} value={qt.value}>{qt.label}</option>
                                                    ))}
                                                </select>
                                                <div className="relative w-24">
                                                    <input
                                                        type="number"
                                                        value={question.marks}
                                                        onChange={(e) => updateQuestion(sIndex, qIndex, 'marks', e.target.value)}
                                                        min="0"
                                                        step="0.5"
                                                        className="w-full pl-3 pr-8 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-right font-semibold text-indigo-600 bg-indigo-50"
                                                    />
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-indigo-400">mk</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Options handling for MCQ/TrueFalse */}
                                        {['MCQ', 'TrueFalse'].includes(question.type) && (
                                            <div className="pl-4 space-y-2 border-l-2 border-slate-200 ml-2">
                                                {question.options.map((option, oIndex) => (
                                                    <div key={oIndex} className="flex items-center gap-2">
                                                        <span className="w-6 text-sm font-medium text-slate-400">
                                                            {String.fromCharCode(65 + oIndex)}.
                                                        </span>
                                                        <input
                                                            type="text"
                                                            value={option}
                                                            onChange={(e) => updateOption(sIndex, qIndex, oIndex, e.target.value)}
                                                            className="flex-1 px-3 py-1.5 border border-slate-200 rounded-md focus:ring-1 focus:ring-indigo-500 outline-none text-sm"
                                                            placeholder={`Option ${oIndex + 1}`}
                                                            disabled={question.type === 'TrueFalse'} // Prevent editing True/False defaults 
                                                        />
                                                        {question.type === 'MCQ' && (
                                                            <button
                                                                onClick={() => removeOption(sIndex, qIndex, oIndex)}
                                                                className="text-slate-400 hover:text-red-500 p-1 rounded"
                                                            >
                                                                <X size={16} />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                                {question.type === 'MCQ' && (
                                                    <button
                                                        onClick={() => addOption(sIndex, qIndex)}
                                                        className="text-xs text-indigo-600 font-medium flex items-center gap-1 hover:text-indigo-800 ml-8"
                                                    >
                                                        <Plus size={14} /> Add Option
                                                    </button>
                                                )}
                                            </div>
                                        )}

                                        {/* Optional Correct Answer input
                                        <div className="mt-2 text-sm">
                                            <label className="text-slate-500 mr-2">Correct Answer (Optional):</label>
                                            <input 
                                                type="text" 
                                                value={question.correctAnswer || ''}
                                                onChange={(e) => updateQuestion(sIndex, qIndex, 'correctAnswer', e.target.value)}
                                                className="border-b border-slate-300 outline-none px-1 py-0.5 focus:border-indigo-500 bg-transparent w-full sm:w-auto"
                                                placeholder="For reference or auto-grading"
                                            />
                                        </div> */}

                                    </div>
                                    <button
                                        onClick={() => removeQuestion(sIndex, qIndex)}
                                        className="text-slate-400 hover:text-red-500 p-2 rounded hover:bg-red-50 transition-colors mt-2"
                                        title="Remove Question"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}

                            <button
                                onClick={() => addQuestion(sIndex)}
                                className="w-full py-3 border-2 border-dashed border-slate-300 text-slate-500 font-medium rounded-lg hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2"
                            >
                                <Plus size={18} /> Add Question
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <button
                onClick={addSection}
                className="w-full py-4 bg-slate-100 text-slate-600 font-medium rounded-xl hover:bg-slate-200 transition-colors flex items-center justify-center gap-2 shadow-sm border border-slate-200"
            >
                <Plus size={20} /> Add New Section
            </button>

            {/* Bottom floating summary */}
            <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-white border-t border-slate-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-40 flex justify-between items-center sm:hidden">
                <div className="font-bold text-slate-800">Total: <span className="text-indigo-600">{totalMarks} Marks</span></div>
                <button
                    onClick={() => handleSave('Published')}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold"
                >
                    <Save size={18} /> Save
                </button>
            </div>
        </div>
    );
}
