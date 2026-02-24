import React, { useState, useEffect } from 'react';
import {
    GraduationCap,
    ArrowRight,
    CheckCircle2,
    AlertTriangle,
    AlertCircle,
    Info,
    Search,
    RefreshCw
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

    // Step 2 State
    const [classes, setClasses] = useState([]);
    const [classMappings, setClassMappings] = useState({}); // { fromClass: { toClass: 'Grade 1', isGraduating: false } }

    // Step 3 State
    const [previewData, setPreviewData] = useState([]);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [requiresFullFee, setRequiresFullFee] = useState(true);

    // Step 4 State
    const [executing, setExecuting] = useState(false);
    const [executionLog, setExecutionLog] = useState(null);

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

            // Fetch Classes (Use the predefined order, but only show those that exist in our system)
            // In a robust system this comes from a Class model, here we extract unique active classes
            const { data: students } = await api.get('/students');
            const activeClassesSet = new Set(students.filter(s => s.isActive).map(s => s.className));

            // Sort them based on our predefined order
            const sortedClasses = CLASS_ORDER.filter(cls => activeClassesSet.has(cls));

            // If there are any classes not in our predefined list, append them to the end
            activeClassesSet.forEach(cls => {
                if (cls && !CLASS_ORDER.includes(cls)) sortedClasses.push(cls);
            });

            setClasses(sortedClasses);

            // Auto-select active year as current
            const activeYear = years.find(y => y.isActive);
            if (activeYear) {
                setTermSelections(prev => ({ ...prev, currentYearId: activeYear._id }));
            }

            // Initialize default class mappings with smart auto-selection based on order
            const initialMappings = {};
            sortedClasses.forEach((cls, idx) => {
                // Auto-suggest next class if available, else blank
                const nextClass = idx + 1 < CLASS_ORDER.length ? CLASS_ORDER[idx + 1] : '';
                initialMappings[cls] = { toClass: nextClass, isGraduating: !nextClass };
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

    const handleNext = () => {
        if (currentStep === 0) {
            if (!termSelections.currentYearId || !termSelections.nextYearId) {
                return showMessage('error', 'Please select both terms.');
            }
            if (termSelections.currentYearId === termSelections.nextYearId) {
                return showMessage('error', 'Current and Next term cannot be the same.');
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

            // Only show students who haven't been promoted yet
            setPreviewData(data.students);
            setRequiresFullFee(data.requiresFullFee);
        } catch (error) {
            console.error('Preview error:', error);
            showMessage('error', 'Failed to load preview data for all mapped classes.');
        } finally {
            setPreviewLoading(false);
        }
    };

    const executePromotion = async () => {
        setExecuting(true);
        try {
            const studentsToProcess = previewData.map(s => s.studentId);

            if (studentsToProcess.length === 0) {
                setExecuting(false);
                return showMessage('error', 'No eligible students to promote.');
            }

            const { data } = await api.post('/promotion/execute', {
                currentYearId: termSelections.currentYearId,
                nextYearId: termSelections.nextYearId,
                classMappings,
                studentsToProcess
            });

            setExecutionLog(data.log); // Overall log
            showMessage('success', 'Bulk promotion executed successfully!');
            setCurrentStep(4); // Move to completion view

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
                                    onChange={(e) => setTermSelections(prev => ({ ...prev, currentYearId: e.target.value }))}
                                >
                                    <option value="" disabled>Select Current Year...</option>
                                    {academicYears.map(y => (
                                        <option key={y._id} value={y._id}>
                                            {y.name} {y.isActive ? '(Active)' : ''}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-slate-500 mt-2">
                                    The term students are currently enrolled in.
                                </p>
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
                                                    {classes.filter(c => {
                                                        const currentIndex = CLASS_ORDER.indexOf(cls);
                                                        const targetIndex = CLASS_ORDER.indexOf(c);
                                                        // If both are in the known order, only allow higher classes
                                                        // If either is unknown (e.g., custom class), just don't show the same class
                                                        if (currentIndex !== -1 && targetIndex !== -1) {
                                                            return targetIndex > currentIndex;
                                                        }
                                                        return c !== cls;
                                                    }).map(c => (
                                                        <option key={c} value={c}>{c}</option>
                                                    ))}
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
                                                <th className="px-4 py-3 font-semibold">Target Class</th>
                                                <th className="px-4 py-3 font-semibold text-center">Fee Cleared</th>
                                                <th className="px-4 py-3 font-semibold">Eligibility Status</th>
                                                <th className="px-4 py-3 font-semibold">Remarks</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 text-sm">
                                            {previewData.map((student) => (
                                                <tr key={student.studentId} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-4 py-3 text-slate-600 font-medium">#{student.admissionNo}</td>
                                                    <td className="px-4 py-3 text-slate-800 font-semibold">{student.name}</td>
                                                    <td className="px-4 py-3 text-slate-600 font-medium">{student.currentClass}</td>
                                                    <td className="px-4 py-3 text-indigo-600 font-medium">{student.targetClass}</td>
                                                    <td className="px-4 py-3 text-center">
                                                        {student.financialClearance ? (
                                                            <CheckCircle2 size={18} className="text-emerald-500 mx-auto" />
                                                        ) : (
                                                            <AlertCircle size={18} className="text-red-500 mx-auto" />
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <StatusBadge status={student.status} />
                                                    </td>
                                                    <td className="px-4 py-3 text-slate-500 text-xs">
                                                        {student.remarks || <span className="text-slate-300">-</span>}
                                                    </td>
                                                </tr>
                                            ))}
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
                                    <span className="font-medium">Total Students:</span>
                                    <span className="font-bold text-slate-800">{previewData.length}</span>
                                </li>
                                <li className="flex justify-between items-center pb-2 border-b border-slate-200">
                                    <span className="font-medium">Eligible (Ready):</span>
                                    <span className="font-bold text-emerald-600">{previewData.filter(s => s.status === 'Ready' || s.status === 'Warning').length}</span>
                                </li>
                                <li className="flex justify-between items-center">
                                    <span className="font-medium">Blocked:</span>
                                    <span className="font-bold text-red-600">{previewData.filter(s => s.status === 'Blocked').length}</span>
                                </li>
                            </ul>
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

                        <div className="mt-8 flex gap-4">
                            <button
                                onClick={() => {
                                    setCurrentStep(1); // Go back to mapping to select another class
                                    setExecutionLog(null);
                                    // re-fetch preview for next mapped class
                                }}
                                className="px-6 py-3 bg-white border-2 border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors"
                            >
                                Process Another Class
                            </button>
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
            {currentStep < 4 && (
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
            )}
        </div>
    );
};

export default PromotionWizard;
