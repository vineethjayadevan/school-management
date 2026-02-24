import { useState, useEffect } from 'react';
import { X, AlertTriangle, FileText, CheckCircle2, ChevronRight, ChevronLeft, Loader2, ShieldAlert } from 'lucide-react';
import api from '../../services/api';
import { generateTC } from '../../utils/tcGenerator';
import { useToast } from '../ui/Toast';

const STEPS = ['Pre-Issue Check', 'TC Details', 'Preview & Confirm'];

const LEAVING_REASONS = [
    'Parent Transfer / Relocation',
    'Admission to another school',
    'Course Completed / Passed Out',
    'Financial Difficulties',
    'Health Reasons',
    'Personal / Family Reasons',
    'Discontinuation of Studies',
    'Other',
];

const CONDUCT_OPTIONS = ['Excellent', 'Good', 'Satisfactory', 'Fair'];

const Field = ({ label, value }) => (
    <div>
        <p className="text-xs text-slate-400 uppercase font-semibold tracking-wide">{label}</p>
        <p className="text-sm font-medium text-slate-800 mt-0.5">{value || '—'}</p>
    </div>
);

export default function TCModal({ student, onClose, onSuccess }) {
    const { addToast } = useToast();
    const [step, setStep] = useState(0);
    const [submitting, setSubmitting] = useState(false);

    const today = new Date().toISOString().split('T')[0];
    const autoTcNo = `TC-${new Date().getFullYear()}-${student.admissionNo}`;

    const [form, setForm] = useState({
        tcNo: autoTcNo,
        applicationDate: today,
        issueDate: today,
        lastDateAttended: today,
        reasonForLeaving: '',
        conduct: 'Good',
        isTCPromoted: false,
        remarks: '',
    });

    const [errors, setErrors] = useState({});

    // Live fee clearance check — do NOT rely on the stale student.financialClearance field
    const [clearanceLoading, setClearanceLoading] = useState(true);
    const [hasFeesPending, setHasFeesPending] = useState(false);

    useEffect(() => {
        const checkClearance = async () => {
            try {
                const res = await api.get(`/students/${student._id}/tc-eligibility`);
                setHasFeesPending(!res.data.isCleared);
            } catch {
                // If check fails, allow proceeding (backend will enforce anyway)
                setHasFeesPending(false);
            } finally {
                setClearanceLoading(false);
            }
        };
        checkClearance();
    }, [student._id]);

    const handleChange = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors(prev => { const e = { ...prev }; delete e[field]; return e; });
    };

    const validateStep2 = () => {
        const e = {};
        if (!form.reasonForLeaving) e.reasonForLeaving = 'Please select a reason for leaving.';
        if (!form.lastDateAttended) e.lastDateAttended = 'Last date of attendance is required.';
        if (!form.issueDate) e.issueDate = 'Issue date is required.';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleNext = () => {
        if (step === 1 && !validateStep2()) return;
        setStep(s => Math.min(s + 1, 2));
    };
    const handleBack = () => setStep(s => Math.max(s - 1, 0));

    const handleIssue = async () => {
        setSubmitting(true);
        try {
            await api.post(`/students/${student._id}/issue-tc`, form);
            // Generate & download PDF immediately after successful save
            await generateTC(student, form);
            addToast('Transfer Certificate issued and downloaded successfully!', 'success');
            onSuccess();
        } catch (error) {
            const msg = error.response?.data?.message || 'Failed to issue TC.';
            addToast(msg, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white">
                    <div className="flex items-center gap-2">
                        <FileText size={20} />
                        <div>
                            <h2 className="font-bold text-base leading-tight">Issue Transfer Certificate</h2>
                            <p className="text-indigo-200 text-xs">{student.name} · {student.admissionNo}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-indigo-200 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Stepper */}
                <div className="flex items-center bg-indigo-50 px-6 py-3 gap-0">
                    {STEPS.map((s, i) => (
                        <div key={i} className="flex items-center flex-1 last:flex-none">
                            <div className={`flex items-center gap-1.5 text-xs font-semibold transition-colors ${i < step ? 'text-indigo-600' :
                                i === step ? 'text-indigo-700' : 'text-slate-400'
                                }`}>
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all ${i < step ? 'bg-indigo-600 border-indigo-600 text-white' :
                                    i === step ? 'bg-white border-indigo-600 text-indigo-600' :
                                        'bg-white border-slate-300 text-slate-400'
                                    }`}>
                                    {i < step ? <CheckCircle2 size={12} /> : i + 1}
                                </div>
                                <span className="hidden sm:inline">{s}</span>
                            </div>
                            {i < STEPS.length - 1 && (
                                <div className={`flex-1 h-px mx-2 ${i < step ? 'bg-indigo-400' : 'bg-slate-200'}`} />
                            )}
                        </div>
                    ))}
                </div>

                {/* Body */}
                <div className="p-6 max-h-[65vh] overflow-y-auto">

                    {/* ── STEP 1: Pre-Issue Check ── */}
                    {step === 0 && (
                        <div className="space-y-4 animate-in slide-in-from-right-4 duration-200">
                            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                                <Field label="Student Name" value={student.name} />
                                <Field label="Admission No." value={student.admissionNo} />
                                <Field label="Class & Section" value={`${student.className} - ${student.section}`} />
                                <Field label="Roll No." value={student.rollNo} />
                            </div>

                            {/* Live fee clearance status */}
                            {clearanceLoading ? (
                                <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                                    <Loader2 size={18} className="animate-spin text-indigo-500" />
                                    <p className="text-sm text-slate-600">Checking fee clearance status...</p>
                                </div>
                            ) : hasFeesPending ? (
                                <div className="flex gap-3 p-4 bg-red-50 border border-red-300 rounded-xl">
                                    <AlertTriangle size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-semibold text-red-800 text-sm">Fee Dues Outstanding — TC Blocked</p>
                                        <p className="text-red-700 text-xs mt-0.5">
                                            This student has an outstanding fee balance. All dues must be cleared
                                            before a Transfer Certificate can be issued. Please collect the
                                            pending fees first.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                                    <CheckCircle2 size={20} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-semibold text-emerald-800 text-sm">Fee Dues Cleared ✓</p>
                                        <p className="text-emerald-700 text-xs mt-0.5">All fee dues are cleared. TC can be issued.</p>
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                                <ShieldAlert size={20} className="text-red-500 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-semibold text-red-800 text-sm">Irreversible Action</p>
                                    <p className="text-red-700 text-xs mt-0.5">
                                        Issuing a TC will mark this student as <strong>Relieved</strong> and make their profile
                                        read-only. This action cannot be undone.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── STEP 2: TC Details Form ── */}
                    {step === 1 && (
                        <div className="space-y-4 animate-in slide-in-from-right-4 duration-200">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">TC Number</label>
                                    <input
                                        type="text"
                                        value={form.tcNo}
                                        onChange={e => handleChange('tcNo', e.target.value)}
                                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="Auto-generated"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Date of Issue <span className="text-red-500">*</span></label>
                                    <input
                                        type="date"
                                        value={form.issueDate}
                                        onChange={e => handleChange('issueDate', e.target.value)}
                                        className={`w-full px-3 py-2 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 ${errors.issueDate ? 'border-red-400' : 'border-slate-300'}`}
                                    />
                                    {errors.issueDate && <p className="text-red-500 text-xs mt-1">{errors.issueDate}</p>}
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Application Date</label>
                                    <input
                                        type="date"
                                        value={form.applicationDate}
                                        onChange={e => handleChange('applicationDate', e.target.value)}
                                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Last Date of Attendance <span className="text-red-500">*</span></label>
                                    <input
                                        type="date"
                                        value={form.lastDateAttended}
                                        onChange={e => handleChange('lastDateAttended', e.target.value)}
                                        className={`w-full px-3 py-2 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 ${errors.lastDateAttended ? 'border-red-400' : 'border-slate-300'}`}
                                    />
                                    {errors.lastDateAttended && <p className="text-red-500 text-xs mt-1">{errors.lastDateAttended}</p>}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Reason for Leaving <span className="text-red-500">*</span></label>
                                <select
                                    value={form.reasonForLeaving}
                                    onChange={e => handleChange('reasonForLeaving', e.target.value)}
                                    className={`w-full px-3 py-2 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 ${errors.reasonForLeaving ? 'border-red-400' : 'border-slate-300'}`}
                                >
                                    <option value="">Select a reason...</option>
                                    {LEAVING_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                                {errors.reasonForLeaving && <p className="text-red-500 text-xs mt-1">{errors.reasonForLeaving}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Conduct & Character</label>
                                    <select
                                        value={form.conduct}
                                        onChange={e => handleChange('conduct', e.target.value)}
                                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        {CONDUCT_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div className="flex items-center gap-3 pt-5">
                                    <input
                                        id="tcPromoted"
                                        type="checkbox"
                                        checked={form.isTCPromoted}
                                        onChange={e => handleChange('isTCPromoted', e.target.checked)}
                                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                                    />
                                    <label htmlFor="tcPromoted" className="text-sm font-medium text-slate-700 cursor-pointer">
                                        Eligible for Promotion
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">Remarks (optional)</label>
                                <textarea
                                    rows={2}
                                    value={form.remarks}
                                    onChange={e => handleChange('remarks', e.target.value)}
                                    placeholder="Additional notes or remarks..."
                                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                                />
                            </div>
                        </div>
                    )}

                    {/* ── STEP 3: Preview & Confirm ── */}
                    {step === 2 && (
                        <div className="space-y-4 animate-in slide-in-from-right-4 duration-200">
                            <p className="text-sm text-slate-500">Please review all details before issuing the certificate. The PDF will download automatically.</p>

                            <div className="border border-slate-200 rounded-xl overflow-hidden">
                                <div className="bg-slate-50 px-4 py-2 border-b border-slate-200">
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Student Information</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4 p-4">
                                    <Field label="Name" value={student.name} />
                                    <Field label="Admission No." value={student.admissionNo} />
                                    <Field label="Class" value={`${student.className} - ${student.section}`} />
                                    <Field label="D.O.B" value={fmt(student.dob)} />
                                </div>
                            </div>

                            <div className="border border-slate-200 rounded-xl overflow-hidden">
                                <div className="bg-slate-50 px-4 py-2 border-b border-slate-200">
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">TC Details</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4 p-4">
                                    <Field label="TC Number" value={form.tcNo} />
                                    <Field label="Date of Issue" value={fmt(form.issueDate)} />
                                    <Field label="Application Date" value={fmt(form.applicationDate)} />
                                    <Field label="Last Date Attended" value={fmt(form.lastDateAttended)} />
                                    <Field label="Reason for Leaving" value={form.reasonForLeaving} />
                                    <Field label="Conduct" value={form.conduct} />
                                    <Field label="Eligible for Promotion" value={form.isTCPromoted ? 'Yes' : 'No'} />
                                    <Field label="Fee Dues" value={hasFeesPending ? 'Pending ⚠' : 'Cleared ✓'} />
                                </div>
                                {form.remarks && (
                                    <div className="px-4 pb-4">
                                        <Field label="Remarks" value={form.remarks} />
                                    </div>
                                )}
                            </div>

                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                                <ShieldAlert size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
                                <p className="text-xs text-amber-700">
                                    Clicking <strong>"Generate & Issue TC"</strong> will permanently mark this student as <strong>Relieved</strong> and download the TC PDF immediately.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50">
                    <button
                        onClick={step === 0 ? onClose : handleBack}
                        disabled={submitting}
                        className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50"
                    >
                        {step === 0 ? 'Cancel' : (
                            <span className="flex items-center gap-1"><ChevronLeft size={14} /> Back</span>
                        )}
                    </button>

                    {step < 2 ? (
                        <button
                            onClick={handleNext}
                            disabled={(step === 0 && hasFeesPending) || (step === 0 && clearanceLoading)}
                            title={step === 0 && hasFeesPending ? 'Clear all fee dues before issuing TC' : ''}
                            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-slate-400"
                        >
                            {step === 0
                                ? clearanceLoading ? 'Checking...' : hasFeesPending ? 'Fees Pending — Cannot Proceed' : 'Proceed to TC Details'
                                : 'Preview TC'
                            }
                            {(!hasFeesPending && !clearanceLoading) && <ChevronRight size={14} />}
                        </button>
                    ) : (
                        <button
                            onClick={handleIssue}
                            disabled={submitting}
                            className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {submitting ? (
                                <><Loader2 size={16} className="animate-spin" /> Issuing...</>
                            ) : (
                                <><FileText size={16} /> Generate &amp; Issue TC</>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
