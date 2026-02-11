import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { Scale, RefreshCw, Info, X, AlertTriangle } from 'lucide-react';

export default function BalanceSheet({ basis = 'accrual' }) {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);
    const [showInfo, setShowInfo] = useState(false);
    const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]);

    // Calculate Cash Basis Totals
    const cashAssets = data?.assets ? (data.assets.cash + data.assets.fixedAssets) : 0;
    const cashLiabilities = 0; // Assuming Payables are the only current liability for now
    const cashEquityTotal = cashAssets - cashLiabilities;
    const cashRetainedEarnings = data?.equity ? (cashEquityTotal - data.equity.capitalIntroduced) : 0;

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/accounting/balance-sheet?date=${asOfDate}&basis=${basis}`);
            setData(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [basis]); // Re-fetch when basis changes

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-slate-500">As of:</span>
                    <input
                        type="date"
                        value={asOfDate}
                        onChange={(e) => setAsOfDate(e.target.value)}
                        className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                        onClick={fetchData}
                        className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    </button>
                    {basis === 'cash' && (
                        <button
                            onClick={() => setShowInfo(true)}
                            className="p-2 bg-white text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors ml-2"
                            title="Format Information"
                        >
                            <Info size={16} />
                        </button>
                    )}
                </div>
                {basis === 'cash' && (
                    <div className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full border border-amber-200">
                        Cash Basis
                    </div>
                )}
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
            ) : data ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
                    {/* Assets Side */}
                    <div className="space-y-6">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 border-b pb-2">
                            <Scale size={20} className="text-emerald-600" />
                            Assets
                        </h3>

                        <div className="space-y-4">
                            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                                <h4 className="text-xs font-semibold text-slate-500 uppercase mb-3">Current Assets</h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-600">Cash & Bank Balance</span>
                                        <span className="font-medium">{formatCurrency(data.assets.cash)}</span>
                                    </div>
                                    {basis !== 'cash' && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-600">Accounts Receivable</span>
                                            <span className="font-medium">{formatCurrency(data.assets.receivables)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                                <h4 className="text-xs font-semibold text-slate-500 uppercase mb-3">Fixed Assets</h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-600">Fixed Assets (Gross Block)</span>
                                        <span className="font-medium">{formatCurrency(data.assets.fixedAssets)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex justify-between items-center mt-4">
                                <span className="font-bold text-emerald-800">Total Assets</span>
                                <span className="font-bold text-lg text-emerald-700">
                                    {formatCurrency(data.assets.total)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Liabilities & Equity Side */}
                    <div className="space-y-6">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 border-b pb-2">
                            <Scale size={20} className="text-indigo-600" />
                            Liabilities & Equity
                        </h3>

                        <div className="space-y-4">
                            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                                <h4 className="text-xs font-semibold text-slate-500 uppercase mb-3">Liabilities</h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-600">Loans Outstanding</span>
                                        <span className="font-medium">{formatCurrency(data.liabilities.loans)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-600">Refundable Deposits</span>
                                        <span className="font-medium">{formatCurrency(data.liabilities.deposits)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm pt-2 border-t border-slate-50 font-semibold">
                                        <span className="text-slate-700">Total Liabilities</span>
                                        <span>{formatCurrency(data.liabilities.total)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                                <h4 className="text-xs font-semibold text-slate-500 uppercase mb-3">Capital & Equity</h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-600">Capital Introduced</span>
                                        <span className="font-medium">{formatCurrency(data.equity.capitalIntroduced)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-600">Capital Reserves</span>
                                        <span className="font-medium">{formatCurrency(data.equity.capitalReserves)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-600">Accumulated Surplus</span>
                                        <span className={`font-medium ${data.equity.surplus >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {formatCurrency(data.equity.surplus)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm pt-2 border-t border-slate-50 font-semibold">
                                        <span className="text-slate-700">Total Capital</span>
                                        <span>{formatCurrency(data.equity.total)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex justify-between items-center mt-4">
                                <span className="font-bold text-indigo-800">Total Liabilities & Equity</span>
                                <span className="font-bold text-lg text-indigo-700">
                                    {formatCurrency(data.liabilities.total + data.equity.total)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-center text-slate-400 py-12">No data loaded.</div>
            )}

            {/* INFO MODAL */}
            {showInfo && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
                                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                    <Info className="text-indigo-600" /> Cash Balance Sheet Logic
                                </h3>
                                <button onClick={() => setShowInfo(false)} className="text-slate-400 hover:text-slate-600">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="space-y-6 text-sm text-slate-600">
                                <div className="grid md:grid-cols-2 gap-8">
                                    {/* ASSETS */}
                                    <div>
                                        <h4 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2 border-b pb-2">
                                            <span className="w-2 h-8 bg-emerald-500 rounded-full"></span>
                                            Assets
                                        </h4>
                                        <ul className="space-y-4">
                                            <li>
                                                <span className="font-bold text-slate-800 block">1. Cash & Bank Balance</span>
                                                <span className="font-mono text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded block mt-1">
                                                    Sum(All Inflows) - Sum(All Outflows)
                                                </span>
                                            </li>
                                            <li>
                                                <span className="font-bold text-slate-800 block">2. Fixed Assets (Net)</span>
                                                <span className="text-xs text-slate-500 block mb-1">Cost - Sale Proceeds</span>
                                                <ul className="list-disc list-inside text-xs text-slate-600 pl-2">
                                                    <li>Building Construction</li>
                                                    <li>Furniture</li>
                                                    <li>Classroom Setup</li>
                                                    <li className="text-rose-600 font-medium">LESS: Asset Sale Proceeds</li>
                                                </ul>
                                            </li>
                                        </ul>
                                    </div>

                                    {/* LIABILITIES & CAPITAL */}
                                    <div>
                                        <h4 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2 border-b pb-2">
                                            <span className="w-2 h-8 bg-indigo-500 rounded-full"></span>
                                            Liabilities & Capital
                                        </h4>
                                        <ul className="space-y-4">
                                            <li>
                                                <span className="font-bold text-slate-800 block">1. Loans Outstanding</span>
                                                <span className="text-xs text-slate-500">From Loans Received</span>
                                            </li>
                                            <li>
                                                <span className="font-bold text-slate-800 block">2. Refundable Deposits</span>
                                                <span className="text-xs text-slate-500">Security / Caution Deposits</span>
                                            </li>
                                            <li>
                                                <span className="font-bold text-slate-800 block">3. Capital Introduced</span>
                                                <span className="text-xs text-slate-500">Investments - Withdrawals</span>
                                            </li>
                                            <li>
                                                <span className="font-bold text-slate-800 block">4. Capital Reserves</span>
                                                <span className="text-xs text-slate-500">Non-Operating Capital Receipts:</span>
                                                <span className="block text-xs italic">Insurance Claims, Capital Grants, etc.</span>
                                            </li>
                                            <li>
                                                <span className="font-bold text-slate-800 block">5. Accumulated Surplus</span>
                                                <span className="font-mono text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded block mt-1">
                                                    Revenue Income - Revenue Expense
                                                </span>
                                            </li>
                                        </ul>
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
