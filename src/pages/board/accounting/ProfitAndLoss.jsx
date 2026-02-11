import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { Calendar, Download, RefreshCw, Info, X } from 'lucide-react';

export default function ProfitAndLoss({ basis = 'accrual' }) {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);
    const [showInfo, setShowInfo] = useState(false);
    const [dateRange, setDateRange] = useState({
        startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0], // Jan 1st
        endDate: new Date().toISOString().split('T')[0] // Today
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/accounting/pnl?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}&basis=${basis}`);
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
                        <h2 className="text-lg font-bold text-slate-800">
                            {basis === 'cash' ? 'Cash Profit & Loss Statement' : 'Profit & Loss Statement'}
                        </h2>
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
                                {basis !== 'cash' && data.revenue.accruedAdj !== 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500 italic">Add: Accrued Income</span>
                                        <span className="text-emerald-600">+{formatCurrency(data.revenue.accruedAdj)}</span>
                                    </div>
                                )}
                                {basis !== 'cash' && data.revenue.deferredAdj !== 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500 italic">Less: Unearned Income (deferral)</span>
                                        <span className="text-rose-600">{formatCurrency(data.revenue.deferredAdj)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between font-bold pt-2 border-t border-slate-100 mt-2">
                                    <span className="text-slate-800">Total Revenue</span>
                                    <span className="text-indigo-700">
                                        {formatCurrency(basis === 'cash' ? data.revenue.cash : data.revenue.total)}
                                    </span>
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
                                {basis !== 'cash' && data.expenses.outstandingAdj !== 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500 italic">Add: Outstanding Expenses</span>
                                        <span className="text-rose-600">+{formatCurrency(data.expenses.outstandingAdj)}</span>
                                    </div>
                                )}
                                {basis !== 'cash' && data.expenses.prepaidAdj !== 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500 italic">Less: Prepaid Expenses</span>
                                        <span className="text-emerald-600">{formatCurrency(data.expenses.prepaidAdj)}</span>
                                    </div>
                                )}
                                {basis !== 'cash' && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-600">Depreciation (Assets)</span>
                                        <span className="font-medium">{formatCurrency(data.expenses.depreciation)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between font-bold pt-2 border-t border-slate-100 mt-2">
                                    <span className="text-slate-800">Total Expenses</span>
                                    <span className="text-rose-700">
                                        {formatCurrency(basis === 'cash' ? data.expenses.cash : data.expenses.total)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Net Profit */}
                        <div className="bg-slate-50 rounded-xl p-4 flex justify-between items-center border border-slate-200">
                            <span className="font-bold text-lg text-slate-800">{basis === 'cash' ? 'Surplus / (Deficit)' : 'Net Profit / (Loss)'}</span>
                            <span className={`text-xl font-bold ${(basis === 'cash' ? (data.revenue.cash - data.expenses.cash) : data.netProfit) >= 0
                                ? 'text-emerald-600' : 'text-rose-600'
                                }`}>
                                {formatCurrency(basis === 'cash' ? (data.revenue.cash - data.expenses.cash) : data.netProfit)}
                            </span>
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
                                    <Info className="text-indigo-600" /> Cash P&L Methodology
                                </h3>
                                <button onClick={() => setShowInfo(false)} className="text-slate-400 hover:text-slate-600">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="space-y-6 text-sm text-slate-600">
                                <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                                    <h4 className="font-bold text-indigo-900 mb-2">Formula</h4>
                                    <p className="font-mono text-indigo-700">Surplus / (Deficit) = Total Cash Income - Total Cash Expenses</p>
                                    <p className="mt-2 text-xs text-indigo-600/80 italic">Only board member entries are considered. Admin fee collections are excluded unless manually recorded.</p>
                                </div>

                                <div className="grid md:grid-cols-2 gap-8">
                                    {/* INCOME COLUMN */}
                                    <div>
                                        <h4 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2 border-b pb-2">
                                            <span className="w-2 h-8 bg-emerald-500 rounded-full"></span>
                                            Income
                                        </h4>

                                        <div className="mb-6">
                                            <h5 className="font-bold text-emerald-700 mb-2 uppercase text-xs tracking-wider">Included (Revenue)</h5>
                                            <ul className="space-y-3">
                                                <li>
                                                    <span className="font-semibold block text-slate-800">Student Fees</span>
                                                    <span className="text-xs text-slate-500">Tuition, Admission, Transport, Other Academic Fees</span>
                                                </li>
                                                <li>
                                                    <span className="font-semibold block text-slate-800">Donations</span>
                                                    <span className="text-xs text-slate-500">General Donations (Revenue)</span>
                                                </li>
                                                <li>
                                                    <span className="font-semibold block text-slate-800">Grants</span>
                                                    <span className="text-xs text-slate-500">Revenue Grants</span>
                                                </li>
                                                <li>
                                                    <span className="font-semibold block text-slate-800">Sponsorships</span>
                                                    <span className="text-xs text-slate-500">Event Sponsorships, Program / Activity Sponsorships</span>
                                                </li>
                                                <li>
                                                    <span className="font-semibold block text-slate-800">Other Operating Income</span>
                                                    <span className="text-xs text-slate-500">Late Fees, Certificates, Interest, Misc Operating Income</span>
                                                </li>
                                            </ul>
                                        </div>

                                        <div className="p-3 bg-rose-50 rounded-lg border border-rose-100">
                                            <h5 className="font-bold text-rose-700 mb-2 uppercase text-xs tracking-wider">Excluded (Capital)</h5>
                                            <ul className="space-y-2 text-xs text-rose-800">
                                                <li><span className="font-semibold">Asset Sale Proceeds:</span> Sale of Fixed Assets, Scrap</li>
                                                <li><span className="font-semibold">Capital Introduced:</span> Investments, Founder Capital</li>
                                                <li><span className="font-semibold">Loans Received:</span> Bank Loans, Director Loans</li>
                                                <li><span className="font-semibold">Deposits:</span> Security Deposits, Caution Deposits</li>
                                                <li><span className="font-semibold">Restricted:</span> Capital Donations, Capital Grants</li>
                                                <li><span className="font-semibold">Other:</span> Insurance Claims, Refunds</li>
                                            </ul>
                                        </div>
                                    </div>

                                    {/* EXPENSE COLUMN */}
                                    <div>
                                        <h4 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2 border-b pb-2">
                                            <span className="w-2 h-8 bg-rose-500 rounded-full"></span>
                                            Expenses
                                        </h4>

                                        <div className="mb-6">
                                            <h5 className="font-bold text-emerald-700 mb-2 uppercase text-xs tracking-wider">Included (Revenue Exp)</h5>
                                            <ul className="space-y-3">
                                                <li>
                                                    <span className="font-semibold block text-slate-800">Academic & Educational</span>
                                                    <span className="text-xs text-slate-500">Books, Labs, Exams, Library</span>
                                                </li>
                                                <li>
                                                    <span className="font-semibold block text-slate-800">Staff & HR</span>
                                                    <span className="text-xs text-slate-500">Salaries, Teaching/Non-Teaching Payments, Welfare</span>
                                                </li>
                                                <li>
                                                    <span className="font-semibold block text-slate-800">Administrative</span>
                                                    <span className="text-xs text-slate-500">Office Supplies, Printing, Software, Communication</span>
                                                </li>
                                                <li>
                                                    <span className="font-semibold block text-slate-800">Infrastructure (Maint.)</span>
                                                    <span className="text-xs text-slate-500">Repairs & Renovation</span>
                                                </li>
                                                <li>
                                                    <span className="font-semibold block text-slate-800">Maintenance & Housekeeping</span>
                                                    <span className="text-xs text-slate-500">Cleaning, Security, Pest Control</span>
                                                </li>
                                                <li>
                                                    <span className="font-semibold block text-slate-800">Transport & Utilities</span>
                                                    <span className="text-xs text-slate-500">Fuel, Vehicle Maint, Electricity, Water, Internet</span>
                                                </li>
                                                <li>
                                                    <span className="font-semibold block text-slate-800">Events & Marketing</span>
                                                    <span className="text-xs text-slate-500">Annual Day, Sports, Ads, Competitions</span>
                                                </li>
                                                <li>
                                                    <span className="font-semibold block text-slate-800">Professional & Financial</span>
                                                    <span className="text-xs text-slate-500">Audit, Legal, Bank Charges, Interest</span>
                                                </li>
                                            </ul>
                                        </div>

                                        <div className="p-3 bg-rose-50 rounded-lg border border-rose-100">
                                            <h5 className="font-bold text-rose-700 mb-2 uppercase text-xs tracking-wider">Excluded (Capital Exp)</h5>
                                            <ul className="space-y-2 text-xs text-rose-800">
                                                <li><span className="font-semibold">Building Construction</span></li>
                                                <li><span className="font-semibold">Furniture & Fixtures</span></li>
                                                <li><span className="font-semibold">Classroom Setup (Capital nature)</span></li>
                                                <li className="italic opacity-75">Any other capitalized asset purchases</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 flex justify-end">
                                <button
                                    onClick={() => setShowInfo(false)}
                                    className="px-5 py-2 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
