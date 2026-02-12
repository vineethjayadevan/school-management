import React, { useState, useEffect } from 'react';
import {
    Scale,
    Landmark,
    ArrowUpRight,
    Briefcase,
    RefreshCw,
    Info,
    X
} from 'lucide-react';
import api from '../../../../services/api';

export default function CashBalanceSheet() {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);
    const [showInfo, setShowInfo] = useState(false);
    const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        fetchReport();
    }, []);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/accounting/balance-sheet?date=${asOfDate}&basis=cash`);
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

    const RowItem = ({ label, amount, highlight = false, subtext = '' }) => (
        <div className={`flex justify-between items-center py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 px-2 rounded-lg transition-colors ${highlight ? 'font-semibold text-slate-900' : 'text-slate-600'}`}>
            <div className="flex flex-col">
                <span className="text-sm">{label}</span>
                {subtext && <span className="text-xs text-slate-400">{subtext}</span>}
            </div>
            <span className="text-sm">
                {amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
            </span>
        </div>
    );

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-end gap-2">
                <span className="text-sm font-medium text-slate-500">As of:</span>
                <input
                    type="date"
                    value={asOfDate}
                    onChange={(e) => setAsOfDate(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                    onClick={fetchReport}
                    className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    title="Update Report"
                >
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                </button>
                <button
                    onClick={() => setShowInfo(true)}
                    className="p-2 bg-white text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors"
                    title="Format Information"
                >
                    <Info size={16} />
                </button>
            </div>

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
                        <RowItem label="Fixed Assets (Net)" amount={data.assets.fixedAssets} subtext={`Gross: ${data.assets.fixedAssetsGross?.toLocaleString()} - Sales: ${data.assets.assetDisposals?.toLocaleString()}`} />

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
                            <RowItem label="Loans Outstanding" amount={data.liabilities.loans} />
                            <RowItem label="Refundable Deposits" amount={data.liabilities.deposits} />
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
                            <RowItem label="Capital Introduced" amount={data.equity.capitalIntroduced} />
                            <RowItem label="Capital Reserves" amount={data.equity.capitalReserves} />
                            <RowItem label="Accumulated Surplus" amount={data.equity.surplus} highlight />
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
                Accounting Equation Check: Assets ({data.assets.total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}) =
                Liabilities ({data.liabilities.total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}) +
                Equity ({data.equity.total.toLocaleString('en-IN', { maximumFractionDigits: 0 })})
            </div>

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
