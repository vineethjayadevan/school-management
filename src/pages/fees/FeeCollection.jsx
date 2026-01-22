import { useState, useEffect } from 'react';
import {
    Search, CreditCard, Banknote, IndianRupee, CheckCircle,
    History, Wallet, ArrowUpRight, ArrowDownLeft, ChevronDown, ChevronUp, Info, X
} from 'lucide-react';
import { storageService } from '../../services/storage';
import { feeStructure } from '../../services/mockData';
import { useToast } from '../../components/ui/Toast';

export default function FeeDashboard() {
    const { addToast } = useToast();
    const [activeTab, setActiveTab] = useState('collect'); // 'collect' or 'history'

    // Data State
    const [transactions, setTransactions] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    // Collection Form State
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [feeType, setFeeType] = useState('tuition');
    const [paymentMode, setPaymentMode] = useState('Cash');
    const [isProcessing, setIsProcessing] = useState(false);
    const [showReceipt, setShowReceipt] = useState(false);

    // UI State for History
    const [expandedClass, setExpandedClass] = useState(null);
    const toggleClass = (cls) => {
        setExpandedClass(expandedClass === cls ? null : cls);
    };

    // --- History Logic ---
    useEffect(() => {
        if (activeTab === 'history') {
            loadHistory();
        }
    }, [activeTab]);

    const loadHistory = async () => {
        setLoadingHistory(true);
        try {
            const data = await storageService.fees.getAll();
            setTransactions(data);
        } catch (error) {
            console.error(error);
            addToast("Failed to load history", "error");
        } finally {
            setLoadingHistory(false);
        }
    };

    // --- Stats Logic ---
    const totalCollected = transactions
        .filter(t => t.status === 'Paid')
        .reduce((sum, t) => sum + (t.amount || 0), 0);

    const totalPending = transactions
        .filter(t => t.status === 'Pending' || t.status === 'Overdue')
        .reduce((sum, t) => sum + (t.amount || 0), 0);

    const todayCollected = transactions
        .filter(t => {
            const tDate = new Date(t.paymentDate || t.createdAt).toDateString();
            return tDate === new Date().toDateString() && t.status === 'Paid';
        })
        .reduce((sum, t) => sum + (t.amount || 0), 0);


    // --- Collection Logic ---
    const handleSearch = async (e) => {
        const term = e.target.value;
        setSearchTerm(term);
        if (term.length > 2) {
            try {
                const results = await storageService.students.getAll(term);
                if (results.length > 0) {
                    setSelectedStudent(results[0]);
                } else {
                    setSelectedStudent(null);
                }
            } catch (err) {
                console.error("Search failed", err);
            }
        }
    };

    const getDueAmount = () => {
        if (!selectedStudent) return 0;
        // Basic fallback logic: use className or class field
        const cls = selectedStudent.className || selectedStudent.class;
        if (!cls || !feeStructure[cls]) return 2500; // Default amount
        return feeStructure[cls][feeType] || 0;
    };

    const handlePayment = async () => {
        if (!selectedStudent) return;
        setIsProcessing(true);

        try {
            const amount = getDueAmount();
            const transaction = {
                studentId: selectedStudent.id || selectedStudent._id,
                type: `${feeType.charAt(0).toUpperCase() + feeType.slice(1)} Fee`,
                amount,
                date: new Date().toISOString(),
                mode: paymentMode,
                remarks: 'Collected via Portal'
            };

            await storageService.fees.add(transaction);

            // Optimistic Update
            setSelectedStudent(prev => ({ ...prev, feesStatus: 'Paid' }));
            setShowReceipt(true);
            addToast("Payment recorded successfully", "success");

            // Refresh history if already loaded
            if (activeTab === 'history') loadHistory();

        } catch (error) {
            console.error(error);
            addToast("Payment processing failed", "error");
        } finally {
            setIsProcessing(false);
        }
    };

    const resetForm = () => {
        setSelectedStudent(null);
        setSearchTerm('');
        setShowReceipt(false);
    };

    // --- Render Helpers ---

    const renderReceipt = () => (
        <div className="max-w-md mx-auto bg-white p-8 rounded-xl shadow-lg border border-slate-200 text-center space-y-6 mt-10 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle size={32} />
            </div>
            <div>
                <h2 className="text-2xl font-bold text-slate-900">Payment Successful!</h2>
                <p className="text-slate-500">Transaction Recorded</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg text-left space-y-3">
                <div className="flex justify-between">
                    <span className="text-slate-500">Student</span>
                    <span className="font-medium text-slate-900">{selectedStudent?.name}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-slate-500">Amount</span>
                    <span className="font-bold text-slate-900">₹{getDueAmount()}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-slate-500">Mode</span>
                    <span className="font-medium text-slate-900">{paymentMode}</span>
                </div>
            </div>
            <button
                onClick={resetForm}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 font-medium"
            >
                Collect Next Fee
            </button>
        </div>
    );

    const renderCollectionTab = () => (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Find Student</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Enter Name, ID (STU001) or Roll No."
                            value={searchTerm}
                            onChange={handleSearch}
                            className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                    </div>
                </div>

                {selectedStudent ? (
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 animate-in fade-in slide-in-from-bottom-4">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-16 h-16 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center text-xl font-bold">
                                {selectedStudent.name.charAt(0)}
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">{selectedStudent.name}</h3>
                                <p className="text-slate-500">{(selectedStudent.className || selectedStudent.class)} - {selectedStudent.section} | ID: {selectedStudent.admissionNo}</p>
                            </div>
                            <div className="ml-auto">
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${selectedStudent.feesStatus === 'Paid' ? 'bg-green-100 text-green-700' :
                                    selectedStudent.feesStatus === 'Overdue' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                                    }`}>
                                    {selectedStudent.feesStatus}
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Fee Type</label>
                                <select
                                    value={feeType}
                                    onChange={(e) => setFeeType(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="tuition">Tuition Fee</option>
                                    <option value="transport">Transport Fee</option>
                                    <option value="library">Library Fee</option>
                                    <option value="sports">Sports Fee</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Payment Mode</label>
                                <select
                                    value={paymentMode}
                                    onChange={(e) => setPaymentMode(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="Cash">Cash</option>
                                    <option value="UPI">UPI / Online</option>
                                    <option value="Cheque">Cheque</option>
                                </select>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-10 text-center text-slate-400">
                        <Search className="mx-auto mb-2 opacity-50" size={48} />
                        <p>Search for a student to begin fee collection</p>
                    </div>
                )}
            </div>

            <div className="bg-slate-900 text-white p-6 rounded-xl shadow-lg h-fit sticky top-6">
                <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                    <CreditCard size={20} />
                    Payment Summary
                </h3>

                <div className="space-y-4 mb-8">
                    <div className="flex justify-between text-slate-300">
                        <span>Base Amount</span>
                        <span>₹{selectedStudent ? getDueAmount() : 0}</span>
                    </div>
                    <div className="h-px bg-slate-700 my-2"></div>
                    <div className="flex justify-between text-xl font-bold">
                        <span>Total Due</span>
                        <span>₹{selectedStudent ? getDueAmount() : 0}</span>
                    </div>
                </div>

                <button
                    disabled={!selectedStudent || isProcessing}
                    onClick={handlePayment}
                    className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isProcessing ? 'Processing...' : (
                        <>
                            <IndianRupee size={20} />
                            Confirm Payment
                        </>
                    )}
                </button>
            </div>
        </div>
    );


    // --- Detailed View Logic ---
    const [viewingStudent, setViewingStudent] = useState(null);

    const getStudentFeeDetails = (student) => {
        if (!student) return [];

        const cls = student.className || student.class;
        const structure = feeStructure[cls] || { tuition: 5000, library: 500, sports: 500, transport: 2000 };

        // Get all payments for this student
        const payments = transactions.filter(t =>
            (t.student?._id === student._id || t.student?.id === student.id || t.studentId === student.id) &&
            t.status === 'Paid'
        );

        // Calculate status per category
        return Object.entries(structure).map(([type, dueAmount]) => {
            const paidAmount = payments
                .filter(t => t.feeType?.toLowerCase().includes(type.toLowerCase()))
                .reduce((sum, t) => sum + (t.amount || 0), 0);

            return {
                type: type.charAt(0).toUpperCase() + type.slice(1),
                due: dueAmount,
                paid: paidAmount,
                pending: dueAmount - paidAmount,
                status: paidAmount >= dueAmount ? 'Paid' : paidAmount > 0 ? 'Partial' : 'Pending'
            };
        });
    };

    const renderFeeDetailsModal = () => {
        if (!viewingStudent) return null;

        const details = getStudentFeeDetails(viewingStudent);
        const totalDue = details.reduce((sum, d) => sum + d.due, 0);
        const totalPaid = details.reduce((sum, d) => sum + d.paid, 0);
        const totalPending = totalDue - totalPaid;

        return (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in">
                <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">Fee Details</h2>
                            <p className="text-slate-500 text-sm">
                                {viewingStudent.name} ({viewingStudent.className || viewingStudent.class})
                            </p>
                        </div>
                        <button
                            onClick={() => setViewingStudent(null)}
                            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                        >
                            <X size={20} className="text-slate-500" />
                        </button>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-center">
                                <p className="text-xs text-slate-500 uppercase font-semibold">Total Fee</p>
                                <p className="text-lg font-bold text-slate-900">₹{totalDue.toLocaleString()}</p>
                            </div>
                            <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100 text-center">
                                <p className="text-xs text-emerald-600 uppercase font-semibold">Paid</p>
                                <p className="text-lg font-bold text-emerald-700">₹{totalPaid.toLocaleString()}</p>
                            </div>
                            <div className="bg-red-50 p-4 rounded-lg border border-red-100 text-center">
                                <p className="text-xs text-red-600 uppercase font-semibold">Pending</p>
                                <p className="text-lg font-bold text-red-700">₹{totalPending.toLocaleString()}</p>
                            </div>
                        </div>

                        {/* Breakdown Table */}
                        <div className="border border-slate-200 rounded-lg overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                                    <tr>
                                        <th className="px-4 py-3">Fee Type</th>
                                        <th className="px-4 py-3 text-right">Total Due</th>
                                        <th className="px-4 py-3 text-right">Paid</th>
                                        <th className="px-4 py-3 text-right">Pending</th>
                                        <th className="px-4 py-3 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {details.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50">
                                            <td className="px-4 py-3 font-medium text-slate-900">{item.type}</td>
                                            <td className="px-4 py-3 text-right text-slate-600">₹{item.due.toLocaleString()}</td>
                                            <td className="px-4 py-3 text-right text-emerald-600 font-medium">₹{item.paid.toLocaleString()}</td>
                                            <td className="px-4 py-3 text-right text-red-600 font-medium">₹{item.pending.toLocaleString()}</td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium 
                                                    ${item.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' :
                                                        item.status === 'Partial' ? 'bg-yellow-100 text-yellow-700' :
                                                            'bg-red-100 text-red-700'}`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end">
                        <button
                            onClick={() => setViewingStudent(null)}
                            className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 font-medium shadow-sm"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const renderHistoryTab = () => {
        // --- Segregation Logic ---
        const recentTransactions = transactions.slice(0, 5); // Just top 5

        // Group by Class
        const groupedByClass = transactions.reduce((acc, t) => {
            const cls = t.student ? (t.student.className || t.student.class || 'Unknown') : 'Unknown';
            if (!acc[cls]) acc[cls] = [];
            acc[cls].push(t);
            return acc;
        }, {});

        // Sort Classes
        const sortedClasses = Object.keys(groupedByClass).sort((a, b) => {
            // Helper from StudentList
            const getOrder = (c) => {
                if (c.startsWith('KG')) return 0;
                if (c.startsWith('Class')) return parseInt(c.split(' ')[1]) || 10;
                return 20;
            };
            return getOrder(a) - getOrder(b);
        });

        return (
            <div className="space-y-8 animate-in fade-in">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
                        <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg">
                            <Wallet size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Total Collected</p>
                            <h3 className="text-2xl font-bold text-slate-900">₹{totalCollected.toLocaleString()}</h3>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
                        <div className="p-3 bg-red-100 text-red-600 rounded-lg">
                            <IndianRupee size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Total Pending</p>
                            <h3 className="text-2xl font-bold text-slate-900">₹{totalPending.toLocaleString()}</h3>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                            <History size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Total Transactions</p>
                            <h3 className="text-2xl font-bold text-slate-900">{transactions.length}</h3>
                        </div>
                    </div>
                </div>

                {/* 1. Recent Transactions (Compact) */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
                        <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                            <History size={18} className="text-indigo-600" />
                            Recent Activity
                        </h3>
                        <span className="text-xs text-slate-500">Last 5 Transactions</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 text-slate-600 text-xs font-bold uppercase">
                                <tr>
                                    <th className="px-6 py-3">Date</th>
                                    <th className="px-6 py-3">Student</th>
                                    <th className="px-6 py-3">Class</th>
                                    <th className="px-6 py-3 text-right">Amount</th>
                                    <th className="px-6 py-3 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                                {loadingHistory ? (
                                    <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500">Loading...</td></tr>
                                ) : recentTransactions.length === 0 ? (
                                    <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500">No transactions found.</td></tr>
                                ) : (
                                    recentTransactions.map((t) => (
                                        <tr key={t._id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-3 text-slate-600">{new Date(t.paymentDate || t.createdAt).toLocaleDateString()}</td>
                                            <td className="px-6 py-3 font-medium text-slate-900">{t.student?.name || 'Unknown'}</td>
                                            <td className="px-6 py-3 text-slate-600">{t.student ? `${t.student.className || t.student.class || ''}` : '-'}</td>
                                            <td className="px-6 py-3 text-right font-bold text-slate-700">₹{t.amount?.toLocaleString()}</td>
                                            <td className="px-6 py-3 text-center">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${t.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{t.status}</span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 2. Segregated View by Class */}
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-slate-900 px-1">Class-wise Collections</h3>
                    <div className="grid grid-cols-1 gap-4">
                        {sortedClasses.map(className => {
                            const classTxns = groupedByClass[className];
                            const clsCollected = classTxns.filter(t => t.status === 'Paid').reduce((sum, t) => sum + (t.amount || 0), 0);
                            const clsPending = classTxns.filter(t => t.status === 'Pending' || t.status === 'Overdue').reduce((sum, t) => sum + (t.amount || 0), 0);
                            const isExpanded = expandedClass === className;

                            return (
                                <div key={className} className={`bg-white rounded-xl shadow-sm border transition-all overflow-hidden ${isExpanded ? 'border-indigo-200 ring-2 ring-indigo-50' : 'border-slate-200'}`}>
                                    {/* Header / Trigger */}
                                    <div
                                        onClick={() => toggleClass(className)}
                                        className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2 rounded-lg ${isExpanded ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                                                {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-900 text-lg">{className}</h4>
                                                <p className="text-sm text-slate-500">{classTxns.length} Records</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-6 text-right">
                                            <div>
                                                <p className="text-xs text-emerald-600 uppercase font-semibold">Collected</p>
                                                <p className="text-lg font-bold text-emerald-700">₹{clsCollected.toLocaleString()}</p>
                                            </div>
                                            {(clsPending > 0) && (
                                                <div className="border-l border-slate-200 pl-6">
                                                    <p className="text-xs text-red-500 uppercase font-semibold">Pending</p>
                                                    <p className="text-lg font-bold text-red-600">₹{clsPending.toLocaleString()}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Expanded Content */}
                                    {isExpanded && (
                                        <div className="border-t border-slate-100 bg-slate-50/30 animate-in slide-in-from-top-2">
                                            <table className="w-full text-left">
                                                <thead className="text-xs text-slate-500 border-b border-slate-200 bg-slate-50">
                                                    <tr>
                                                        <th className="px-6 py-3 font-medium">Date</th>
                                                        <th className="px-6 py-3 font-medium">Student</th>
                                                        <th className="px-6 py-3 font-medium">Mode</th>
                                                        <th className="px-6 py-3 font-medium text-right">Amount</th>
                                                        <th className="px-6 py-3 font-medium text-center">Status</th>
                                                        <th className="px-6 py-3 font-medium text-center">Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 text-sm bg-white">
                                                    {classTxns.map(t => (
                                                        <tr key={t._id} className="hover:bg-slate-50">
                                                            <td className="px-6 py-3 text-slate-600">{new Date(t.paymentDate || t.createdAt).toLocaleDateString()}</td>
                                                            <td className="px-6 py-3 font-medium text-slate-900">{t.student?.name}</td>
                                                            <td className="px-6 py-3 text-slate-600">{t.paymentMode}</td>
                                                            <td className="px-6 py-3 text-right font-semibold text-slate-700">₹{t.amount?.toLocaleString()}</td>
                                                            <td className="px-6 py-3 text-center">
                                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${t.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{t.status}</span>
                                                            </td>
                                                            <td className="px-6 py-3 text-center">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setViewingStudent(t.student);
                                                                    }}
                                                                    className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-indigo-600 transition-colors"
                                                                >
                                                                    <Info size={18} />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Fee Management</h1>
                    <p className="text-slate-500">Collect fees and view transaction history.</p>
                </div>

                {/* Tabs */}
                <div className="bg-slate-100 p-1 rounded-lg flex items-center gap-1">
                    <button
                        onClick={() => setActiveTab('collect')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'collect' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                        Collect Fee
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'history' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                        Transactions
                    </button>
                </div>
            </div>

            {showReceipt ? renderReceipt() : (
                activeTab === 'collect' ? renderCollectionTab() : renderHistoryTab()
            )}

            {/* Fee Details Modal */}
            {renderFeeDetailsModal()}
        </div>
    );
}
