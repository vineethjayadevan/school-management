import { useState, useEffect } from 'react';
import { CreditCard, History, Wallet, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { storageService } from '../../services/storage';
import { feeStructure } from '../../services/mockData';

export default function StudentFees() {
    const [feeData, setFeeData] = useState({ status: 'Loading...', history: [], profile: null });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFees = async () => {
            try {
                const data = await storageService.student.getFees();
                setFeeData(data);
            } catch (error) {
                console.error("Failed to fetch fees", error);
            } finally {
                setLoading(false);
            }
        };

        fetchFees();
    }, []);

    const getFeeBreakdown = () => {
        if (!feeData.profile || !feeData.expectedBreakdown) return [];

        const payments = feeData.history.filter(t => t.status === 'Paid');

        return feeData.expectedBreakdown.map(cat => {
            const baseDue = cat.totalDue || cat.due;
            const discount = cat.discount || 0;
            const netDue = cat.due;

            // Sum up payments for this category
            const paid = payments
                .reduce((sum, t) => {
                    // 1. Check if fee has explicit itemized breakdown
                    if (t.breakdown && t.breakdown.length > 0) {
                        const item = t.breakdown.find(b => b.feeType === cat.type);
                        return sum + (item ? Number(item.amount) : 0);
                    }

                    // 2. Fallback to top-level feeType matching
                    if (t.feeType === cat.type) {
                        return sum + (t.amount || 0);
                    }

                    // 3. 'Full Fee' covers everything in that year (simplified assumption for legacy/manual entries)
                    if (t.feeType?.toLowerCase().includes('full')) {
                        return sum + netDue;
                    }

                    return sum;
                }, 0);

            const effectivePaid = Math.min(paid, netDue);

            return {
                type: cat.type,
                baseDue: baseDue,
                discount: discount,
                due: netDue,
                paid: effectivePaid,
                pending: Math.max(0, netDue - effectivePaid),
                status: effectivePaid >= netDue ? 'Paid' : effectivePaid > 0 ? 'Partial' : 'Pending'
            };
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const breakdown = getFeeBreakdown();
    const totalDue = breakdown.reduce((sum, d) => sum + d.due, 0);
    const totalPaid = breakdown.reduce((sum, d) => sum + d.paid, 0);
    const totalPending = totalDue - totalPaid;

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in">
            <div>
                <h1 className="text-2xl font-bold text-slate-800">Fee Status & History</h1>
                <p className="text-slate-500">View your detailed fee breakdown and payment records.</p>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="p-3 bg-slate-100 text-slate-600 rounded-lg">
                        <Wallet size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500">Total Fee</p>
                        <h3 className="text-2xl font-bold text-slate-900">₹{totalDue.toLocaleString()}</h3>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg">
                        <CheckCircle size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500">Paid Amount</p>
                        <h3 className="text-2xl font-bold text-emerald-600">₹{totalPaid.toLocaleString()}</h3>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="p-3 bg-rose-100 text-rose-600 rounded-lg">
                        <AlertCircle size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500">Pending Due</p>
                        <h3 className="text-2xl font-bold text-rose-600">₹{totalPending.toLocaleString()}</h3>
                    </div>
                </div>
            </div>

            {/* Detailed Breakdown */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                    <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                        <CreditCard size={20} className="text-indigo-500" />
                        Fee Breakdown
                    </h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-600 text-xs font-bold uppercase border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4">Fee Type</th>
                                <th className="px-6 py-4 text-right">Base Due</th>
                                <th className="px-6 py-4 text-right">Discount</th>
                                <th className="px-6 py-4 text-right">Net Payable</th>
                                <th className="px-6 py-4 text-right">Paid</th>
                                <th className="px-6 py-4 text-right">Pending</th>
                                <th className="px-6 py-4 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                            {breakdown.map((item, idx) => (
                                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-slate-900">{item.type}</td>
                                    <td className="px-6 py-4 text-right text-slate-500 line-through">₹{item.baseDue.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-right text-indigo-600 font-medium">-₹{item.discount.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-right text-slate-900 font-bold">₹{item.due.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-right text-emerald-600 font-medium">₹{item.paid.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-right text-rose-600 font-medium">₹{item.pending.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                                            ${item.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' :
                                                item.status === 'Partial' ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-rose-100 text-rose-700'}`}>
                                            {item.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Transaction History */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                    <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                        <History size={20} className="text-purple-500" />
                        Payment History
                    </h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-600 text-xs font-bold uppercase border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Receipt No</th>
                                <th className="px-6 py-4">Fee Type</th>
                                <th className="px-6 py-4">Mode</th>
                                <th className="px-6 py-4 text-right">Amount</th>
                                <th className="px-6 py-4 text-center">Receipt</th>
                                <th className="px-6 py-4 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                            {feeData.history.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-slate-400">No payment records found.</td>
                                </tr>
                            ) : (
                                feeData.history.map((t) => (
                                    <tr key={t._id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 text-slate-600">{new Date(t.paymentDate || t.createdAt).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 font-mono text-xs text-slate-500">{t.receiptNo || 'N/A'}</td>
                                        <td className="px-6 py-4 text-slate-900 font-medium">{t.feeType}</td>
                                        <td className="px-6 py-4 text-slate-600">{t.paymentMode}</td>
                                        <td className="px-6 py-4 text-right font-semibold text-slate-700">₹{t.amount?.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => storageService.fees.downloadReceipt(t._id, t.receiptNo)}
                                                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors title='Download PDF'"
                                            >
                                                <CreditCard size={18} />
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                                                Paid
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
