import { useState, useEffect, useMemo, useRef } from 'react';
import {
    Search, FileText, CheckCircle2, XCircle,
    Printer, X, AlertTriangle, Loader2,
    ClipboardList, UserCheck, ArrowRight, Calendar,
    Shield, BookOpen, RefreshCw
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../components/ui/Toast';

// ─── Utility ──────────────────────────────────────────────────────────────────
const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';
const fmtInput = (d) => d ? new Date(d).toISOString().split('T')[0] : '';
const todayInput = () => new Date().toISOString().split('T')[0];

const REASONS = ['Transfer of Parent', 'Admission to Another School', 'Personal Reason', 'Financial Reason', 'Migration', 'Other'];
const CONDUCT_OPTIONS = ['Excellent', 'Good', 'Satisfactory', 'Poor'];

// ─── Main Component ───────────────────────────────────────────────────────────
export default function TransferCertificates() {
    const { addToast } = useToast();
    const [activeTab, setActiveTab] = useState('issue');
    const [allStudents, setAllStudents] = useState([]);
    const [loading, setLoading] = useState(true);

    // Issue TC state
    const [search, setSearch] = useState('');
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [eligibility, setEligibility] = useState(null); // null | { isCleared, isActive }
    const [checkingEligibility, setCheckingEligibility] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({
        tcNo: '',
        applicationDate: todayInput(),
        issueDate: todayInput(),
        lastDateAttended: todayInput(),
        reasonForLeaving: '',
        conduct: 'Good',
        isTCPromoted: false,
        remarks: '',
    });

    // Print TC state
    const [printStudent, setPrintStudent] = useState(null);
    const printRef = useRef();

    useEffect(() => { fetchStudents(); }, []);

    const fetchStudents = async () => {
        setLoading(true);
        try {
            const res = await api.get('/students');
            setAllStudents(res.data);
        } catch {
            addToast('Failed to load students', 'error');
        } finally {
            setLoading(false);
        }
    };

    const activeStudents = useMemo(() =>
        allStudents.filter(s => s.isActive &&
            (s.name.toLowerCase().includes(search.toLowerCase()) ||
                s.admissionNo.toLowerCase().includes(search.toLowerCase()))),
        [allStudents, search]);

    const tcStudents = useMemo(() =>
        allStudents.filter(s => !s.isActive).sort((a, b) =>
            new Date(b.tcDetails?.issueDate || 0) - new Date(a.tcDetails?.issueDate || 0)),
        [allStudents]);

    const selectStudent = async (student) => {
        setSelectedStudent(student);
        setEligibility(null);
        setForm(prev => ({
            ...prev,
            tcNo: `TC-${new Date().getFullYear()}-${student.admissionNo}`,
        }));
        setCheckingEligibility(true);
        try {
            const res = await api.get(`/students/${student._id}/tc-eligibility`);
            setEligibility(res.data);
        } catch {
            setEligibility({ isCleared: true, isActive: student.isActive });
        } finally {
            setCheckingEligibility(false);
        }
    };

    const handleIssueTC = async (e) => {
        e.preventDefault();
        if (!form.reasonForLeaving) { addToast('Reason for leaving is required', 'warning'); return; }
        setSubmitting(true);
        try {
            await api.post(`/students/${selectedStudent._id}/issue-tc`, form);
            addToast('Transfer Certificate issued successfully', 'success');
            setSelectedStudent(null);
            setEligibility(null);
            setForm({ tcNo: '', applicationDate: todayInput(), issueDate: todayInput(), lastDateAttended: todayInput(), reasonForLeaving: '', conduct: 'Good', isTCPromoted: false, remarks: '' });
            await fetchStudents();
            setActiveTab('issued');
        } catch (err) {
            addToast(err.response?.data?.message || 'Failed to issue TC', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handlePrint = () => {
        const content = printRef.current.innerHTML;
        const w = window.open('', '', 'width=850,height=1100');
        w.document.write(`
            <html><head><title>Transfer Certificate</title>
            <style>
                body { font-family: 'Times New Roman', serif; margin: 0; padding: 0; color: #111; }
                .tc-wrap { width: 800px; margin: 0 auto; padding: 40px; box-sizing: border-box; }
                .school-header { text-align: center; margin-bottom: 24px; }
                .school-name { font-size: 24px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; }
                .school-sub { font-size: 13px; color: #444; margin-top: 4px; }
                .tc-title { text-align: center; font-size: 18px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; margin: 20px 0 8px; text-decoration: underline; }
                .tc-no-row { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 24px; }
                table.fields { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
                table.fields td { padding: 7px 10px; font-size: 13px; vertical-align: top; }
                table.fields td:first-child { width: 42%; font-weight: 600; }
                table.fields td:last-child { border-bottom: 1px solid #aaa; }
                .sig-row { display: flex; justify-content: space-between; margin-top: 60px; font-size: 13px; }
                .sig-box { text-align: center; width: 200px; }
                .sig-line { border-top: 1px solid #111; margin-bottom: 6px; }
                .divider { border-top: 2px solid #222; margin: 12px 0; }
                @media print { body { -webkit-print-color-adjust: exact; } }
            </style>
            </head><body>${content}</body></html>`);
        w.document.close();
        w.focus();
        setTimeout(() => { w.print(); w.close(); }, 500);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <FileText size={26} className="text-indigo-600" />
                        Transfer Certificates
                    </h1>
                    <p className="text-slate-500 mt-0.5">Issue and manage student transfer certificates.</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-full text-sm font-medium">
                        {tcStudents.length} TC Issued
                    </span>
                    <span className="px-3 py-1.5 bg-green-50 border border-green-200 text-green-700 rounded-full text-sm font-medium">
                        {activeStudents.filter(s => s.isActive).length > 0 ? allStudents.filter(s => s.isActive).length : 0} Active Students
                    </span>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 p-1 bg-slate-100 rounded-xl w-fit">
                <button
                    onClick={() => setActiveTab('issue')}
                    className={`flex items-center gap-2 px-5 py-2 rounded-lg font-semibold text-sm transition-all ${activeTab === 'issue' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <ClipboardList size={16} />
                    Issue TC
                </button>
                <button
                    onClick={() => setActiveTab('issued')}
                    className={`flex items-center gap-2 px-5 py-2 rounded-lg font-semibold text-sm transition-all ${activeTab === 'issued' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <UserCheck size={16} />
                    TC Issued
                    {tcStudents.length > 0 && (
                        <span className="bg-amber-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                            {tcStudents.length}
                        </span>
                    )}
                </button>
            </div>

            {/* ── Issue TC Tab ── */}
            {activeTab === 'issue' && (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {/* Student Search */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-slate-200">
                            <h2 className="font-semibold text-slate-800 mb-3">Select Student</h2>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search by name or admission no..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                        </div>
                        <div className="overflow-y-auto max-h-[500px]">
                            {loading ? (
                                <div className="flex items-center justify-center py-16 text-slate-400">
                                    <Loader2 size={24} className="animate-spin mr-2" /> Loading students...
                                </div>
                            ) : activeStudents.length === 0 ? (
                                <div className="py-16 text-center text-slate-400">No active students found</div>
                            ) : (
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500 tracking-wider">
                                        <tr>
                                            <th className="px-4 py-3 text-left">Student</th>
                                            <th className="px-4 py-3 text-left">Class</th>
                                            <th className="px-4 py-3 text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {activeStudents.map(s => (
                                            <tr
                                                key={s._id}
                                                className={`transition-colors hover:bg-indigo-50 ${selectedStudent?._id === s._id ? 'bg-indigo-50 border-l-2 border-indigo-500' : ''}`}
                                            >
                                                <td className="px-4 py-3">
                                                    <p className="font-semibold text-slate-900">{s.name}</p>
                                                    <p className="text-xs text-slate-400 font-mono">{s.admissionNo}</p>
                                                </td>
                                                <td className="px-4 py-3 text-slate-600">
                                                    {s.className} - {s.section}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <button
                                                        onClick={() => selectStudent(s)}
                                                        className="flex items-center gap-1 mx-auto px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition-colors"
                                                    >
                                                        Issue TC <ArrowRight size={12} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>

                    {/* TC Form Panel */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        {!selectedStudent ? (
                            <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-slate-400 space-y-3">
                                <FileText size={48} strokeWidth={1} />
                                <p className="font-medium">Select a student to issue TC</p>
                                <p className="text-sm text-center px-8">Search and click "Issue TC" on any active student to fill the certificate details.</p>
                            </div>
                        ) : (
                            <div className="flex flex-col h-full">
                                {/* Selected Student Banner */}
                                <div className="p-4 bg-indigo-50 border-b border-indigo-100 flex items-center justify-between">
                                    <div>
                                        <p className="font-bold text-indigo-900">{selectedStudent.name}</p>
                                        <p className="text-xs text-indigo-600">{selectedStudent.admissionNo} · {selectedStudent.className}-{selectedStudent.section}</p>
                                    </div>
                                    {checkingEligibility ? (
                                        <span className="flex items-center gap-1 text-xs text-slate-500">
                                            <Loader2 size={14} className="animate-spin" /> Checking...
                                        </span>
                                    ) : eligibility ? (
                                        eligibility.isCleared ? (
                                            <span className="flex items-center gap-1 text-xs text-green-700 bg-green-100 px-2 py-1 rounded-full">
                                                <CheckCircle2 size={13} /> Fees Cleared
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-xs text-red-700 bg-red-100 px-2 py-1 rounded-full">
                                                <AlertTriangle size={13} /> Pending Dues
                                            </span>
                                        )
                                    ) : null}
                                </div>

                                {/* Warning if fees not cleared */}
                                {eligibility && !eligibility.isCleared && (
                                    <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-start gap-2">
                                        <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                                        <span>This student has pending fee dues. Clear all dues before issuing a Transfer Certificate.</span>
                                    </div>
                                )}

                                {/* Form */}
                                <form onSubmit={handleIssueTC} className="p-4 space-y-4 overflow-y-auto flex-1">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 mb-1">TC Number</label>
                                            <input
                                                value={form.tcNo}
                                                onChange={e => setForm(p => ({ ...p, tcNo: e.target.value }))}
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                placeholder="Auto-generated if blank"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 mb-1">Application Date</label>
                                            <input
                                                type="date"
                                                value={form.applicationDate}
                                                onChange={e => setForm(p => ({ ...p, applicationDate: e.target.value }))}
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 mb-1">Issue Date</label>
                                            <input
                                                type="date"
                                                value={form.issueDate}
                                                onChange={e => setForm(p => ({ ...p, issueDate: e.target.value }))}
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 mb-1">Last Date Attended</label>
                                            <input
                                                type="date"
                                                value={form.lastDateAttended}
                                                onChange={e => setForm(p => ({ ...p, lastDateAttended: e.target.value }))}
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 mb-1">Reason for Leaving <span className="text-red-500">*</span></label>
                                        <select
                                            value={form.reasonForLeaving}
                                            onChange={e => setForm(p => ({ ...p, reasonForLeaving: e.target.value }))}
                                            required
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        >
                                            <option value="">Select reason...</option>
                                            {REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 mb-1">Conduct</label>
                                            <select
                                                value={form.conduct}
                                                onChange={e => setForm(p => ({ ...p, conduct: e.target.value }))}
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            >
                                                {CONDUCT_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                        <div className="flex items-end pb-1">
                                            <label className="flex items-center gap-3 cursor-pointer">
                                                <div
                                                    onClick={() => setForm(p => ({ ...p, isTCPromoted: !p.isTCPromoted }))}
                                                    className={`relative w-10 h-5 rounded-full transition-colors ${form.isTCPromoted ? 'bg-indigo-600' : 'bg-slate-300'}`}
                                                >
                                                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isTCPromoted ? 'translate-x-5' : 'translate-x-0.5'}`} />
                                                </div>
                                                <span className="text-sm text-slate-700">Student was Promoted</span>
                                            </label>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 mb-1">Remarks</label>
                                        <textarea
                                            value={form.remarks}
                                            onChange={e => setForm(p => ({ ...p, remarks: e.target.value }))}
                                            rows={2}
                                            placeholder="Optional remarks..."
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                                        />
                                    </div>

                                    <div className="flex gap-3 pt-2">
                                        <button
                                            type="button"
                                            onClick={() => { setSelectedStudent(null); setEligibility(null); }}
                                            className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={submitting || (eligibility && !eligibility.isCleared)}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-lg text-sm font-semibold transition-colors"
                                        >
                                            {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                                            {submitting ? 'Issuing...' : 'Issue TC'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── TC Issued Tab ── */}
            {activeTab === 'issued' && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                        <h2 className="font-semibold text-slate-800">TC Issued Students ({tcStudents.length})</h2>
                        <button onClick={fetchStudents} className="text-slate-400 hover:text-slate-600 transition-colors">
                            <RefreshCw size={18} />
                        </button>
                    </div>
                    {tcStudents.length === 0 ? (
                        <div className="py-20 text-center text-slate-400">
                            <UserCheck size={40} strokeWidth={1} className="mx-auto mb-3" />
                            <p>No TC certificates have been issued yet.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500 tracking-wider">
                                    <tr>
                                        <th className="px-5 py-3 text-left">Student</th>
                                        <th className="px-5 py-3 text-left">Class</th>
                                        <th className="px-5 py-3 text-left">TC No</th>
                                        <th className="px-5 py-3 text-left">Issue Date</th>
                                        <th className="px-5 py-3 text-left">Reason</th>
                                        <th className="px-5 py-3 text-left">Conduct</th>
                                        <th className="px-5 py-3 text-center">Print</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {tcStudents.map(s => (
                                        <tr key={s._id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-5 py-4">
                                                <p className="font-semibold text-slate-900">{s.name}</p>
                                                <p className="text-xs font-mono text-slate-400">{s.admissionNo}</p>
                                            </td>
                                            <td className="px-5 py-4 text-slate-600">{s.className} - {s.section}</td>
                                            <td className="px-5 py-4 font-mono text-slate-700">{s.tcDetails?.tcNo || '—'}</td>
                                            <td className="px-5 py-4 text-slate-600">{fmt(s.tcDetails?.issueDate)}</td>
                                            <td className="px-5 py-4 text-slate-600 max-w-[180px] truncate">{s.tcDetails?.reasonForLeaving || '—'}</td>
                                            <td className="px-5 py-4">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${s.tcDetails?.conduct === 'Excellent' ? 'bg-green-100 text-green-700' :
                                                        s.tcDetails?.conduct === 'Good' ? 'bg-blue-100 text-blue-700' :
                                                            s.tcDetails?.conduct === 'Satisfactory' ? 'bg-amber-100 text-amber-700' :
                                                                'bg-red-100 text-red-700'
                                                    }`}>
                                                    {s.tcDetails?.conduct || 'Good'}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-center">
                                                <button
                                                    onClick={() => setPrintStudent(s)}
                                                    className="flex items-center gap-1 mx-auto px-3 py-1.5 border border-indigo-200 text-indigo-600 hover:bg-indigo-50 text-xs font-medium rounded-lg transition-colors"
                                                >
                                                    <Printer size={13} /> Print TC
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* ── Print TC Modal ── */}
            {printStudent && (
                <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 shrink-0">
                            <h2 className="font-bold text-slate-900 text-lg">Transfer Certificate Preview</h2>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handlePrint}
                                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors"
                                >
                                    <Printer size={16} /> Print / Download
                                </button>
                                <button onClick={() => setPrintStudent(null)} className="text-slate-400 hover:text-slate-600 p-1">
                                    <X size={22} />
                                </button>
                            </div>
                        </div>

                        {/* TC Document */}
                        <div className="overflow-y-auto flex-1 p-6 bg-gray-50">
                            <div ref={printRef}>
                                <div className="tc-wrap" style={{ fontFamily: "'Times New Roman', serif", width: '760px', margin: '0 auto', backgroundColor: '#fff', padding: '40px', border: '1px solid #ccc' }}>
                                    {/* School Header */}
                                    <div style={{ textAlign: 'center', marginBottom: '20px', borderBottom: '2px solid #222', paddingBottom: '16px' }}>
                                        <div style={{ fontSize: '22px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                            STEM Global Public School
                                        </div>
                                        <div style={{ fontSize: '13px', color: '#444', marginTop: '4px' }}>
                                            Empowering Young Minds Through Innovation
                                        </div>
                                    </div>

                                    {/* TC Title */}
                                    <div style={{ textAlign: 'center', fontSize: '18px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '2px', margin: '16px 0', textDecoration: 'underline' }}>
                                        Transfer Certificate
                                    </div>

                                    {/* TC No and Date */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '24px' }}>
                                        <span><strong>TC No:</strong> {printStudent.tcDetails?.tcNo || '—'}</span>
                                        <span><strong>Issue Date:</strong> {fmt(printStudent.tcDetails?.issueDate)}</span>
                                    </div>

                                    {/* Fields */}
                                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px' }}>
                                        {[
                                            ['Student Name', printStudent.name?.toUpperCase()],
                                            ['Father\'s Name', printStudent.fatherName || printStudent.guardian],
                                            ['Mother\'s Name', printStudent.motherName || '—'],
                                            ['Date of Birth', fmt(printStudent.dob)],
                                            ['Nationality', printStudent.nationality || 'Indian'],
                                            ['Religion', printStudent.religion || '—'],
                                            ['Caste / Category', `${printStudent.caste || '—'} / ${printStudent.category || '—'}`],
                                            ['Admission No', printStudent.admissionNo],
                                            ['Class Studying', `${printStudent.className} - Section ${printStudent.section}`],
                                            ['Whether Promoted', printStudent.tcDetails?.isTCPromoted ? 'Yes' : 'No'],
                                            ['Application Date', fmt(printStudent.tcDetails?.applicationDate)],
                                            ['Last Date of Attendance', fmt(printStudent.tcDetails?.lastDateAttended)],
                                            ['Reason for Leaving', printStudent.tcDetails?.reasonForLeaving || '—'],
                                            ['Conduct', printStudent.tcDetails?.conduct || 'Good'],
                                            ['Remarks', printStudent.tcDetails?.remarks || '—'],
                                        ].map(([label, value], i) => (
                                            <tr key={i}>
                                                <td style={{ padding: '7px 10px', fontSize: '13px', fontWeight: '600', width: '42%' }}>{i + 1}. {label}</td>
                                                <td style={{ padding: '7px 10px', fontSize: '13px', borderBottom: '1px solid #bbb' }}>{value}</td>
                                            </tr>
                                        ))}
                                    </table>

                                    {/* Signatures */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '60px', fontSize: '13px' }}>
                                        {['Class Teacher', 'Office In-charge', 'Principal'].map(role => (
                                            <div key={role} style={{ textAlign: 'center', width: '180px' }}>
                                                <div style={{ borderTop: '1px solid #222', marginBottom: '6px', paddingTop: '4px' }}>{role}</div>
                                            </div>
                                        ))}
                                    </div>

                                    <div style={{ textAlign: 'center', fontSize: '11px', color: '#777', marginTop: '32px' }}>
                                        This is a computer-generated Transfer Certificate. · STEM Global Public School
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
