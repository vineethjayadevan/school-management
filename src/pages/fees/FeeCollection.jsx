import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    Search, CreditCard, Banknote, IndianRupee, CheckCircle,
    History, Wallet, ArrowUpRight, ArrowDownLeft, ChevronDown, ChevronUp, Info, X, Download, Printer, Settings
} from 'lucide-react';
import api from '../../services/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { storageService } from '../../services/storage';
import { feeStructure } from '../../services/mockData';
import { useToast } from '../../components/ui/Toast';

import FeeReceipt from '../../components/fees/FeeReceipt';
import FeeSettings from '../../components/fees/FeeSettings';

export default function FeeDashboard() {
    const { addToast } = useToast();
    const location = useLocation();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('history'); // Default to Transactions

    useEffect(() => {
        if (location.state?.startTab) {
            setActiveTab(location.state.startTab);
        }
    }, [location.state]);

    // Data State
    const [transactions, setTransactions] = useState([]);
    const [students, setStudents] = useState([]); // Store all students for stats
    const [loadingHistory, setLoadingHistory] = useState(false);

    // Collection Form State
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [feeType, setFeeType] = useState('tuition');
    const [paymentMode, setPaymentMode] = useState('Cash');
    const [isProcessing, setIsProcessing] = useState(false);
    const [showReceipt, setShowReceipt] = useState(false);

    // Dynamic Categories State
    const [allCategories, setAllCategories] = useState([]);
    const [availableCategories, setAvailableCategories] = useState([]);

    // Fetch all active categories on mount
    useEffect(() => {
        const fetchAllCategories = async () => {
            try {
                const res = await api.get('/fee-categories');
                setAllCategories(res.data.filter(cat => cat.isActive));
            } catch (error) {
                console.error("Failed to fetch all fee categories", error);
            }
        };
        fetchAllCategories();
    }, []);

    // Filter categories when a specific student is selected for the payment form
    useEffect(() => {
        if (selectedStudent && allCategories.length > 0) {
            const cls = selectedStudent.className || selectedStudent.class;

            const applicableCategories = allCategories.filter(cat => {
                if (cat.hasSlabs) {
                    const slabCount = selectedStudent.conveyanceSlab ? parseInt(selectedStudent.conveyanceSlab) : 0;
                    return slabCount > 0;
                }
                const clsAmount = cat.amounts.find(a => a.className === cls);
                return clsAmount && clsAmount.amount > 0;
            });

            setAvailableCategories(applicableCategories);
            if (applicableCategories.length > 0) {
                setFeeType(applicableCategories[0].name);
            }
        } else {
            setAvailableCategories([]);
            setFeeType('');
        }
    }, [selectedStudent, allCategories]);

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
            const [txnsData, studentsData] = await Promise.all([
                storageService.fees.getAll(),
                storageService.students.getAll() // Fetch students for stats
            ]);
            setTransactions(txnsData);
            setStudents(studentsData);
        } catch (error) {
            console.error(error);
            addToast("Failed to load history", "error");
        } finally {
            setLoadingHistory(false);
        }
    };

    // --- Stats Logic ---
    const stats = useMemo(() => {
        // Optimization: Pre-calculate total paid per student
        const paymentsByStudent = transactions.reduce((acc, t) => {
            if (t.status === 'Paid') {
                // Robust extraction of student ID
                const sId = t.student?._id || t.student?.id || t.studentId || t.student;
                if (sId) {
                    const key = String(sId);
                    acc[key] = (acc[key] || 0) + (t.amount || 0);
                }
            }
            return acc;
        }, {});

        return students.reduce((acc, student) => {
            const cls = student.className || student.class;
            const studentDiscounts = student.discounts || [];

            // Calculate dynamic total due from allCategories (with discount)
            let studentTotalDue = 0;
            allCategories.forEach(cat => {
                let annualTotal = 0;
                if (cat.hasSlabs) {
                    const slabCount = student.conveyanceSlab ? parseInt(student.conveyanceSlab) : 0;
                    if (slabCount > 0) {
                        annualTotal = (cat.baseAmount + (slabCount * cat.slabMultiplier)) * (cat.months || 10);
                    }
                } else {
                    const expectedObj = cat.amounts.find(a => a.className === cls);
                    if (expectedObj) annualTotal = expectedObj.amount;
                }
                if (annualTotal > 0) {
                    const disc = studentDiscounts.find(d =>
                        d.categoryId?.toString() === cat._id?.toString() ||
                        d.categoryName?.toLowerCase() === cat.name.toLowerCase()
                    );
                    studentTotalDue += Math.max(0, annualTotal - (disc?.discountAmount || 0));
                }
            });

            const studentPaid = paymentsByStudent[String(student.id || student._id)] || 0;
            const studentPending = Math.max(0, studentTotalDue - studentPaid);

            acc.expected += studentTotalDue;
            acc.collected += studentPaid;
            acc.pending += studentPending;

            return acc;
        }, { expected: 0, collected: 0, pending: 0 });
    }, [students, transactions, allCategories]);


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



    const [feeBreakdown, setFeeBreakdown] = useState({});
    const [transactionId, setTransactionId] = useState('');

    const totalPayingAmount = useMemo(() => {
        return Object.values(feeBreakdown).reduce((sum, val) => sum + (Number(val) || 0), 0);
    }, [feeBreakdown]);

    const handleBreakdownChange = (categoryName, value) => {
        setFeeBreakdown(prev => ({
            ...prev,
            [categoryName]: value
        }));
    };

    const getDueAmount = () => {
        if (!selectedStudent) return 0;
        const cls = selectedStudent.className || selectedStudent.class;
        const studentDiscounts = selectedStudent.discounts || [];

        let standardDue = 0;
        availableCategories.forEach(cat => {
            let annualTotal = 0;
            if (cat.hasSlabs) {
                const slabCount = selectedStudent.conveyanceSlab ? parseInt(selectedStudent.conveyanceSlab) : 0;
                if (slabCount > 0) {
                    annualTotal = (cat.baseAmount + (slabCount * cat.slabMultiplier)) * (cat.months || 10);
                }
            } else {
                const classAmount = cat.amounts.find(a => a.className === cls);
                if (classAmount) annualTotal = classAmount.amount;
            }
            if (annualTotal > 0) {
                const disc = studentDiscounts.find(d =>
                    d.categoryId?.toString() === cat._id?.toString() ||
                    d.categoryName?.toLowerCase() === cat.name.toLowerCase()
                );
                standardDue += Math.max(0, annualTotal - (disc?.discountAmount || 0));
            }
        });

        return standardDue;
    };

    // --- Payment Logic: Preview & Confirm ---
    const [lastTransaction, setLastTransaction] = useState(null);
    const [isPaymentConfirmed, setIsPaymentConfirmed] = useState(false);

    const handlePreview = () => {
        if (!selectedStudent || totalPayingAmount <= 0) return;

        if (paymentMode !== 'Cash' && (!transactionId || transactionId.trim() === '')) {
            addToast("Transaction ID is required for non-cash payments", "error");
            return;
        }

        const breakdownArray = Object.entries(feeBreakdown)
            .filter(([_, amt]) => Number(amt) > 0)
            .map(([catName, amt]) => ({ feeType: catName, amount: Number(amt) }));

        const transaction = {
            studentId: selectedStudent.id || selectedStudent._id,
            breakdown: breakdownArray,
            type: 'Split Payment', // Legacy fallback label
            amount: totalPayingAmount,
            date: new Date().toISOString(),
            mode: paymentMode,
            transactionId: transactionId.trim(),
            remarks: 'Collected via Portal',
            // Preliminary Receipt No for Preview
            receiptNo: (() => {
                const now = new Date();
                const ts = now.getFullYear().toString() +
                    (now.getMonth() + 1).toString().padStart(2, '0') +
                    now.getDate().toString().padStart(2, '0') +
                    now.getHours().toString().padStart(2, '0') +
                    now.getMinutes().toString().padStart(2, '0') +
                    now.getSeconds().toString().padStart(2, '0');
                return `${ts}-${selectedStudent.admissionNo}`;
            })()
        };

        setLastTransaction(transaction);
        setShowReceipt(true);
        setIsPaymentConfirmed(false); // Entering preview mode
    };

    const handleFinalPayment = async () => {
        if (!selectedStudent || !lastTransaction) return;
        setIsProcessing(true);

        try {
            // Use the transaction details from the preview, but strip temporary receiptNo
            const { receiptNo, ...txnData } = lastTransaction;

            const response = await storageService.fees.add(txnData);

            // Update with real receipt number from backend
            setLastTransaction({ ...lastTransaction, receiptNo: response.receiptNo || 'NEW' });

            // Mark as confirmed so UI switches to Success/Print mode
            setIsPaymentConfirmed(true);

            // Optimistic Update
            setSelectedStudent(prev => ({ ...prev, feesStatus: 'Partially Paid' }));

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
        if (!isPaymentConfirmed) {
            // If just closing preview, hide receipt but keep form data (optional, or clear)
            setShowReceipt(false);
            return;
        }
        // Full reset after successful payment
        setSelectedStudent(null);
        setSearchTerm('');
        setShowReceipt(false);
        setLastTransaction(null);
        setFeeBreakdown({});
        setTransactionId('');
        setIsPaymentConfirmed(false);
    };

    // --- Render Helpers ---

    const renderReprintModal = () => {
        if (!reprintTransaction) return null;
        return (
            <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 animate-in fade-in backdrop-blur-sm">
                <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-lg bg-white relative">
                    <button
                        onClick={() => setReprintTransaction(null)}
                        className="absolute right-4 top-4 z-50 p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"
                        title="Close Preview"
                    >
                        <X size={20} className="text-slate-600" />
                    </button>
                    <FeeReceipt
                        transaction={reprintTransaction}
                        student={reprintTransaction.student}
                        onNext={() => setReprintTransaction(null)}
                        isPreview={false}
                    />
                </div>
            </div>
        );
    };

    const renderReceipt = () => (
        <FeeReceipt
            transaction={lastTransaction}
            student={selectedStudent}
            onNext={resetForm}
            isPreview={!isPaymentConfirmed}
            onConfirm={handleFinalPayment}
        />
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

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
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

                            {paymentMode !== 'Cash' && (
                                <div className="animate-in fade-in slide-in-from-left-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Transaction / Ref ID <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={transactionId}
                                        onChange={(e) => setTransactionId(e.target.value)}
                                        placeholder="e.g. UTR Number or Cheque No"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="border-t border-slate-200 pt-6">
                            <h4 className="font-semibold text-slate-800 mb-4">Fee Allocation (Split Payment)</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {getStudentFeeDetails(selectedStudent).filter(d => d.pending > 0).map((detail, idx) => (
                                    <div key={idx} className="bg-slate-50 border border-slate-200 p-4 rounded-lg">
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="text-sm font-medium text-slate-700">{detail.type}</label>
                                            <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">Due: ₹{detail.pending}</span>
                                        </div>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">₹</span>
                                            <input
                                                type="number"
                                                min="0"
                                                max={detail.pending}
                                                value={feeBreakdown[detail.type] !== undefined ? feeBreakdown[detail.type] : ''}
                                                onChange={(e) => handleBreakdownChange(detail.type, e.target.value)}
                                                placeholder={`0`}
                                                className="w-full pl-8 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                            />
                                        </div>
                                    </div>
                                ))}
                                {getStudentFeeDetails(selectedStudent).filter(d => d.pending > 0).length === 0 && (
                                    <div className="col-span-full text-center p-4 text-emerald-600 bg-emerald-50 rounded-lg border border-emerald-100">
                                        No pending fees found for this student. They are all caught up!
                                    </div>
                                )}
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
                        <span>Standard Fee</span>
                        <span>₹{selectedStudent ? getDueAmount() : 0}</span>
                    </div>

                    {/* Pending Fees Display */}
                    {selectedStudent && (
                        <div className="space-y-2 mt-4 pt-4 border-t border-slate-700">
                            {(() => {
                                const details = getStudentFeeDetails(selectedStudent);

                                // Dynamic UI for each Category inside Payment Summary
                                return details.map((d, idx) => (
                                    <div key={idx} className="flex justify-between text-slate-400 text-sm">
                                        <span>{d.type} Pending</span>
                                        <span className={d.pending > 0 ? "text-red-400" : "text-emerald-400"}>
                                            ₹{Math.max(0, d.pending).toLocaleString()}
                                        </span>
                                    </div>
                                )).concat(
                                    <div key="total" className="flex justify-between text-amber-400 font-bold text-lg mt-2 pt-2 border-t border-slate-700">
                                        <span>Total Pending</span>
                                        <span>₹{details.reduce((sum, d) => sum + Math.max(0, d.pending), 0).toLocaleString()}</span>
                                    </div>
                                );
                            })()}
                        </div>
                    )}

                    <div className="h-px bg-slate-700 my-2"></div>
                    <div className="flex justify-between text-xl font-bold">
                        <span>Paying Now</span>
                        <span>₹{totalPayingAmount || 0}</span>
                    </div>
                </div>

                <button
                    disabled={!selectedStudent || isProcessing || totalPayingAmount <= 0}
                    onClick={handlePreview}
                    className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isProcessing ? 'Processing...' : (
                        <>
                            <Banknote size={20} />
                            Preview & Pay
                        </>
                    )}
                </button>
            </div>
        </div>
    );


    // --- Detailed View Logic ---
    const [viewingStudent, setViewingStudent] = useState(null);
    const [reprintTransaction, setReprintTransaction] = useState(null);

    const getStudentFeeDetails = (student) => {
        if (!student) return [];

        const cls = student.className || student.class;

        // Filter applicable categories for this specific student from allCategories
        const applicableCategories = allCategories.filter(cat => {
            if (cat.hasSlabs) {
                const slabCount = student.conveyanceSlab ? parseInt(student.conveyanceSlab) : 0;
                return slabCount > 0;
            }
            const clsAmount = cat.amounts.find(a => a.className === cls);
            return clsAmount && clsAmount.amount > 0;
        });

        const studentDiscounts = student.discounts || [];

        const categories = applicableCategories.map(cat => {
            let grossAmount = 0;
            if (cat.hasSlabs) {
                const slabCount = student.conveyanceSlab ? parseInt(student.conveyanceSlab) : 0;
                if (slabCount > 0) {
                    grossAmount = (cat.baseAmount + (slabCount * cat.slabMultiplier)) * (cat.months || 10);
                }
            } else {
                const expectedObj = cat.amounts.find(a => a.className === cls);
                grossAmount = expectedObj ? expectedObj.amount : 0;
            }
            // Apply per-category discount
            const disc = studentDiscounts.find(d =>
                d.categoryId?.toString() === cat._id?.toString() ||
                d.categoryName?.toLowerCase() === cat.name.toLowerCase()
            );
            const discountAmt = disc?.discountAmount || 0;
            const dueAmount = Math.max(0, grossAmount - discountAmt);
            return {
                type: cat.name,
                grossAmount,
                discountAmount: discountAmt,
                due: dueAmount
            };
        });

        // Get all payments for this student
        const payments = transactions.filter(t => {
            const tStudentId = t.student?._id || t.student?.id || t.studentId || t.student;
            const sId = student.id || student._id;
            return String(tStudentId) === String(sId) && t.status === 'Paid';
        });

        const totalPaidAll = payments.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
        let allocatedAmount = 0;

        const result = categories.map(({ type, due }) => {
            const paidAmount = payments.reduce((sum, t) => {
                if (t.breakdown && t.breakdown.length > 0) {
                    const bItem = t.breakdown.find(b => b.feeType === type || b.type === type);
                    return sum + (bItem ? Number(bItem.amount) : 0);
                } else if (t.feeType === type || t.type === type) {
                    return sum + (Number(t.amount) || 0);
                }
                return sum;
            }, 0);

            allocatedAmount += paidAmount;

            return {
                type: type,
                due: due,
                paid: paidAmount,
                pending: Math.max(0, due - paidAmount),
                status: paidAmount >= due && due > 0 ? 'Paid' : paidAmount > 0 ? 'Partial' : 'Pending'
            };
        });

        // Add 'Other/Excess' if there are payments made to legacy categories
        if (totalPaidAll > allocatedAmount) {
            const extra = totalPaidAll - allocatedAmount;
            if (extra > 0) {
                result.push({
                    type: 'Archived/Legacy',
                    due: 0,
                    paid: extra,
                    pending: 0,
                    status: 'Paid'
                });
            }
        }

        return result;
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
                                {viewingStudent.conveyanceSlab && parseInt(viewingStudent.conveyanceSlab) > 0 && (
                                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
                                        Conveyance Slab: {viewingStudent.conveyanceSlab}
                                    </span>
                                )}
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
                                            <td className="px-4 py-3 text-right text-red-600 font-medium">₹{Math.max(0, item.pending).toLocaleString()}</td>
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

    // --- History Filters State ---
    const [historySubTab, setHistorySubTab] = useState('overview'); // 'overview' | 'class_view' | 'all'
    const [filterClass, setFilterClass] = useState('All');
    const [filterStudentId, setFilterStudentId] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterDateStart, setFilterDateStart] = useState('');
    const [filterDateEnd, setFilterDateEnd] = useState('');

    // --- Overview Tab State ---
    const [ovSearchTerm, setOvSearchTerm] = useState('');
    const [ovFilterClass, setOvFilterClass] = useState('All');
    const [ovFilterSection, setOvFilterSection] = useState('All');
    const [ovFilterCategory, setOvFilterCategory] = useState('All');
    const [ovFilterStatus, setOvFilterStatus] = useState('All');

    // Reset student filter when class changes
    useEffect(() => {
        setFilterStudentId('All');
    }, [filterClass]);

    const studentsByClass = useMemo(() => {
        return students.reduce((acc, s) => {
            const cls = s.className || s.class || 'Unknown';
            if (!acc[cls]) acc[cls] = [];
            acc[cls].push(s);
            return acc;
        }, {});
    }, [students]);

    const studentsInSelectedClass = useMemo(() => {
        if (filterClass === 'All') return [];
        return studentsByClass[filterClass] || [];
    }, [studentsByClass, filterClass]);

    // --- Filter Logic (Memoized for PDF) ---
    const filteredAllTransactions = useMemo(() => {
        return transactions.filter(t => {
            const tDate = new Date(t.paymentDate || t.createdAt);

            const matchesClass = filterClass === 'All' ||
                (t.student && (t.student.className === filterClass || t.student.class === filterClass));

            const matchesStudent = filterStudentId === 'All' || t.student?._id === filterStudentId;

            const matchesSearch = !searchQuery ||
                t.student?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                t.receiptNo?.toLowerCase().includes(searchQuery.toLowerCase());

            let matchesDate = true;
            if (filterDateStart) {
                const startDate = new Date(filterDateStart);
                matchesDate = matchesDate && tDate >= startDate;
            }
            if (filterDateEnd) {
                const endDate = new Date(filterDateEnd);
                endDate.setHours(23, 59, 59, 999);
                matchesDate = matchesDate && tDate <= endDate;
            }

            return matchesClass && matchesStudent && matchesSearch && matchesDate;
        });
    }, [transactions, filterClass, filterStudentId, searchQuery, filterDateStart, filterDateEnd]);

    // --- Overview Data Logic ---
    const overviewData = useMemo(() => {
        return students.map(student => {
            const cls = student.className || student.class;

            // Get all applicable fee categories for this student based on class/slabs
            const applicableCategories = allCategories.filter(cat => {
                if (cat.hasSlabs) {
                    const slabCount = student.conveyanceSlab ? parseInt(student.conveyanceSlab) : 0;
                    return slabCount > 0;
                }
                const clsAmount = cat.amounts.find(a => a.className === cls);
                return clsAmount && clsAmount.amount > 0;
            });

            // Get all successful transactions for this student
            const studentPayments = transactions.filter(t => {
                const tStudentId = t.student?._id || t.student?.id || t.studentId || t.student;
                const sId = student.id || student._id;
                return String(tStudentId) === String(sId) && t.status === 'Paid';
            });

            let totalDue = 0;
            let totalPaid = 0;
            let lastPaymentDate = null;

            if (ovFilterCategory !== 'All') {
                // Calculation for a SPECIFIC Category
                const targetCat = applicableCategories.find(c => c._id === ovFilterCategory);
                if (targetCat) {
                    // Calculate Due
                    if (targetCat.hasSlabs) {
                        const slabCount = student.conveyanceSlab ? parseInt(student.conveyanceSlab) : 0;
                        if (slabCount > 0) {
                            totalDue = (targetCat.baseAmount + (slabCount * targetCat.slabMultiplier)) * (targetCat.months || 10);
                        }
                    } else {
                        const classAmount = targetCat.amounts.find(a => a.className === cls);
                        if (classAmount) totalDue = classAmount.amount;
                    }

                    // Calculate Paid
                    studentPayments.forEach(t => {
                        if (t.breakdown && t.breakdown.length > 0) {
                            const bItem = t.breakdown.find(b => b.feeType === targetCat.name || b.type === targetCat.name);
                            if (bItem) {
                                totalPaid += Number(bItem.amount);
                                const tDate = new Date(t.paymentDate || t.createdAt);
                                if (!lastPaymentDate || tDate > lastPaymentDate) lastPaymentDate = tDate;
                            }
                        } else if (t.feeType === targetCat.name || t.type === targetCat.name) {
                            totalPaid += Number(t.amount);
                            const tDate = new Date(t.paymentDate || t.createdAt);
                            if (!lastPaymentDate || tDate > lastPaymentDate) lastPaymentDate = tDate;
                        }
                    });
                }
            } else {
                // Aggregated Calculation (ALL Categories)
                applicableCategories.forEach(cat => {
                    if (cat.hasSlabs) {
                        const slabCount = student.conveyanceSlab ? parseInt(student.conveyanceSlab) : 0;
                        if (slabCount > 0) {
                            totalDue += (cat.baseAmount + (slabCount * cat.slabMultiplier)) * (cat.months || 10);
                        }
                    } else {
                        const classAmount = cat.amounts.find(a => a.className === cls);
                        if (classAmount) totalDue += classAmount.amount;
                    }
                });

                studentPayments.forEach(t => {
                    totalPaid += Number(t.amount);
                    const tDate = new Date(t.paymentDate || t.createdAt);
                    if (!lastPaymentDate || tDate > lastPaymentDate) lastPaymentDate = tDate;
                });
            }

            const totalPending = Math.max(0, totalDue - totalPaid);

            // Determine Status based strictly on calculated Due vs Paid
            let status = 'Not Paid';
            if (totalPaid >= totalDue && totalDue > 0) {
                status = 'Fully Paid';
            } else if (totalPaid > 0) {
                status = 'Partially Paid';
            } else if (totalDue === 0) {
                status = 'Fully Paid'; // Technically no fee assigned means they don't owe anything.
            }

            return {
                ...student,
                displayClass: cls,
                rollNoStr: String(student.rollNo || ''),
                calcDue: totalDue,
                calcPaid: totalPaid,
                calcPending: totalPending,
                calcStatus: status,
                lastPaymentDate: lastPaymentDate
            };
        }).filter(s => {
            // Apply Overview Filters
            const matchesSearch = !ovSearchTerm ||
                s.name?.toLowerCase().includes(ovSearchTerm.toLowerCase()) ||
                s.admissionNo?.toLowerCase().includes(ovSearchTerm.toLowerCase());

            const matchesClass = ovFilterClass === 'All' || s.displayClass === ovFilterClass;
            const matchesSection = ovFilterSection === 'All' || s.section === ovFilterSection;
            const matchesStatus = ovFilterStatus === 'All' || s.calcStatus === ovFilterStatus;

            return matchesSearch && matchesClass && matchesSection && matchesStatus;
        }).sort((a, b) => {
            // Sort by Class (Asc) then Roll No (Asc)
            const classCompare = (a.displayClass || '').localeCompare(b.displayClass || '');
            if (classCompare !== 0) return classCompare;

            return a.rollNoStr.localeCompare(b.rollNoStr, undefined, { numeric: true, sensitivity: 'base' });
        });
    }, [students, transactions, allCategories, ovFilterClass, ovFilterSection, ovFilterCategory, ovFilterStatus, ovSearchTerm]);

    // Unique Sections for dropdown based on currently selected class
    const uniqueSections = useMemo(() => {
        if (ovFilterClass === 'All') return [];
        const sections = new Set();
        students.forEach(s => {
            if ((s.className === ovFilterClass || s.class === ovFilterClass) && s.section) {
                sections.add(s.section);
            }
        });
        return Array.from(sections).sort();
    }, [students, ovFilterClass]);

    const downloadPDF = () => {
        const doc = new jsPDF();

        // Header
        doc.setFontSize(18);
        doc.setTextColor(40, 40, 100);
        doc.text('STEM Global Public School', 14, 22);

        doc.setFontSize(14);
        doc.setTextColor(60, 60, 60);
        doc.text('Fee Transactions Report', 14, 32);

        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 40);

        // Filter Summary
        let filterSummary = [`Class: ${filterClass}`];
        if (filterStudentId !== 'All') {
            const student = studentsInSelectedClass.find(s => s._id === filterStudentId);
            if (student) filterSummary.push(`Student: ${student.name}`);
        }
        if (searchQuery) filterSummary.push(`Search: "${searchQuery}"`);
        if (filterDateStart || filterDateEnd) {
            filterSummary.push(`Date: ${filterDateStart || 'Start'} - ${filterDateEnd || 'End'}`);
        }
        doc.text(filterSummary.join(' | '), 14, 48);

        // Helper to format currency
        const formatCurrency = (amount) => `Rs. ${amount.toLocaleString()}`;

        // Table Headers and Data
        const tableColumn = ["Date", "Receipt No", "Student", "Class", "Type", "Mode", "Status", "Amount"];
        const tableRows = filteredAllTransactions.map(t => [
            new Date(t.paymentDate || t.createdAt).toLocaleDateString(),
            t.receiptNo || '-',
            t.student?.name || 'Unknown',
            t.student?.className || t.student?.class || '-',
            t.type || '-',
            t.paymentMode || '-',
            t.status,
            formatCurrency(t.amount || 0)
        ]);

        // Generate Table
        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 55,
            theme: 'grid',
            headStyles: { fillColor: [79, 70, 229], textColor: 255 }, // Indigo-600
            styles: { fontSize: 9, cellPadding: 3 },
            columnStyles: {
                7: { halign: 'right', fontStyle: 'bold' } // Amount column is now index 7
            },
            didDrawPage: (data) => {
                // Footer
                const pageCount = doc.internal.getNumberOfPages();
                doc.setFontSize(8);
                doc.text('Page ' + pageCount, data.settings.margin.left, doc.internal.pageSize.height - 10);
            }
        });

        doc.save(`Transactions_${new Date().toISOString().slice(0, 10)}.pdf`);
    };

    const downloadOverviewPDF = () => {
        const doc = new jsPDF();

        // Header
        doc.setFontSize(18);
        doc.setTextColor(40, 40, 100);
        doc.text('STEM Global Public School', 14, 22);

        doc.setFontSize(14);
        doc.setTextColor(60, 60, 60);
        doc.text('Student-wise Fee Tracking Report', 14, 32);

        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 40);

        // Filter Summary
        let filterParts = [];
        if (ovFilterClass !== 'All') filterParts.push(`Class: ${ovFilterClass}`);
        if (ovFilterSection !== 'All') filterParts.push(`Section: ${ovFilterSection}`);
        if (ovFilterCategory !== 'All') {
            const cat = allCategories.find(c => c._id === ovFilterCategory);
            filterParts.push(`Category: ${cat ? cat.name : 'Unknown'}`);
        }
        if (ovFilterStatus !== 'All') filterParts.push(`Status: ${ovFilterStatus}`);
        if (ovSearchTerm) filterParts.push(`Search: "${ovSearchTerm}"`);

        if (filterParts.length > 0) {
            doc.setFontSize(9);
            doc.setTextColor(80, 80, 80);
            doc.text(`Applied Filters: ${filterParts.join(' | ')}`, 14, 48);
        }

        const tableColumn = ["Roll No", "Student Name", "Class (Sec)", "Total Due", "Paid", "Pending", "Status"];
        const tableRows = overviewData.map(s => [
            s.rollNo || '-',
            s.name,
            `${s.displayClass} (${s.section || '-'})`,
            `Rs. ${s.calcDue.toLocaleString()}`,
            `Rs. ${s.calcPaid.toLocaleString()}`,
            `Rs. ${s.calcPending.toLocaleString()}`,
            s.calcStatus
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: filterParts.length > 0 ? 55 : 45,
            theme: 'grid',
            headStyles: { fillColor: [79, 70, 229], textColor: 255 },
            styles: { fontSize: 8, cellPadding: 2 },
            columnStyles: {
                3: { halign: 'right' },
                4: { halign: 'right' },
                5: { halign: 'right' },
                6: { halign: 'center' }
            },
            didDrawPage: (data) => {
                const pageCount = doc.internal.getNumberOfPages();
                doc.setFontSize(8);
                doc.text('Page ' + pageCount, data.settings.margin.left, doc.internal.pageSize.height - 10);
            }
        });

        // Add Summary Totals at the end if space permits or on new page
        const finalY = doc.lastAutoTable.finalY + 10;
        const totalDue = overviewData.reduce((sum, s) => sum + s.calcDue, 0);
        const totalPaid = overviewData.reduce((sum, s) => sum + s.calcPaid, 0);
        const totalPending = overviewData.reduce((sum, s) => sum + s.calcPending, 0);

        doc.setFontSize(10);
        doc.setTextColor(40, 40, 40);
        doc.text(`Grand Total Due: Rs. ${totalDue.toLocaleString()}`, 14, finalY);
        doc.text(`Grand Total Paid: Rs. ${totalPaid.toLocaleString()}`, 80, finalY);
        doc.text(`Grand Total Pending: Rs. ${totalPending.toLocaleString()}`, 140, finalY);

        doc.save(`Fee_Tracking_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
    };

    const generateClassReport = (className, studentsInClass) => {
        const doc = new jsPDF();

        // Header
        doc.setFontSize(18);
        doc.setTextColor(40, 40, 100);
        doc.text('STEM Global Public School', 14, 22);

        doc.setFontSize(14);
        doc.setTextColor(60, 60, 60);
        doc.text(`Class Fee Report - ${className}`, 14, 32);

        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 40);

        const tableColumn = ["Admission No", "Student Name", "Total Fee", "Paid", "Pending", "Status"];

        // Calculate totals and build rows
        let totalClassFee = 0;
        let totalClassPaid = 0;
        let totalClassPending = 0;

        const tableRows = [];
        studentsInClass.forEach(student => {
            const details = getStudentFeeDetails(student);
            const totalDue = details.reduce((sum, d) => sum + d.due, 0);
            const totalPaid = details.reduce((sum, d) => sum + d.paid, 0);
            const totalPending = totalDue - totalPaid;

            totalClassFee += totalDue;
            totalClassPaid += totalPaid;
            totalClassPending += totalPending;

            // 1. Student Summary Row (Main Row)
            tableRows.push([
                student.admissionNo || '-',
                student.name,
                `Rs. ${totalDue.toLocaleString()}`,
                `Rs. ${totalPaid.toLocaleString()}`,
                `Rs. ${Math.max(0, totalPending).toLocaleString()}`,
                student.feesStatus || 'Pending'
            ]);

            // 2. Breakdown Rows (Sub-Rows)
            details.forEach(fee => {
                // Only show rows that have some value to keep report concise
                if (fee.due > 0 || fee.paid > 0) {
                    tableRows.push([
                        "", // Empty for hierarchy
                        `  • ${fee.type}`, // Indented bullet
                        `Rs. ${fee.due.toLocaleString()}`,
                        `Rs. ${fee.paid.toLocaleString()}`,
                        `Rs. ${Math.max(0, fee.pending).toLocaleString()}`,
                        fee.status
                    ]);
                }
            });
        });

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 50,
            theme: 'grid',
            headStyles: { fillColor: [79, 70, 229], textColor: 255 },
            styles: { fontSize: 9, cellPadding: 3 },
            columnStyles: {
                2: { halign: 'right' },
                3: { halign: 'right' },
                4: { halign: 'right' }
            },
            didParseCell: (data) => {
                // Identification of sub-rows: Admission No is empty and Type starts with bullet
                const isSubRow = data.section === 'body' && Array.isArray(data.row.raw) && data.row.raw[0] === "" && String(data.row.raw[1]).includes('•');

                if (isSubRow) {
                    data.cell.styles.fontSize = 8;
                    data.cell.styles.textColor = [100, 100, 100];
                    if (data.column.index === 1) data.cell.styles.fontStyle = 'italic';
                } else if (data.section === 'body') {
                    // Styling for main student row
                    if (data.column.index === 1) data.cell.styles.fontStyle = 'bold';
                    if (data.column.index === 3) data.cell.styles.textColor = [22, 163, 74]; // Green
                    if (data.column.index === 4) {
                        data.cell.styles.textColor = [220, 38, 38]; // Red
                        data.cell.styles.fontStyle = 'bold';
                    }
                }
            }
        });

        // Summary Footer
        const finalY = doc.lastAutoTable.finalY + 10;
        doc.setFontSize(11);
        doc.text(`Total Due: Rs. ${totalClassFee.toLocaleString()}`, 14, finalY);
        doc.text(`Total Paid: Rs. ${totalClassPaid.toLocaleString()}`, 80, finalY);
        doc.text(`Total Pending: Rs. ${totalClassPending.toLocaleString()}`, 150, finalY);

        doc.save(`FeeReport_${className}.pdf`);
    };

    const renderHistoryTab = () => {
        // --- Segregation Logic ---
        const recentTransactions = transactions.slice(0, 5); // Just top 5

        // Unique classes for Dropdown
        const requestedClasses = ['Mont 1', 'Mont 2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5'];
        const dynamicClasses = transactions
            .map(t => t.student?.className || t.student?.class)
            .filter(Boolean)
            .filter(c => !c.startsWith('Class ')); // Exclude legacy 'Class' labels
        const uniqueClasses = ['All', ...new Set([...requestedClasses, ...dynamicClasses])].sort((a, b) => {
            // Helper sort
            const getOrder = (c) => {
                if (c === 'All') return -1;
                if (c === 'Mont 1') return 1;
                if (c === 'Mont 2') return 2;
                if (c.startsWith('Grade')) return (parseInt(c.split(' ')[1]) || 0) + 10;
                if (c.startsWith('KG')) return 5;
                if (c.startsWith('Class')) return parseInt(c.split(' ')[1]) || 20;
                return 100;
            };
            return getOrder(a) - getOrder(b);
        });

        // Group Students by Class (for Class-wise View)
        const studentsByClass = students.reduce((acc, s) => {
            const cls = s.className || s.class || 'Unknown';
            if (!acc[cls]) acc[cls] = [];
            acc[cls].push(s);
            return acc;
        }, {});

        // Sort Classes
        const sortedClasses = Object.keys(studentsByClass).sort((a, b) => {
            const getOrder = (c) => {
                if (c === 'All') return -1;
                if (c === 'Mont 1') return 1;
                if (c === 'Mont 2') return 2;
                if (c.startsWith('Grade')) return (parseInt(c.split(' ')[1]) || 0) + 10;
                if (c.startsWith('KG')) return 5;
                if (c.startsWith('Class')) return parseInt(c.split(' ')[1]) || 20;
                return 100;
            };
            return getOrder(a) - getOrder(b);
        });

        return (
            <div className="space-y-8 animate-in fade-in">
                {/* Stats Cards - Always Visible */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
                        <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg">
                            <Wallet size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Total Collected</p>
                            <h3 className="text-2xl font-bold text-slate-900">₹{stats.collected.toLocaleString()}</h3>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
                        <div className="p-3 bg-red-100 text-red-600 rounded-lg">
                            <IndianRupee size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500">Total Pending</p>
                            <h3 className="text-2xl font-bold text-slate-900">₹{stats.pending.toLocaleString()}</h3>
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

                {/* Sub-Tabs */}
                <div className="flex items-center gap-4 border-b border-slate-200 overflow-x-auto">
                    <button
                        onClick={() => setHistorySubTab('overview')}
                        className={`pb-2 text-sm font-medium transition-colors relative whitespace-nowrap ${historySubTab === 'overview' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Overview
                        {historySubTab === 'overview' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full"></div>}
                    </button>
                    <button
                        onClick={() => setHistorySubTab('class_view')}
                        className={`pb-2 text-sm font-medium transition-colors relative whitespace-nowrap ${historySubTab === 'class_view' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Class-wise Collections
                        {historySubTab === 'class_view' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full"></div>}
                    </button>
                    <button
                        onClick={() => setHistorySubTab('all')}
                        className={`pb-2 text-sm font-medium transition-colors relative whitespace-nowrap ${historySubTab === 'all' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        All Transactions
                        {historySubTab === 'all' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full"></div>}
                    </button>
                </div>

                {historySubTab === 'overview' && (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in">
                        {/* Filters Header */}
                        <div className="bg-slate-50 border-b border-slate-200 p-4">
                            <div className="flex flex-col md:flex-row gap-4 items-end">
                                <div className="flex-1 w-full relative">
                                    <label className="block text-xs font-semibold text-slate-500 mb-1">Search Student</label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                        <input
                                            type="text"
                                            placeholder="Name or Admission No..."
                                            value={ovSearchTerm}
                                            onChange={(e) => setOvSearchTerm(e.target.value)}
                                            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="w-full md:w-32">
                                    <label className="block text-xs font-semibold text-slate-500 mb-1">Class</label>
                                    <select
                                        value={ovFilterClass}
                                        onChange={(e) => {
                                            setOvFilterClass(e.target.value);
                                            setOvFilterSection('All'); // Reset section when class changes
                                        }}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                                    >
                                        {uniqueClasses.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div className="w-full md:w-24">
                                    <label className="block text-xs font-semibold text-slate-500 mb-1">Section</label>
                                    <select
                                        value={ovFilterSection}
                                        onChange={(e) => setOvFilterSection(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                                        disabled={ovFilterClass === 'All'}
                                    >
                                        <option value="All">All</option>
                                        {uniqueSections.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div className="w-full md:w-48">
                                    <label className="block text-xs font-semibold text-slate-500 mb-1">Fee Category</label>
                                    <select
                                        value={ovFilterCategory}
                                        onChange={(e) => setOvFilterCategory(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                                    >
                                        <option value="All">All Categories</option>
                                        {allCategories.map(cat => (
                                            <option key={cat._id} value={cat._id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="w-full md:w-40">
                                    <label className="block text-xs font-semibold text-slate-500 mb-1">Status</label>
                                    <select
                                        value={ovFilterStatus}
                                        onChange={(e) => setOvFilterStatus(e.target.value)}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                                    >
                                        <option value="All">All Status</option>
                                        <option value="Fully Paid">Fully Paid</option>
                                        <option value="Partially Paid">Partially Paid</option>
                                        <option value="Not Paid">Not Paid</option>
                                    </select>
                                </div>
                                <div className="w-full md:w-auto">
                                    <button
                                        onClick={downloadOverviewPDF}
                                        disabled={overviewData.length === 0}
                                        className="h-10 px-4 flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                    >
                                        <Download size={18} />
                                        Download Report
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto min-h-[400px]">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4 whitespace-nowrap">Roll No</th>
                                        <th className="px-6 py-4 whitespace-nowrap">Student Name</th>
                                        <th className="px-6 py-4 whitespace-nowrap">Class (Sec)</th>
                                        <th className="px-6 py-4 text-right whitespace-nowrap">Total Fee</th>
                                        <th className="px-6 py-4 text-right whitespace-nowrap">Paid Amount</th>
                                        <th className="px-6 py-4 text-right whitespace-nowrap">Pending Amount</th>
                                        <th className="px-6 py-4 text-center whitespace-nowrap">Status</th>
                                        <th className="px-6 py-4 text-right whitespace-nowrap">Last Payment</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-sm bg-white">
                                    {loadingHistory ? (
                                        <tr>
                                            <td colSpan="8" className="px-6 py-12 text-center text-slate-500">
                                                <div className="flex flex-col items-center justify-center">
                                                    <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                                                    <span>Calculating fees...</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : overviewData.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" className="px-6 py-12 text-center text-slate-500">
                                                No students found matching the selected filters.
                                            </td>
                                        </tr>
                                    ) : (
                                        overviewData.map(student => (
                                            <tr key={student._id || student.id} className="hover:bg-slate-50/70 transition-colors group cursor-pointer" onClick={() => setViewingStudent(student)}>
                                                <td className="px-6 py-4 font-mono text-slate-500 text-xs">{student.rollNo || '-'}</td>
                                                <td className="px-6 py-4">
                                                    <div className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">{student.name}</div>
                                                    <div className="text-xs text-slate-500 font-mono">{student.admissionNo}</div>
                                                </td>
                                                <td className="px-6 py-4 text-slate-700">
                                                    {student.displayClass} <span className="text-slate-400">({student.section || '-'})</span>
                                                </td>
                                                <td className="px-6 py-4 text-right font-medium text-slate-700">₹{student.calcDue.toLocaleString()}</td>
                                                <td className="px-6 py-4 text-right font-bold text-emerald-600">₹{student.calcPaid.toLocaleString()}</td>
                                                <td className="px-6 py-4 text-right font-bold text-red-600">
                                                    {student.calcPending > 0 ? `₹${student.calcPending.toLocaleString()}` : '0'}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap
                                                        ${student.calcStatus === 'Fully Paid' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                                                            student.calcStatus === 'Partially Paid' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                                                                'bg-red-100 text-red-700 border border-red-200'
                                                        }`}>
                                                        {student.calcStatus}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right text-xs text-slate-500 whitespace-nowrap">
                                                    {student.lastPaymentDate ? student.lastPaymentDate.toLocaleDateString() : '-'}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="bg-slate-50 border-t border-slate-200 p-4 text-xs text-slate-500 flex justify-between items-center">
                            <span>Showing {overviewData.length} records</span>
                            {overviewData.length > 0 && (
                                <div className="flex gap-4 font-medium">
                                    <span className="text-slate-700">Total Due: ₹{overviewData.reduce((sum, s) => sum + s.calcDue, 0).toLocaleString()}</span>
                                    <span className="text-emerald-600">Total Paid: ₹{overviewData.reduce((sum, s) => sum + s.calcPaid, 0).toLocaleString()}</span>
                                    <span className="text-red-600">Total Pending: ₹{overviewData.reduce((sum, s) => sum + s.calcPending, 0).toLocaleString()}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {historySubTab === 'class_view' && (
                    <div className="space-y-4 animate-in fade-in">
                        <h3 className="text-lg font-bold text-slate-900 px-1">Class-wise Collections</h3>
                        <div className="grid grid-cols-1 gap-4">
                            {sortedClasses.map(className => {
                                const studentsInClass = studentsByClass[className];

                                // Calculate Class Financials
                                let clsCollected = 0;
                                let clsPending = 0;
                                let clsTotalFee = 0;

                                studentsInClass.forEach(s => {
                                    const details = getStudentFeeDetails(s);
                                    const totalDue = details.reduce((sum, d) => sum + d.due, 0);
                                    const totalPaid = details.reduce((sum, d) => sum + d.paid, 0);
                                    const totalPending = totalDue - totalPaid;

                                    clsTotalFee += totalDue;
                                    clsCollected += totalPaid;
                                    clsPending += Math.max(0, totalPending);
                                });

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
                                                    <p className="text-sm text-slate-500">{studentsInClass.length} Students</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-6 text-right items-center">
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
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        generateClassReport(className, studentsInClass);
                                                    }}
                                                    className="ml-4 p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg border border-indigo-200 hover:border-indigo-300 transition-colors flex items-center gap-2"
                                                    title="Print Class Report"
                                                >
                                                    <Printer size={18} />
                                                    <span className="text-sm font-semibold">Print Report</span>
                                                </button>
                                            </div>
                                        </div>

                                        {/* Expanded Content: Student List */}
                                        {isExpanded && (
                                            <div className="border-t border-slate-100 bg-slate-50/30 animate-in slide-in-from-top-2">
                                                <table className="w-full text-left">
                                                    <thead className="text-xs text-slate-500 border-b border-slate-200 bg-slate-50">
                                                        <tr>
                                                            <th className="px-6 py-3 font-medium">Student Name</th>
                                                            <th className="px-6 py-3 font-medium">Admission No</th>
                                                            <th className="px-6 py-3 font-medium text-right">Total Fee</th>
                                                            <th className="px-6 py-3 font-medium text-right">Paid</th>
                                                            <th className="px-6 py-3 font-medium text-right">Pending</th>
                                                            <th className="px-6 py-3 font-medium text-center">Status</th>
                                                            <th className="px-6 py-3 font-medium text-center">Action</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100 text-sm bg-white">
                                                        {studentsInClass.map(s => {
                                                            const details = getStudentFeeDetails(s);
                                                            const totalDue = details.reduce((sum, d) => sum + d.due, 0);
                                                            const totalPaid = details.reduce((sum, d) => sum + d.paid, 0);
                                                            const totalPending = totalDue - totalPaid;

                                                            return (
                                                                <tr key={s._id || s.id} className="hover:bg-slate-50">
                                                                    <td className="px-6 py-3 font-medium text-slate-900">{s.name}</td>
                                                                    <td className="px-6 py-3 text-slate-500 font-mono text-xs">{s.admissionNo}</td>
                                                                    <td className="px-6 py-3 text-right text-slate-600">₹{totalDue.toLocaleString()}</td>
                                                                    <td className="px-6 py-3 text-right font-semibold text-emerald-600">₹{totalPaid.toLocaleString()}</td>
                                                                    <td className="px-6 py-3 text-right font-bold text-red-600">₹{Math.max(0, totalPending).toLocaleString()}</td>
                                                                    <td className="px-6 py-3 text-center">
                                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium 
                                                                            ${s.feesStatus === 'Paid' ? 'bg-emerald-100 text-emerald-700' :
                                                                                s.feesStatus === 'Overdue' ? 'bg-red-100 text-red-700' :
                                                                                    'bg-yellow-100 text-yellow-700'}`}>
                                                                            {s.feesStatus || 'Pending'}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-6 py-3 text-center">
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setViewingStudent(s);
                                                                            }}
                                                                            className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-indigo-600 transition-colors"
                                                                            title="View Info"
                                                                        >
                                                                            <Info size={18} />
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {historySubTab === 'all' && (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in">
                        {/* Filters */}
                        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-wrap gap-4 items-center">
                            {/* Search Box */}
                            <div className="relative flex-1 min-w-[200px] max-w-sm">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search student or receipt..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <label className="text-sm font-medium text-slate-600">Class:</label>
                                <select
                                    value={filterClass}
                                    onChange={(e) => setFilterClass(e.target.value)}
                                    className="px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                    {uniqueClasses.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>

                            {/* Student Filter */}
                            {filterClass !== 'All' && (
                                <div className="flex items-center gap-2 animate-in slide-in-from-left-2">
                                    <label className="text-sm font-medium text-slate-600">Student:</label>
                                    <select
                                        value={filterStudentId}
                                        onChange={(e) => setFilterStudentId(e.target.value)}
                                        className="px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 outline-none max-w-[200px]"
                                    >
                                        <option value="All">All Students</option>
                                        {studentsInSelectedClass.map(s => (
                                            <option key={s._id} value={s._id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="flex items-center gap-2">
                                <label className="text-sm font-medium text-slate-600">Date Range:</label>
                                <input
                                    type="date"
                                    value={filterDateStart}
                                    onChange={(e) => setFilterDateStart(e.target.value)}
                                    className="px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                                <span className="text-slate-400">-</span>
                                <input
                                    type="date"
                                    value={filterDateEnd}
                                    onChange={(e) => setFilterDateEnd(e.target.value)}
                                    className="px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            {(filterClass !== 'All' || filterStudentId !== 'All' || searchQuery || filterDateStart || filterDateEnd) && (
                                <button
                                    onClick={() => {
                                        setFilterClass('All');
                                        setFilterStudentId('All');
                                        setSearchQuery('');
                                        setFilterDateStart('');
                                        setFilterDateEnd('');
                                    }}
                                    className="text-sm text-red-500 hover:text-red-600 font-medium transition-colors"
                                >
                                    Clear Filters
                                </button>
                            )}

                            {/* Download PDF Button */}
                            <button
                                onClick={downloadPDF}
                                className="ml-auto flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-indigo-100 transition-colors border border-indigo-200"
                            >
                                <Download size={16} />
                                Download PDF
                            </button>
                        </div>

                        {/* Full Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-50 text-slate-600 text-xs font-bold uppercase">
                                    <tr>
                                        <th className="px-6 py-3">Date</th>
                                        <th className="px-6 py-3">Receipt No</th>
                                        <th className="px-6 py-3">Student</th>
                                        <th className="px-6 py-3">Class</th>
                                        <th className="px-6 py-3">Mode</th>
                                        <th className="px-6 py-3 text-right">Amount</th>
                                        <th className="px-6 py-3 text-center">Status</th>
                                        <th className="px-6 py-3 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-sm">
                                    {loadingHistory ? (
                                        <tr><td colSpan="8" className="px-6 py-8 text-center text-slate-500">Loading...</td></tr>
                                    ) : filteredAllTransactions.length === 0 ? (
                                        <tr><td colSpan="8" className="px-6 py-10 text-center text-slate-500">No transactions match the criteria.</td></tr>
                                    ) : (
                                        filteredAllTransactions.map((t) => (
                                            <tr key={t._id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-3 text-slate-600">{new Date(t.paymentDate || t.createdAt).toLocaleDateString()}</td>
                                                <td className="px-6 py-3 text-slate-500 text-xs font-mono">{t.receiptNo || '-'}</td>
                                                <td className="px-6 py-3 font-medium text-slate-900">{t.student?.name || 'Unknown'}</td>
                                                <td className="px-6 py-3 text-slate-600">{t.student ? `${t.student.className || t.student.class || ''}` : '-'}</td>
                                                <td className="px-6 py-3 text-slate-600">{t.paymentMode}</td>
                                                <td className="px-6 py-3 text-right font-bold text-slate-700">₹{t.amount?.toLocaleString()}</td>
                                                <td className="px-6 py-3 text-center">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${t.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{t.status}</span>
                                                </td>
                                                <td className="px-6 py-3 text-center">
                                                    <div className="flex justify-center gap-2">
                                                        <button
                                                            onClick={() => setViewingStudent(t.student)}
                                                            className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-indigo-600 transition-colors"
                                                            title="View Details"
                                                        >
                                                            <Info size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => setReprintTransaction(t)}
                                                            className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-indigo-600 transition-colors"
                                                            title="Download Receipt"
                                                        >
                                                            <Download size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 text-right">
                            Showing {filteredAllTransactions.length} records
                        </div>
                    </div>
                )}
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

                {/* Tabs & Settings */}
                <div className="flex items-center gap-2">
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

                    <button
                        onClick={() => navigate('/admin/system-settings', { state: { tab: 'fees' } })}
                        title="Fee Configuration"
                        className="p-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 hover:text-indigo-600 transition-colors shadow-sm ml-2"
                    >
                        <Settings size={20} />
                    </button>
                </div>
            </div>

            {showReceipt ? renderReceipt() : (
                activeTab === 'collect' ? renderCollectionTab() : renderHistoryTab()
            )}

            {/* Fee Details Modal */}
            {renderReprintModal()}
            {renderFeeDetailsModal()}
        </div>
    );
}
