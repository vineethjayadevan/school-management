import React, { useState, useEffect } from 'react';
import {
    GraduationCap,
    ArrowRight,
    CheckCircle2,
    AlertTriangle,
    AlertCircle,
    Info,
    Search,
    RefreshCw,
    X,
    MessageSquare,
    Lock
} from 'lucide-react';
import api from '../../services/api';

const STEPS = ['Select Terms', 'Map Classes', 'Preview & Validate', 'Confirm'];

const PromotionWizard = () => {
    const [currentStep, setCurrentStep] = useState(0);
    const [academicYears, setAcademicYears] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Step 1 State
    const [termSelections, setTermSelections] = useState({ currentYearId: '', nextYearId: '' });
    const [fromYearStatus, setFromYearStatus] = useState(''); // Track if selected From Year is Closed

    // Step 2 State
    const [classes, setClasses] = useState([]);         // 'From' classes — only those with enrolled students
    const [classMappings, setClassMappings] = useState({}); // { fromClass: { toClass: 'Grade 1', isGraduating: false } }

    // Step 3 State
    const [previewData, setPreviewData] = useState([]);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [requiresFullFee, setRequiresFullFee] = useState(true);

    // Step 4 State
    const [executing, setExecuting] = useState(false);
    const [executionLog, setExecutionLog] = useState(null);
    const [closeFromYear, setCloseFromYear] = useState(false); // Admin opt-in to close year
    const [yearClosed, setYearClosed] = useState(false);       // Track if year was closed

    // Define strict progression order
    const CLASS_ORDER = [
        'Mont 1', 'Mont 2',
        'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5',
        'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10',
        'Grade 11', 'Grade 12'
    ];

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            // Fetch Years
            const { data: years } = await api.get('/academic-years');
            setAcademicYears(years);

            // ── From Classes ──────────────────────────────────────────────────
            // Only show classes that currently have enrolled active students.
            // These appear as the "Current:" cards in Step 2.
            const { data: students } = await api.get('/students');
            const activeClassesSet = new Set(students.filter(s => s.isActive).map(s => s.className));

            // Sort by predefined order
            const sortedActiveClasses = CLASS_ORDER.filter(cls => activeClassesSet.has(cls));

            // Append any custom classes not in CLASS_ORDER
            activeClassesSet.forEach(cls => {
                if (cls && !CLASS_ORDER.includes(cls)) sortedActiveClasses.push(cls);
            });

            setClasses(sortedActiveClasses);

            // Auto-select active year as current
            const activeYear = years.find(y => y.isActive);
            if (activeYear) {
                setTermSelections(prev => ({ ...prev, currentYearId: activeYear._id }));
                setFromYearStatus(activeYear.status || '');
            }

            // Initialize default class mappings (all blank — admin must choose explicitly)
            const initialMappings = {};
            sortedActiveClasses.forEach(cls => {
                initialMappings[cls] = { toClass: '', isGraduating: false };
            });
            setClassMappings(initialMappings);

        } catch (error) {
            console.error('Error fetching data:', error);
            showMessage('error', 'Failed to load initial data');
        } finally {
            setLoading(false);
        }
    };

    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: '', text: '' }), 4000);
    };

    const handleFromYearChange = (e) => {
        const selectedId = e.target.value;
        setTermSelections(prev => ({ ...prev, currentYearId: selectedId }));
        // Track the status of the selected From Year
        const year = academicYears.find(y => y._id === selectedId);
        setFromYearStatus(year?.status || '');
    };

    const handleNext = () => {
        if (currentStep === 0) {
            if (!termSelections.currentYearId || !termSelections.nextYearId) {
                return showMessage('error', 'Please select both terms.');
            }
            if (termSelections.currentYearId === termSelections.nextYearId) {
                return showMessage('error', 'Current and Next term cannot be the same.');
            }
            if (fromYearStatus === 'Closed') {
                return showMessage('error', 'The selected "From" academic year is already Closed. You cannot promote from a closed year.');
            }
        }
        if (currentStep === 1) {
            // Validation: Ensure at least one mapping is defined
            const hasMapping = Object.values(classMappings).some(m => m.isGraduating || m.toClass);
            if (!hasMapping) return showMessage('error', 'Please define at least one class promotion path.');

            loadPreview();
        }
        setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
    };

    const handleBack = () => {
        setCurrentStep(prev => Math.max(prev - 1, 0));
    };

    const loadPreview = async () => {
        setPreviewLoading(true);
        try {
            const { data } = await api.post('/promotion/preview', {
                currentYearId: termSelections.currentYearId,
                nextYearId: termSelections.nextYearId,
                classMappings
            });

            // The backend now provides an initial 'action' (Promote/Graduate) based on the mapping
            setPreviewData(data.students);
            setRequiresFullFee(data.requiresFullFee);
        } catch (error) {
            console.error('Preview error:', error);
            showMessage('error', 'Failed to load preview data for all mapped classes.');
        } finally {
            setPreviewLoading(false);
        }
    };

    const handleActionChange = (studentId, newAction) => {
        setPreviewData(prevData =>
            prevData.map(student => {
                if (student.studentId === studentId) {
                    // Provide a default remark if detaining and none exists
                    const newRemarks = newAction === 'Detain' && !student.remarks
                        ? 'Student held back'
                        : student.remarks;
                    return { ...student, action: newAction, remarks: newRemarks };
                }
                return student;
            })
        );
    };

    const handleRemarksChange = (studentId, newRemarks) => {
        setPreviewData(prevData =>
            prevData.map(student =>
                student.studentId === studentId ? { ...student, remarks: newRemarks } : student
            )
        );
    };

    const executePromotion = async () => {
        setExecuting(true);
        try {
            // Filter out 'Skip' actions. Only send those we are actually processing (Promote/Graduate or Detain)
            const studentsToProcess = previewData
                .filter(s => s.action !== 'Skip')
                .map(s => ({
                    studentId: s.studentId,
                    action: s.action,
                    remarks: s.remarks || ''
                }));

            if (studentsToProcess.length === 0) {
                setExecuting(false);
                return showMessage('error', 'No eligible students to promote.');
            }

            const { data } = await api.post('/promotion/execute', {
                currentYearId: termSelections.currentYearId,
                nextYearId: termSelections.nextYearId,
                classMappings,
                studentsToProcess,
                closeFromYear // Pass admin's choice to backend
            });

            setExecutionLog(data.log);
            setYearClosed(closeFromYear && data.fromYearClosed !== false);
            showMessage('success', 'Bulk promotion executed successfully!');
            setCurrentStep(4);

        } catch (error) {
            console.error('Execution error:', error);
            showMessage('error', 'Failed to execute promotion. Check logs.');
        } finally {
            setExecuting(false);
        }
    };

    const StatusBadge = ({ status }) => {
        const colors = {
            'Ready': 'bg-emerald-100 text-emerald-700 border-emerald-200',
            'Blocked': 'bg-red-100 text-red-700 border-red-200',
            'Warning': 'bg-amber-100 text-amber-700 border-amber-200'
        };
        const Icons = {
            'Ready': CheckCircle2,
            'Blocked': AlertCircle,
            'Warning': AlertTriangle
        };
        const Icon = Icons[status] || Info;

        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${colors[status] || 'bg-slate-100'}`}>
                <Icon size={14} />
                {status}
            </span>
        );
    };

    return (
        <div className="p-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <GraduationCap className="text-indigo-600" size={28} />
                    Student Promotion Wizard
                </h1>
                <p className="text-sm text-slate-500 mt-1">
                    Bulk promote students to the next academic year based on configurable criteria.
                </p>
            </div>

            {/* Stepper */}
            <div className="mb-8">
                <div className="flex items-center justify-between relative">
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 rounded-full z-0"></div>
                    <div
                        className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-indigo-600 rounded-full z-0 transition-all duration-300"
                        style={{ width: `${(Math.min(currentStep, 3) / 3) * 100}%` }}
                    ></div>

                    {STEPS.map((step, idx) => (
                        <div key={idx} className="relative z-10 flex flex-col items-center gap-2 bg-slate-50 px-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-colors ${currentStep > idx ? 'bg-indigo-600 border-indigo-600 text-white' :
                                currentStep === idx ? 'bg-white border-indigo-600 text-indigo-600 shadow-[0_0_0_4px_rgba(79,70,229,0.1)]' :
                                    'bg-white border-slate-300 text-slate-400'
                                }`}>
                                {currentStep > idx ? <CheckCircle2 size={18} /> : idx + 1}
                            </div>
                            <span className={`text-xs font-semibold ${currentStep >= idx ? 'text-slate-800' : 'text-slate-400'}`}>
                                {step}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {message.text && (
                <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 animate-in fade-in ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                    'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                    {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                    <span className="font-medium text-sm">{message.text}</span>
                </div>
            )}

            {/* Content Area */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 min-h-[400px]">

                {/* STEP 1: Select Terms */}
                {currentStep === 0 && (
                    <div className="p-8 animate-in slide-in-from-right-8 fade-in duration-300">
                        <h2 className="text-xl font-bold text-slate-800 mb-6">Select Assessment Terms</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                                <label className="block text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wider">Current Academic Year</label>
                                <select
                                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={termSelections.currentYearId}
                                    onChange={handleFromYearChange}
                                >
                                    <option value="" disabled>Select Current Year...</option>
                                    {academicYears.map(y => (
                                        <option key={y._id} value={y._id}>
                                            {y.name} {y.isActive ? '(Active)' : ''} {y.status === 'Closed' ? '🔒 Closed' : ''}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-slate-500 mt-2">
                                    The term students are currently enrolled in.
                                </p>
                                {/* Warning banner when From Year is Closed */}
                                {fromYearStatus === 'Closed' && (
                                    <div className="mt-3 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs">
                                        <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                                        <span><strong>Locked Year:</strong> This academic year was already closed after a promotion cycle. You cannot promote from it. Use the Academic Years page to reopen it if needed.</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col items-center justify-center md:hidden">
                                <ArrowRight className="text-slate-300 rotate-90" size={32} />
                            </div>

                            <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100">
                                <label className="block text-sm font-semibold text-indigo-900 mb-3 uppercase tracking-wider">Target Academic Year</label>
                                <select
                                    className="w-full px-4 py-3 bg-white border border-indigo-200 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={termSelections.nextYearId}
                                    onChange={(e) => setTermSelections(prev => ({ ...prev, nextYearId: e.target.value }))}
                                >
                                    <option value="" disabled>Select Target Year...</option>
                                    {academicYears.filter(y => y._id !== termSelections.currentYearId).map(y => (
                                        <option key={y._id} value={y._id}>
                                            {y.name}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-indigo-600/70 mt-2">
                                    The term students will be promoted into.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 2: Map Classes */}
                {currentStep === 1 && (
                    <div className="p-8 animate-in slide-in-from-right-8 fade-in duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-slate-800">Establish Class Mappings</h2>
                            <span className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                                {classes.length} Classes Found
                            </span>
                        </div>

                        <div className="bg-blue-50 text-blue-800 p-4 rounded-lg flex items-start gap-3 mb-6 text-sm border border-blue-100">
                            <Info size={20} className="mt-0.5 flex-shrink-0 text-blue-600" />
                            <p>
                                Define where students from each current class should be moved next term.
                                Leave a mapping blank if you do not wish to process that class right now.
                                Check "Graduate" for terminal classes.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                            {classes.map(cls => (
                                <div key={cls} className="border border-slate-200 rounded-xl p-4 bg-slate-50 hover:border-indigo-300 transition-colors">
                                    <div className="font-semibold text-slate-700 mb-3 pb-2 border-b border-slate-200">
                                        Current: <span className="text-indigo-600">{cls}</span>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="flex items-center gap-2 cursor-pointer pb-2">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                                                checked={classMappings[cls]?.isGraduating || false}
                                                onChange={(e) => setClassMappings(prev => ({
                                                    ...prev,
                                                    [cls]: { ...prev[cls], isGraduating: e.target.checked, toClass: e.target.checked ? '' : prev[cls].toClass }
                                                }))}
                                            />
                                            <span className="text-sm font-medium text-slate-700">Mark as Graduated/Alumni</span>
                                        </label>

                                        {!classMappings[cls]?.isGraduating && (
                                            <div>
                                                <div className="text-xs text-slate-500 mb-1 font-medium">Promote To:</div>
                                                <select
                                                    value={classMappings[cls]?.toClass || ''}
                                                    onChange={(e) => setClassMappings(prev => ({
                                                        ...prev,
                                                        [cls]: { ...prev[cls], toClass: e.target.value }
                                                    }))}
                                                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                                >
                                                    <option value="">Do not promote</option>
                                                    {/* Use CLASS_ORDER (not just enrolled classes) so any future class is a valid target */}
                                                    {CLASS_ORDER.filter(c => {
                                                        const currentIndex = CLASS_ORDER.indexOf(cls);
                                                        const targetIndex = CLASS_ORDER.indexOf(c);
                                                        // Only show classes strictly higher in the order
                                                        return targetIndex > currentIndex;
                                                    }).map(c => (
                                                        <option key={c} value={c}>{c}</option>
                                                    ))}
                                                    {/* Also include any custom classes not in CLASS_ORDER */}
                                                    {classes
                                                        .filter(c => !CLASS_ORDER.includes(c) && c !== cls)
                                                        .map(c => (
                                                            <option key={c} value={c}>{c}</option>
                                                        ))
                                                    }

                                                </select>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* STEP 3: Preview */}
                {currentStep === 2 && (
                    <div className="flex flex-col h-full animate-in slide-in-from-right-8 fade-in duration-300">
                        <div className="p-6 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 rounded-t-xl">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">Preview & Validate Eligibility</h2>
                                <p className="text-sm text-slate-500">
                                    Review students and system evaluation across all mapped classes before executing bulk promotion.
                                </p>
                            </div>
                        </div>

                        {!requiresFullFee && (
                            <div className="mx-6 mt-6 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg flex items-start gap-3 text-sm">
                                <AlertTriangle size={20} className="text-amber-600 flex-shrink-0" />
                                <div>
                                    <strong>Global Setting Disabled:</strong> The system is set to allow promotion even if fees are unpaid. Students with pending balances will be flagged as Warning, but will NOT be blocked.
                                </div>
                            </div>
                        )}

                        <div className="p-6 overflow-hidden flex-1">
                            {previewLoading ? (
                                <div className="h-64 flex flex-col items-center justify-center text-slate-500 gap-3">
                                    <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                                    <p className="font-medium animate-pulse">Evaluating eligibility rules...</p>
                                </div>
                            ) : previewData.length === 0 ? (
                                <div className="h-64 flex items-center justify-center text-slate-400 font-medium bg-slate-50 rounded-lg border border-dashed border-slate-200">
                                    No active students found in this class.
                                </div>
                            ) : (
                                <div className="border border-slate-200 rounded-lg overflow-x-auto max-h-[400px]">
                                    <table className="w-full text-left border-collapse whitespace-nowrap">
                                        <thead className="sticky top-0 bg-slate-100 z-10 shadow-sm">
                                            <tr className="text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">
                                                <th className="px-4 py-3 font-semibold">Adm No</th>
                                                <th className="px-4 py-3 font-semibold">Student Name</th>
                                                <th className="px-4 py-3 font-semibold">Current Class</th>
                                                <th className="px-4 py-3 font-semibold">Section</th>
                                                <th className="px-4 py-3 font-semibold">Target Class</th>
                                                <th className="px-4 py-3 font-semibold text-center">Fee Cleared</th>
                                                <th className="px-4 py-3 font-semibold">Status</th>
                                                <th className="px-4 py-3 font-semibold bg-indigo-50/50">Action (Override)</th>
                                                <th className="px-4 py-3 font-semibold bg-indigo-50/50">Remarks (Record Reason)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 text-sm">
                                            {previewData.map((student) => {
                                                const processingEnabled = student.action !== 'Skip';

                                                return (
                                                    <tr key={student.studentId} className={`transition-colors ${!processingEnabled ? 'bg-slate-50/50' : 'hover:bg-slate-50'}`}>
                                                        <td className={`px-4 py-3 font-medium ${!processingEnabled ? 'text-slate-400' : 'text-slate-600'}`}>#{student.admissionNo}</td>
                                                        <td className={`px-4 py-3 font-semibold ${!processingEnabled ? 'text-slate-500' : 'text-slate-800'}`}>{student.name}</td>
                                                        <td className={`px-4 py-3 font-medium ${!processingEnabled ? 'text-slate-400' : 'text-slate-600'}`}>{student.currentClass}</td>
                                                        <td className={`px-4 py-3 font-medium text-slate-500`}>{student.section}</td>
                                                        <td className={`px-4 py-3 font-medium ${!processingEnabled ? 'text-slate-400' :
                                                            student.action === 'Detain' ? 'text-red-500 line-through' : 'text-indigo-600'
                                                            }`}>
                                                            {student.targetClass}
                                                        </td>
                                                        <td className={`px-4 py-3 text-center ${!processingEnabled ? 'opacity-50' : ''}`}>
                                                            {student.financialClearance ? (
                                                                <CheckCircle2 size={18} className="text-emerald-500 mx-auto" />
                                                            ) : (
                                                                <AlertCircle size={18} className="text-red-500 mx-auto" />
                                                            )}
                                                        </td>
                                                        <td className={`px-4 py-3 ${!processingEnabled ? 'opacity-50' : ''}`}>
                                                            <StatusBadge status={student.status} />
                                                        </td>
                                                        <td className="px-4 py-3 bg-indigo-50/30">
                                                            <select
                                                                value={student.action}
                                                                onChange={(e) => handleActionChange(student.studentId, e.target.value)}
                                                                className={`px-3 py-1.5 text-xs font-semibold rounded-md border outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${student.action === 'Detain' ? 'bg-red-50 text-red-700 border-red-200' :
                                                                    student.action === 'Skip' ? 'bg-slate-100 text-slate-500 border-slate-300' :
                                                                        'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                                    }`}
                                                            >
                                                                <option value="Promote">Promote</option>
                                                                {student.targetClass === 'Graduated' && <option value="Graduate">Graduate</option>}
                                                                <option value="Detain">Detain (Hold Back)</option>
                                                                <option value="Skip">Skip / Ignore</option>
                                                            </select>
                                                        </td>
                                                        <td className="px-4 py-3 bg-indigo-50/30 min-w-[200px]">
                                                            {processingEnabled ? (
                                                                <div className="relative">
                                                                    <input
                                                                        type="text"
                                                                        value={student.remarks || ''}
                                                                        onChange={(e) => handleRemarksChange(student.studentId, e.target.value)}
                                                                        placeholder={student.action === 'Detain' ? "Required: Reason for detaining" : "Optional remarks"}
                                                                        className={`w-full pl-8 pr-3 py-1.5 text-xs border rounded-md outline-none focus:ring-2 transition-colors ${student.action === 'Detain' && !student.remarks
                                                                            ? 'border-red-300 focus:ring-red-500 bg-red-50/50'
                                                                            : 'border-slate-300 focus:ring-indigo-500 bg-white'
                                                                            }`}
                                                                    />
                                                                    <MessageSquare size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                                                </div>
                                                            ) : (
                                                                <span className="text-slate-400 text-xs italic">Skipped</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* STEP 4: Confirm */}
                {currentStep === 3 && (
                    <div className="p-8 flex flex-col items-center justify-center min-h-[400px] text-center animate-in slide-in-from-right-8 fade-in duration-300">
                        <div className="w-20 h-20 bg-indigo-100 text-indigo-600 flex items-center justify-center rounded-full mb-6 relative">
                            <span className="absolute -top-1 -right-1 w-6 h-6 bg-amber-400 text-white rounded-full flex items-center justify-center">
                                <AlertTriangle size={14} />
                            </span>
                            <RefreshCw size={36} />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">Ready to Execute Bulk Promotion</h2>
                        <p className="text-slate-500 max-w-lg mb-8">
                            You are about to execute the promotion logic for <strong className="text-slate-800">all mapped classes simultaneously</strong>.
                            This will alter academic histories and active class assignments.
                        </p>

                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 w-full max-w-md mb-8 text-left">
                            <ul className="space-y-3 text-sm text-slate-600 text-left">
                                <li className="flex justify-between items-center pb-2 border-b border-slate-200">
                                    <span className="font-medium">Mapped Classes to Process:</span>
                                    <span className="font-bold text-slate-800">{Object.keys(classMappings).filter(k => classMappings[k].toClass || classMappings[k].isGraduating).length}</span>
                                </li>
                                <li className="flex justify-between items-center pb-2 border-b border-slate-200">
                                    <span className="font-medium">Total Eligible Evaluated:</span>
                                    <span className="font-bold text-slate-800">{previewData.length}</span>
                                </li>
                                <li className="flex justify-between items-center mb-1">
                                    <span className="font-semibold text-slate-800">Final Action Breakdown:</span>
                                </li>
                                <div className="pl-4 space-y-1.5 border-l-2 border-indigo-100 mb-2">
                                    <li className="flex justify-between items-center text-xs">
                                        <span className="font-medium flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>Promoting / Graduating:</span>
                                        <span className="font-bold text-emerald-600">{previewData.filter(s => s.action === 'Promote' || s.action === 'Graduate').length}</span>
                                    </li>
                                    <li className="flex justify-between items-center text-xs">
                                        <span className="font-medium flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>Detaining (Holding Back):</span>
                                        <span className="font-bold text-red-600">{previewData.filter(s => s.action === 'Detain').length}</span>
                                    </li>
                                    <li className="flex justify-between items-center text-xs">
                                        <span className="font-medium flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>Skipping (Ignoring for now):</span>
                                        <span className="font-bold text-slate-500">{previewData.filter(s => s.action === 'Skip').length}</span>
                                    </li>
                                </div>
                                <li className="flex justify-between items-center pt-2 border-t border-slate-200 mt-2">
                                    <span className="font-medium">Expected Financial Blocks (On Hold):</span>
                                    <span className="font-bold text-amber-600">{previewData.filter(s => s.action !== 'Skip' && s.status === 'Blocked').length}</span>
                                </li>
                            </ul>
                        </div>

                        {/* Opt-in: Close Academic Year — NOT automatic */}
                        <div className="w-full max-w-md mb-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                            <label className="flex items-start gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={closeFromYear}
                                    onChange={(e) => setCloseFromYear(e.target.checked)}
                                    className="w-4 h-4 mt-0.5 text-red-600 border-slate-300 rounded focus:ring-red-500"
                                />
                                <span className="text-sm text-slate-700">
                                    <strong className="text-slate-900">Close the "From" Academic Year after execution</strong>
                                    <br />
                                    <span className="text-xs text-slate-500">Check this ONLY when you have finished promoting ALL classes for this year. Once closed, no further promotions can run from it (admin can reopen if needed).</span>
                                </span>
                            </label>
                        </div>

                        <button
                            onClick={executePromotion}
                            disabled={executing || previewData.length === 0}
                            className="w-full max-w-md bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-xl font-bold text-base shadow-[0_4px_14px_0_rgba(79,70,229,0.39)] transition-all flex justify-center items-center gap-3 disabled:opacity-50 disabled:shadow-none"
                        >
                            {executing ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Executing Database Updates...
                                </>
                            ) : (
                                "Confirm & Execute Promotion"
                            )}
                        </button>
                    </div>
                )}

                {/* STEP 5: Completion View */}
                {currentStep === 4 && executionLog && (
                    <div className="p-10 flex flex-col items-center justify-center min-h-[400px] text-center animate-in zoom-in-95 fade-in duration-500">
                        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 flex items-center justify-center rounded-full mb-6">
                            <CheckCircle2 size={40} />
                        </div>
                        <h2 className="text-3xl font-bold text-slate-800 mb-2">Promotion Successful!</h2>
                        <p className="text-slate-500 mb-8 max-w-md">
                            The requested class has been successfully processed. The student records and academic histories have been securely updated.
                        </p>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
                                <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Processed</span>
                                <span className="text-2xl font-black text-slate-700">{executionLog.totalStudentsProcessed}</span>
                            </div>
                            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl">
                                <span className="block text-xs font-bold text-emerald-600/70 uppercase tracking-wider mb-1">Promoted</span>
                                <span className="text-2xl font-black text-emerald-700">{executionLog.promotedCount}</span>
                            </div>
                            {executionLog.graduatedCount > 0 && (
                                <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl">
                                    <span className="block text-xs font-bold text-indigo-600/70 uppercase tracking-wider mb-1">Graduated</span>
                                    <span className="text-2xl font-black text-indigo-700">{executionLog.graduatedCount}</span>
                                </div>
                            )}
                            <div className="bg-red-50 border border-red-100 p-4 rounded-xl">
                                <span className="block text-xs font-bold text-red-600/70 uppercase tracking-wider mb-1">On Hold/Blocked</span>
                                <span className="text-2xl font-black text-red-700">{executionLog.onHoldCount}</span>
                            </div>
                        </div>

                        {/* Year was closed indicator */}
                        {yearClosed && (
                            <div className="w-full mb-6 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-sm">
                                <Lock size={16} className="flex-shrink-0" />
                                <span><strong>Academic year has been closed and locked.</strong> No further promotions can run from it.</span>
                            </div>
                        )}

                        <div className="mt-6 flex flex-wrap gap-3 justify-center">
                            {/* Process another class — fully resets the wizard */}
                            {!yearClosed && (
                                <button
                                    onClick={async () => {
                                        // Reset mapping state for a fresh run
                                        setExecutionLog(null);
                                        setPreviewData([]);
                                        setCloseFromYear(false);
                                        setYearClosed(false);
                                        // Re-fetch so new class list reflects recently promoted students
                                        await fetchInitialData();
                                        setCurrentStep(1); // Go to Map Classes (year is same)
                                    }}
                                    className="px-6 py-3 bg-white border-2 border-indigo-200 text-indigo-700 font-bold rounded-xl hover:bg-indigo-50 transition-colors"
                                >
                                    Promote Another Class (Same Year)
                                </button>
                            )}
                            {/* Go to students */}
                            <button
                                onClick={() => window.location.href = '/admin/students'}
                                className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-md hover:bg-indigo-700 transition-colors"
                            >
                                Go to Student Directory
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer Navigation */}
            {
                currentStep < 4 && (
                    <div className="mt-6 flex justify-between items-center">
                        <button
                            onClick={handleBack}
                            disabled={currentStep === 0 || executing}
                            className="px-6 py-2.5 font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 transition-colors disabled:opacity-50"
                        >
                            Back
                        </button>
                        {currentStep < 3 && (
                            <button
                                onClick={handleNext}
                                className="flex items-center gap-2 px-8 py-2.5 font-semibold text-white bg-indigo-600 rounded-lg shadow-md hover:bg-indigo-700 transition-colors"
                            >
                                {currentStep === 0 ? "Map Classes" : currentStep === 1 ? "Start Validation" : "Continue"}
                                <ArrowRight size={18} />
                            </button>
                        )}
                    </div>
                )
            }
        </div >
    );
};

export default PromotionWizard;
