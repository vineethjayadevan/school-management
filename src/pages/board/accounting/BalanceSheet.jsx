import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { Scale, RefreshCw } from 'lucide-react';

export default function BalanceSheet() {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);
    const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/accounting/balance-sheet?date=${asOfDate}`);
            setData(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

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
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
            ) : data ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
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
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-600">Accounts Receivable (Fees)</span>
                                        <span className="font-medium">{formatCurrency(data.assets.receivables)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                                <h4 className="text-xs font-semibold text-slate-500 uppercase mb-3">Fixed Assets</h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-600">Property, Plant & Equipment (Net)</span>
                                        <span className="font-medium">{formatCurrency(data.assets.fixedAssets)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex justify-between items-center mt-4">
                                <span className="font-bold text-emerald-800">Total Assets</span>
                                <span className="font-bold text-lg text-emerald-700">{formatCurrency(data.assets.total)}</span>
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
                                <h4 className="text-xs font-semibold text-slate-500 uppercase mb-3">Current Liabilities</h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-600">Accounts Payable (Salaries)</span>
                                        <span className="font-medium">{formatCurrency(data.liabilities.payables)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm pt-2 border-t border-slate-50 font-semibold">
                                        <span className="text-slate-700">Total Liabilities</span>
                                        <span>{formatCurrency(data.liabilities.total)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                                <h4 className="text-xs font-semibold text-slate-500 uppercase mb-3">Shareholder's Equity</h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-600">Capital Invested</span>
                                        <span className="font-medium">{formatCurrency(data.equity.capital)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-600">Retained Earnings</span>
                                        <span className="font-medium">{formatCurrency(data.equity.retainedEarnings)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm pt-2 border-t border-slate-50 font-semibold">
                                        <span className="text-slate-700">Total Equity</span>
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

                            {/* Share Value Highlight */}
                            <div className="mt-8 text-center p-4 bg-slate-900 rounded-2xl shadow-lg text-white">
                                <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Book Value Per Share</p>
                                <p className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-200 to-white inline-block">
                                    {formatCurrency(data.shareValue)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-center text-slate-400 py-12">No data loaded.</div>
            )}
        </div>
    );
}
