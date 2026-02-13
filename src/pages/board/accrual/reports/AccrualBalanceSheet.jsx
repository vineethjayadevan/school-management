import React, { useState, useEffect } from 'react';
import {
    Scale,
    Landmark,
    ArrowDownLeft,
    ArrowUpRight,
    Briefcase,
    RefreshCw
} from 'lucide-react';
import api from '../../../../services/api';

export default function AccrualBalanceSheet() {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        fetchReport();
    }, []);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/accrual/balance-sheet?endDate=${date}`);
            setData(res.data);
        } catch (error) {
            console.error('Error fetching Balance Sheet:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading && !data) return <div className="p-8 text-center text-slate-500">Loading Report...</div>;
    if (!data) return null;

    const SectionHeader = ({ icon: Icon, title, total, colorClass }) => (
        <div className={`p-4 rounded-xl flex items-center justify-between mb-4 ${colorClass}`}>
            <div className="flex items-center gap-3">
                <Icon size={20} />
                <h3 className="font-bold text-lg">{title}</h3>
            </div>
            <span className="font-bold text-lg">
                {total.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
            </span>
        </div>
    );

    const RowItem = ({ label, amount, highlight = false }) => (
        <div className={`flex justify-between items-center py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 px-2 rounded-lg transition-colors ${highlight ? 'font-semibold text-slate-900' : 'text-slate-600'}`}>
            <span className="text-sm">{label}</span>
            <span className="text-sm">
                {amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
            </span>
        </div>
    );

    return (
        <div className="space-y-8">
            {/* Filter */}
            <div className="flex items-center justify-end gap-2">
                <span className="text-sm font-medium text-slate-500">As of:</span>
                <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                    onClick={fetchReport}
                    className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    title="Update Report"
                >
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Assets */}
                <div className="space-y-4">
                    <SectionHeader title="Assets" icon={Landmark} total={data.assets.total} colorClass="bg-emerald-50 text-emerald-800" />
                    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-2">
                        <RowItem label="Cash & Bank Balance" amount={data.assets.cash} highlight />
                        <RowItem label="Accounts Receivable" amount={data.assets.accountsReceivable} />
                        <RowItem label="Fixed Assets" amount={data.assets.fixedAssets} />
                        <div className="mt-4 pt-4 border-t border-slate-200 flex justify-between items-center">
                            <span className="font-bold text-slate-800">Total Assets</span>
                            <span className="font-bold text-emerald-600 text-lg">
                                {data.assets.total.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Liabilities & Equity */}
                <div className="space-y-8">
                    {/* Liabilities */}
                    <div className="space-y-4">
                        <SectionHeader title="Liabilities" icon={ArrowUpRight} total={data.liabilities.total} colorClass="bg-rose-50 text-rose-800" />
                        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-2">
                            <RowItem label="Accounts Payable" amount={data.liabilities.accountsPayable} />
                            <RowItem label="Loans (Outstanding)" amount={data.liabilities.loans} />
                            <div className="mt-4 pt-4 border-t border-slate-200 flex justify-between items-center">
                                <span className="font-bold text-slate-800">Total Liabilities</span>
                                <span className="font-bold text-rose-600 text-lg">
                                    {data.liabilities.total.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Equity */}
                    <div className="space-y-4">
                        <SectionHeader title="Equity" icon={Briefcase} total={data.equity.total} colorClass="bg-indigo-50 text-indigo-800" />
                        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-2">
                            <RowItem label="Capital Introduced" amount={data.equity.capital} />
                            <RowItem label="Retained Earnings" amount={data.equity.retainedEarnings} />
                            <div className="mt-4 pt-4 border-t border-slate-200 flex justify-between items-center">
                                <span className="font-bold text-slate-800">Total Equity</span>
                                <span className="font-bold text-indigo-600 text-lg">
                                    {data.equity.total.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Validation Check */}
            {data.validation && (
                <div className={`p-4 rounded-xl text-center text-sm flex flex-col md:flex-row items-center justify-center gap-2 ${Math.abs(data.validation.difference) > 1 ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-slate-50 text-slate-500'}`}>
                    <div className="flex items-center gap-2">
                        <Scale size={16} />
                        <span className="font-medium">Accounting Equation Check:</span>
                    </div>
                    <span>
                        Assets ({data.validation.assets.toLocaleString('en-IN', { maximumFractionDigits: 0 })})
                        {Math.abs(data.validation.difference) > 1 ? ' ≠ ' : ' = '}
                        Liabilities + Equity ({data.validation.liabilitiesAndEquity.toLocaleString('en-IN', { maximumFractionDigits: 0 })})
                    </span>
                    {Math.abs(data.validation.difference) > 1 && (
                        <span className="font-bold ml-2">
                            (Difference: {data.validation.difference.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })})
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}
