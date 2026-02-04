import { useState, useEffect } from 'react';
import {
    Calendar,
    CheckCircle,
    Clock,
    AlertCircle,
    DollarSign,
    Search,
    Filter,
    FileText
} from 'lucide-react';
import { storageService } from '../../services/storage';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function SalaryManager() {
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [salaries, setSalaries] = useState([]);
    const [summary, setSummary] = useState({
        totalLiability: 0,
        totalPaid: 0,
        totalPending: 0,
        paidCount: 0,
        pendingCount: 0
    });
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState(null);

    // Confirmation Modal State
    const [confirmModal, setConfirmModal] = useState({
        show: false,
        salaryId: null,
        amount: 0,
        staffName: '',
        paymentMode: ''
    });

    useEffect(() => {
        fetchData();
    }, [selectedMonth]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [salaryData, summaryData] = await Promise.all([
                storageService.salaries.getByMonth(selectedMonth),
                storageService.salaries.getSummary(selectedMonth)
            ]);
            setSalaries(salaryData);
            setSummary(summaryData);
        } catch (error) {
            console.error("Failed to fetch salary data", error);
        } finally {
            setLoading(false);
        }
    };

    const initiatePay = (salary) => {
        setConfirmModal({
            show: true,
            salaryId: salary._id,
            amount: salary.amount,
            staffName: salary.staff.name,
            paymentMode: salary.paymentMode || 'Cash'
        });
    };

    const confirmPayment = async () => {
        const { salaryId, paymentMode } = confirmModal;
        if (!salaryId) return;

        setProcessingId(salaryId);
        setConfirmModal(prev => ({ ...prev, show: false })); // Close modal

        try {
            await storageService.salaries.pay(salaryId, paymentMode);
            await fetchData(); // Refresh data
        } catch (error) {
            console.error("Payment failed", error);
            alert("Failed to process payment");
        } finally {
            setProcessingId(null);
        }
    };

    const generateReport = () => {
        const doc = new jsPDF();
        const monthName = new Date(selectedMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

        // Header
        doc.setFontSize(22);
        doc.setTextColor(40, 40, 40);
        doc.text("Salary Report", 14, 20);

        doc.setFontSize(12);
        doc.setTextColor(100, 100, 100);
        doc.text(`Month: ${monthName}`, 14, 30);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 36);

        // Summary Section
        doc.setDrawColor(200, 200, 200);
        doc.line(14, 42, 196, 42);

        doc.setFontSize(14);
        doc.setTextColor(60, 60, 60);
        doc.text("Summary", 14, 52);

        doc.setFontSize(11);
        doc.setTextColor(80, 80, 80);
        doc.text(`Total Liability: ${summary.totalLiability.toLocaleString()} INR`, 14, 62);
        doc.text(`Total Paid: ${summary.totalPaid.toLocaleString()} INR (${summary.paidCount} Staff)`, 14, 68);
        doc.text(`Pending: ${summary.totalPending.toLocaleString()} INR (${summary.pendingCount} Pending)`, 14, 74);

        // Table
        const tableColumn = ["Staff Name", "Role", "Category", "Amount", "Status", "Payment Mode", "Date"];
        const tableRows = [];

        salaries.forEach(salary => {
            const salaryData = [
                salary.staff.name,
                salary.staff.role || '-',
                salary.staff.category || 'Teacher',
                salary.amount.toLocaleString(),
                salary.status,
                salary.paymentMode,
                salary.status === 'Paid' ? new Date(salary.paymentDate).toLocaleDateString() : '-'
            ];
            tableRows.push(salaryData);
        });

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 85,
            theme: 'grid',
            headStyles: { fillColor: [79, 70, 229] }, // Indigo-600
            styles: { fontSize: 9, cellPadding: 3 },
            alternateRowStyles: { fillColor: [249, 250, 251] }
        });

        doc.save(`Salary_Report_${selectedMonth}.pdf`);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Salary Management</h1>
                    <p className="text-slate-500">Track and manage monthly staff salaries.</p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={generateReport}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
                    >
                        <FileText size={18} className="text-slate-500" />
                        <span className="font-medium text-sm">Download Report</span>
                    </button>

                    <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                        <Calendar className="text-slate-400" size={20} />
                        <input
                            type="month"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="border-none focus:ring-0 text-slate-700 font-medium"
                        />
                    </div>
                </div>
            </div>

            {/* Application Check: Auto-generation explanation for user */}
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-start gap-3">
                <AlertCircle className="text-blue-600 shrink-0 mt-0.5" size={20} />
                <p className="text-sm text-blue-700">
                    The system automatically generates a "Pending" salary record for every active staff member when you select a month.
                    If a new staff member is added, simply refresh this page to see their pending salary.
                </p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
                            <DollarSign size={24} />
                        </div>
                        <span className="text-sm font-medium text-slate-500">Total Liability</span>
                    </div>
                    <div className="text-3xl font-bold text-slate-900">
                        ₹{summary.totalLiability.toLocaleString()}
                    </div>
                    <div className="mt-2 text-sm text-slate-500">
                        For {new Date(selectedMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-green-100 rounded-lg text-green-600">
                            <CheckCircle size={24} />
                        </div>
                        <span className="text-sm font-medium text-slate-500">Total Paid</span>
                    </div>
                    <div className="text-3xl font-bold text-slate-900">
                        ₹{summary.totalPaid.toLocaleString()}
                    </div>
                    <div className="mt-2 text-sm text-green-600 bg-green-50 inline-block px-2 py-0.5 rounded-full font-medium">
                        {summary.paidCount} Staff Paid
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                            <Clock size={24} />
                        </div>
                        <span className="text-sm font-medium text-slate-500">Pending Amount</span>
                    </div>
                    <div className="text-3xl font-bold text-slate-900">
                        ₹{summary.totalPending.toLocaleString()}
                    </div>
                    <div className="mt-2 text-sm text-amber-600 bg-amber-50 inline-block px-2 py-0.5 rounded-full font-medium">
                        {summary.pendingCount} Pending
                    </div>
                </div>
            </div>

            {/* Salary Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Staff Member</th>
                                <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Category</th>
                                <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Amount</th>
                                <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Status</th>
                                <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Payment Mode</th>
                                <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                                        Loading salary data...
                                    </td>
                                </tr>
                            ) : salaries.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                                        No active staff found for this month.
                                    </td>
                                </tr>
                            ) : (
                                salaries.map((salary) => (
                                    <tr key={salary._id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-slate-900">{salary.staff.name}</div>
                                            <div className="text-xs text-slate-500">{salary.staff.role}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-medium">
                                                {salary.staff.category || 'Teacher'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-900">
                                            ₹{salary.amount.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            {salary.status === 'Paid' ? (
                                                <div className="flex items-center gap-1.5 text-green-600 text-sm font-medium">
                                                    <CheckCircle size={16} />
                                                    <span>Paid</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1.5 text-amber-600 text-sm font-medium">
                                                    <Clock size={16} />
                                                    <span>Pending</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            {salary.paymentMode}
                                        </td>
                                        <td className="px-6 py-4">
                                            {salary.status === 'Pending' ? (
                                                <button
                                                    onClick={() => initiatePay(salary)}
                                                    disabled={processingId === salary._id}
                                                    className="px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                >
                                                    {processingId === salary._id ? 'Processing...' : 'Mark as Paid'}
                                                </button>
                                            ) : (
                                                <span className="text-xs text-slate-400">
                                                    Paid on {new Date(salary.paymentDate).toLocaleDateString()}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            {/* Custom Warning Modal */}
            {confirmModal.show && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden transform transition-all scale-100 animate-in fade-in zoom-in duration-200">
                        {/* Header */}
                        <div className="bg-amber-50 border-b border-amber-100 p-6 flex items-start gap-4">
                            <div className="p-3 bg-amber-100 rounded-full shrink-0 text-amber-600">
                                <AlertCircle size={32} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-amber-900">Confirm Salary Payment</h3>
                                <p className="text-amber-700 text-sm mt-1">This action cannot be undone.</p>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-4">
                            <div className="space-y-3 text-sm text-slate-600">
                                <p>You are about to mark the salary for <span className="font-bold text-slate-900">{confirmModal.staffName}</span> as <span className="font-bold text-green-600">PAID</span>.</p>

                                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-2">
                                    <div className="flex justify-between">
                                        <span>Amount:</span>
                                        <span className="font-bold text-slate-900">₹{confirmModal.amount.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Payment Mode:</span>
                                        <span className="font-semibold text-slate-700">{confirmModal.paymentMode}</span>
                                    </div>
                                </div>

                                <p className="text-xs text-slate-500 italic">
                                    * This will automatically create an "Expense" record in the accounts.
                                </p>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center gap-3 justify-end">
                            <button
                                onClick={() => setConfirmModal({ ...confirmModal, show: false })}
                                className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmPayment}
                                className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 shadow-sm transition-all hover:shadow-md"
                            >
                                Confirm Payment
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
