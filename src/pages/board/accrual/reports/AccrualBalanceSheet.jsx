import React, { useState, useEffect } from 'react';
import {
    Scale,
    Landmark,
    ArrowDownLeft,
    ArrowUpRight,
    Briefcase
} from 'lucide-react';
import api from '../../../../services/api';

export default function AccrualBalanceSheet() {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);

    useEffect(() => {
        fetchReport();
    }, []);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const res = await api.get('/accrual/balance-sheet');
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Assets */}
                <div className="space-y-4">
                    <SectionHeader
                        icon={Landmark}
                        title="Assets"
                        total={data.assets.total}
                        colorClass="bg-emerald-50 text-emerald-800"
                    />
                    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                        <RowItem label="Cash & Bank Balance" amount={data.assets.cash} highlight />
                        <RowItem label="Accounts Receivable (Unpaid Invoices)" amount={data.assets.accountsReceivable} />
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
                        <SectionHeader
                            icon={ArrowUpRight}
                            title="Liabilities"
                            total={data.liabilities.total}
                            colorClass="bg-rose-50 text-rose-800"
                        />
                        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                            <RowItem label="Accounts Payable (Unpaid Bills)" amount={data.liabilities.accountsPayable} />
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
                        <SectionHeader
                            icon={Briefcase}
                            title="Equity"
                            total={data.equity.total}
                            colorClass="bg-indigo-50 text-indigo-800"
                        />
                        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                            <RowItem label="Capital (Investments)" amount={data.equity.capital} />
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

            {/* Check Balance */}
            <div className="bg-slate-50 p-4 rounded-xl text-center text-sm text-slate-500 flex items-center justify-center gap-2">
                <Scale size={16} />
                Acconting Equation Check: Assets ({data.assets.total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}) =
                Liabilities ({data.liabilities.total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}) +
                Equity ({data.equity.total.toLocaleString('en-IN', { maximumFractionDigits: 0 })})
            </div>
        </div>
    );
}
