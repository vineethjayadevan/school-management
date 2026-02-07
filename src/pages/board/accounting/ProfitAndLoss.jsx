import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { Calendar, Download, RefreshCw } from 'lucide-react';

export default function ProfitAndLoss() {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);
    const [dateRange, setDateRange] = useState({
        startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0], // Jan 1st
        endDate: new Date().toISOString().split('T')[0] // Today
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/accounting/pnl?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`);
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
            <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2">
                    <Calendar size={18} className="text-slate-400" />
                    <input
                        type="date"
                        value={dateRange.startDate}
                        onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                        className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className="text-slate-400">-</span>
                    <input
                        type="date"
                        value={dateRange.endDate}
                        onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                        className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                        onClick={fetchData}
                        className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
                {/* <button className="flex items-center gap-2 text-indigo-600 font-medium text-sm hover:underline">
                    <Download size={16} /> Export PDF
                </button> */}
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
            ) : data ? (
                <div className="max-w-3xl mx-auto bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
                    <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 text-center">
                        <h2 className="text-lg font-bold text-slate-800">Profit & Loss Statement</h2>
                        <p className="text-xs text-slate-500">
                            {new Date(data.period.start).toLocaleDateString()} — {new Date(data.period.end).toLocaleDateString()}
                        </p>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Revenue Section */}
                        <div>
                            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 border-b pb-1">Revenue</h3>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600">Cash Revenue (Fees + Other)</span>
                                    <span className="font-medium">{formatCurrency(data.revenue.cash)}</span>
                                </div>
                                {data.revenue.accruedAdj !== 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500 italic">Add: Accrued Income</span>
                                        <span className="text-emerald-600">+{formatCurrency(data.revenue.accruedAdj)}</span>
                                    </div>
                                )}
                                {data.revenue.deferredAdj !== 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500 italic">Less: Unearned Income (deferral)</span>
                                        <span className="text-rose-600">{formatCurrency(data.revenue.deferredAdj)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between font-bold pt-2 border-t border-slate-100 mt-2">
                                    <span className="text-slate-800">Total Revenue</span>
                                    <span className="text-indigo-700">{formatCurrency(data.revenue.total)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Expenses Section */}
                        <div>
                            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 border-b pb-1">Expenses</h3>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600">Cash Expenses (Bills + Salaries)</span>
                                    <span className="font-medium">{formatCurrency(data.expenses.cash)}</span>
                                </div>
                                {data.expenses.outstandingAdj !== 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500 italic">Add: Outstanding Expenses</span>
                                        <span className="text-rose-600">+{formatCurrency(data.expenses.outstandingAdj)}</span>
                                    </div>
                                )}
                                {data.expenses.prepaidAdj !== 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500 italic">Less: Prepaid Expenses</span>
                                        <span className="text-emerald-600">{formatCurrency(data.expenses.prepaidAdj)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-600">Depreciation (Assets)</span>
                                    <span className="font-medium">{formatCurrency(data.expenses.depreciation)}</span>
                                </div>
                                <div className="flex justify-between font-bold pt-2 border-t border-slate-100 mt-2">
                                    <span className="text-slate-800">Total Expenses</span>
                                    <span className="text-rose-700">{formatCurrency(data.expenses.total)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Net Profit */}
                        <div className="bg-slate-50 rounded-xl p-4 flex justify-between items-center border border-slate-200">
                            <span className="font-bold text-lg text-slate-800">Net Profit / (Loss)</span>
                            <span className={`text-xl font-bold ${data.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {formatCurrency(data.netProfit)}
                            </span>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="text-center text-slate-400 py-12">No data loaded.</div>
            )}
        </div>
    );
}
