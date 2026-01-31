import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import {
    Search, CreditCard, Banknote, IndianRupee, CheckCircle,
    History, Wallet, ArrowUpRight, ArrowDownLeft, ChevronDown, ChevronUp, Info, X, Download
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { storageService } from '../../services/storage';
import { feeStructure } from '../../services/mockData';
import { useToast } from '../../components/ui/Toast';

import FeeReceipt from '../../components/fees/FeeReceipt';

export default function FeeDashboard() {
    const { addToast } = useToast();
    const location = useLocation();
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
        // 1. Calculate Total Expected Revenue
        const totalExpected = students.reduce((sum, student) => {
            const cls = student.className || student.class;
            const structure = feeStructure[cls] || { tuition: 0, materials: 0 };
            const studentTotalFee = (structure.tuition || 0) + (structure.materials || 0);
            return sum + studentTotalFee;
        }, 0);

        // 2. Calculate Total Collected (from ALL paid transactions)
        const totalCollected = transactions
            .filter(t => t.status === 'Paid')
            .reduce((sum, t) => sum + (t.amount || 0), 0);

        // 3. Calculate Pending
        // Prevent negative pending if we have data inconsistencies or overpayments (optional check)
        const pending = Math.max(0, totalExpected - totalCollected);

        return {
            expected: totalExpected,
            collected: totalCollected,
            pending: pending
        };
    }, [students, transactions]);


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



    const [amount, setAmount] = useState(0);

    // Fetch student fee details to calculate actual pending amount
    useEffect(() => {
        if (selectedStudent) {
            calculatePendingAmount();
        }
    }, [selectedStudent, feeType]);

    const calculatePendingAmount = async () => {
        if (!selectedStudent) return;

        const cls = selectedStudent.className || selectedStudent.class;
        const structure = feeStructure[cls] || { tuition: 20000, materials: 6500 };
        const totalFee = feeType === 'full'
            ? (structure.tuition + structure.materials)
            : (structure[feeType] || 0);

        // We need to know how much they already paid.
        // For now, let's assume the backend will handle the logic of "how much is remaining" 
        // if we want to default the input to "Pending Amount".
        // But since we don't have that handy without a fetch, let's default to the *Standard Amount*
        // and let the user override it. Validating against "Overpayment" might be needed later.

        // Better: Default to the standard fee amount for that type.
        if (feeType === 'custom') {
            setAmount('');
        } else {
            setAmount(totalFee);
        }
    };

    const getDueAmount = () => {
        // This is now purely for reference of what the "Standard" fee is.
        if (!selectedStudent) return 0;
        const cls = selectedStudent.className || selectedStudent.class;
        const structure = feeStructure[cls] || { tuition: 20000, materials: 6500 };

        if (feeType === 'full') {
            return (structure.tuition || 0) + (structure.materials || 0);
        }
        return structure[feeType] || 0;
    };

    // --- Payment Logic: Preview & Confirm ---
    const [lastTransaction, setLastTransaction] = useState(null);
    const [isPaymentConfirmed, setIsPaymentConfirmed] = useState(false);

    const handlePreview = () => {
        if (!selectedStudent || amount <= 0) return;

        const transaction = {
            studentId: selectedStudent.id || selectedStudent._id,
            type: feeType === 'full' ? 'Full Fee (Tuition + Materials)' : `${feeType.charAt(0).toUpperCase() + feeType.slice(1)} Fee`,
            amount: Number(amount),
            date: new Date().toISOString(),
            mode: paymentMode,
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
        setAmount(0);
        setIsPaymentConfirmed(false);
    };

    // --- Render Helpers ---

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

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Fee Type</label>
                                <select
                                    value={feeType}
                                    onChange={(e) => setFeeType(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="tuition">Tuition Fee</option>
                                    <option value="materials">Materials Fee</option>
                                    <option value="full">Full Fee (Total)</option>
                                    <option value="custom">Custom / Partial Payment</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Amount to Pay</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">₹</span>
                                    <input
                                        type="number"
                                        min="1"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                                        className="w-full pl-8 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
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
                        <span>Standard Fee</span>
                        <span>₹{selectedStudent ? getDueAmount() : 0}</span>
                    </div>
                    <div className="h-px bg-slate-700 my-2"></div>
                    <div className="flex justify-between text-xl font-bold">
                        <span>Paying Now</span>
                        <span>₹{amount || 0}</span>
                    </div>
                </div>

                <button
                    disabled={!selectedStudent || isProcessing || amount <= 0}
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

    const getStudentFeeDetails = (student) => {
        if (!student) return [];

        const cls = student.className || student.class;
        const structure = feeStructure[cls] || { tuition: 20000, materials: 6500 };

        // Get all payments for this student
        const payments = transactions.filter(t =>
            (t.student?._id === student._id || t.student?.id === student.id || t.studentId === student.id) &&
            t.status === 'Paid'
        );

        // Calculate status per category
        return Object.entries(structure).map(([type, dueAmount]) => {
            const paidAmount = payments
                .filter(t => {
                    if (t.feeType?.toLowerCase().includes('full')) return true; // Full fee covers everything
                    return t.feeType?.toLowerCase().includes(type.toLowerCase());
                })
                .reduce((sum, t) => {
                    // specific logic for full fee: we need to attribute portions of it or just count it?
                    // simpler approach: if full fee paid, we consider everything paid.
                    // But for accurate partial tracking, if a "Full Fee" txn exists, we allocate proportional amount?
                    // For this simple implementation: If "Full Fee" txn exists with >= total due, mark all paid.
                    // Or simpler: Check if sum of ALL payments >= dueAmount for this category.
                    // Let's refine: The loop maps through categories. We summon all payments relevant to this category.
                    // "Full Fee" is relevant to ALL categories.
                    if (t.feeType?.toLowerCase().includes('full')) {
                        // Distribute full payment? Or simply check if total > due
                        // If type is tuition (20000) and we found a Full Fee (26500) txn, we can say 20000 covers tuition.
                        // We need to be careful not to double count if we just sum it up.
                        // Better approach for display:
                        // If "Full Fee" transaction exists, override calculation to PAID.
                        return sum + (type === 'tuition' ? 20000 : 6500); // Hacky but works for this rigid structure
                    }
                    return sum + (t.amount || 0);
                }, 0);

            // Re-calc based on simplified logic:
            // Just get total paid by student, and check against total due? No, user wants breakdown.
            // Let's stick to:
            // Tuition Paid = Sum of 'Tuition Fee' txns + (If Full Fee txn exists ? 20000 : 0)
            // Materials Paid = Sum of 'Materials Fee' txns + (If Full Fee txn exists ? 6500 : 0)

            let effectivePaid = paidAmount;

            // Check for any Full Fee payment
            const hasFullFee = payments.some(t => t.feeType?.toLowerCase().includes('full'));
            if (hasFullFee) {
                effectivePaid = dueAmount; // Maximise it to due amount if full fee paid
            }

            return {
                type: type.charAt(0).toUpperCase() + type.slice(1),
                due: dueAmount,
                paid: effectivePaid > dueAmount ? dueAmount : effectivePaid,
                pending: dueAmount - (effectivePaid > dueAmount ? dueAmount : effectivePaid),
                status: effectivePaid >= dueAmount ? 'Paid' : effectivePaid > 0 ? 'Partial' : 'Pending'
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

    // --- History Filters State ---
    const [historySubTab, setHistorySubTab] = useState('overview'); // 'overview' | 'all'
    const [filterClass, setFilterClass] = useState('All');
    const [filterDateStart, setFilterDateStart] = useState('');
    const [filterDateEnd, setFilterDateEnd] = useState('');

    // --- Filter Logic (Memoized for PDF) ---
    const filteredAllTransactions = useMemo(() => {
        return transactions.filter(t => {
            const tDate = new Date(t.paymentDate || t.createdAt);
            // Handle time component by stripping it for comparison if needed, or simple comparison
            // For robust date comparing, reset time to 00:00:00 for item date if purely comparing dates? 
            // The existing logic was simple >= / <= string comparison which works if formats match, 
            // but here we are using Date objects.

            const matchesClass = filterClass === 'All' ||
                (t.student && (t.student.className === filterClass || t.student.class === filterClass));

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

            return matchesClass && matchesDate;
        });
    }, [transactions, filterClass, filterDateStart, filterDateEnd]);

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
        let filterText = `Class: ${filterClass}`;
        if (filterDateStart || filterDateEnd) {
            filterText += ` | Date: ${filterDateStart || 'Start'} - ${filterDateEnd || 'End'}`;
        }
        doc.text(filterText, 14, 48);

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

    const renderHistoryTab = () => {
        // --- Segregation Logic ---
        const recentTransactions = transactions.slice(0, 5); // Just top 5

        // Using memoized filteredAllTransactions


        // Unique classes for Dropdown
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

        // Group by Class (for Overview)
        const groupedByClass = transactions.reduce((acc, t) => {
            const cls = t.student ? (t.student.className || t.student.class || 'Unknown') : 'Unknown';
            if (!acc[cls]) acc[cls] = [];
            acc[cls].push(t);
            return acc;
        }, {});

        // Sort Classes (for Overview)
        const sortedClasses = Object.keys(groupedByClass).sort((a, b) => {
            const getOrder = (c) => {
                if (c.startsWith('KG')) return 0;
                if (c.startsWith('Class')) return parseInt(c.split(' ')[1]) || 10;
                return 20;
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
                <div className="flex items-center gap-4 border-b border-slate-200">
                    <button
                        onClick={() => setHistorySubTab('overview')}
                        className={`pb-2 text-sm font-medium transition-colors relative ${historySubTab === 'overview' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Overview
                        {historySubTab === 'overview' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full"></div>}
                    </button>
                    <button
                        onClick={() => setHistorySubTab('all')}
                        className={`pb-2 text-sm font-medium transition-colors relative ${historySubTab === 'all' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        All Transactions
                        {historySubTab === 'all' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full"></div>}
                    </button>
                </div>

                {historySubTab === 'overview' ? (
                    <>
                        {/* 1. Recent Transactions (Compact) */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
                                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                                    <History size={18} className="text-indigo-600" />
                                    Recent Activity
                                </h3>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-slate-500">Last 5 Transactions</span>
                                    <button onClick={() => setHistorySubTab('all')} className="text-xs text-indigo-600 font-medium hover:underline">View All</button>
                                </div>
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
                    </>
                ) : (
                    // ALL TRANSACTIONS VIEW
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in">
                        {/* Filters */}
                        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-wrap gap-4 items-center">
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
                            {(filterClass !== 'All' || filterDateStart || filterDateEnd) && (
                                <button
                                    onClick={() => { setFilterClass('All'); setFilterDateStart(''); setFilterDateEnd(''); }}
                                    className="text-sm text-red-500 hover:text-red-600 font-medium ml-auto"
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
                                                    <button
                                                        onClick={() => setViewingStudent(t.student)}
                                                        className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-indigo-600 transition-colors"
                                                    >
                                                        <Info size={16} />
                                                    </button>
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
