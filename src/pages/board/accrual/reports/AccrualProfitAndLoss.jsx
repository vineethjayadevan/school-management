import React, { useState, useEffect } from 'react';
import {
    Download,
    Calendar,
    ArrowUpCircle,
    ArrowDownCircle,
    PieChart
} from 'lucide-react';
import api from '../../../../services/api';

export default function AccrualProfitAndLoss() {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);
    const [dateRange, setDateRange] = useState({
        startDate: '',
        endDate: ''
    });

    useEffect(() => {
        fetchReport();
    }, [dateRange]);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (dateRange.startDate) params.append('startDate', dateRange.startDate);
            if (dateRange.endDate) params.append('endDate', dateRange.endDate);

            const res = await api.get(`/accrual/pnl?${params.toString()}`);
            setData(res.data);
        } catch (error) {
            console.error('Error fetching P&L:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading && !data) return <div className="p-8 text-center text-slate-500">Loading Report...</div>;
    if (!data) return null;

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="flex items-center justify-end gap-2">
                <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                    className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-slate-400">-</span>
                <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                    className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100">
                    <div className="flex items-center gap-3 mb-2">
                        <ArrowUpCircle className="text-emerald-500" size={20} />
                        <span className="text-emerald-700 font-medium">Total Revenue</span>
                    </div>
                    <h3 className="text-2xl font-bold text-emerald-900">
                        {data.revenue.total.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                    </h3>
                </div>

                <div className="bg-rose-50 rounded-2xl p-6 border border-rose-100">
                    <div className="flex items-center gap-3 mb-2">
                        <ArrowDownCircle className="text-rose-500" size={20} />
                        <span className="text-rose-700 font-medium">Total Expenses</span>
                    </div>
                    <h3 className="text-2xl font-bold text-rose-900">
                        {data.expenses.total.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                    </h3>
                </div>

                <div className={`rounded-2xl p-6 border ${data.netProfit >= 0 ? 'bg-indigo-50 border-indigo-100' : 'bg-orange-50 border-orange-100'}`}>
                    <div className="flex items-center gap-3 mb-2">
                        <PieChart className={data.netProfit >= 0 ? 'text-indigo-500' : 'text-orange-500'} size={20} />
                        <span className={data.netProfit >= 0 ? 'text-indigo-700 font-medium' : 'text-orange-700 font-medium'}>
                            Net Profit
                        </span>
                    </div>
                    <h3 className={`text-2xl font-bold ${data.netProfit >= 0 ? 'text-indigo-900' : 'text-orange-900'}`}>
                        {data.netProfit.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                    </h3>
                </div>
            </div>

            {/* Breakdown Tables */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Revenue Breakdown */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                        <h4 className="font-semibold text-slate-800">Revenue by Category</h4>
                    </div>
                    <table className="w-full">
                        <tbody className="divide-y divide-slate-100">
                            {data.revenue.breakdown.map((item, index) => (
                                <tr key={index} className="hover:bg-slate-50">
                                    <td className="px-6 py-3 text-sm text-slate-600">{item.category}</td>
                                    <td className="px-6 py-3 text-sm font-medium text-slate-900 text-right">
                                        {item.amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                                    </td>
                                </tr>
                            ))}
                            {data.revenue.breakdown.length === 0 && (
                                <tr><td colSpan="2" className="px-6 py-4 text-center text-slate-400 text-sm">No revenue recorded</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Expense Breakdown */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                        <h4 className="font-semibold text-slate-800">Expenses by Category</h4>
                    </div>
                    <table className="w-full">
                        <tbody className="divide-y divide-slate-100">
                            {data.expenses.breakdown.map((item, index) => (
                                <tr key={index} className="hover:bg-slate-50">
                                    <td className="px-6 py-3 text-sm text-slate-600">{item.category}</td>
                                    <td className="px-6 py-3 text-sm font-medium text-slate-900 text-right">
                                        {item.amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                                    </td>
                                </tr>
                            ))}
                            {data.expenses.breakdown.length === 0 && (
                                <tr><td colSpan="2" className="px-6 py-4 text-center text-slate-400 text-sm">No expenses recorded</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
