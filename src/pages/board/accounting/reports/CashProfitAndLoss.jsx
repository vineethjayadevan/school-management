import React, { useState, useEffect } from 'react';
import {
    Download,
    Calendar,
    ArrowUpCircle,
    ArrowDownCircle,
    PieChart,
    RefreshCw,
    Info,
    X
} from 'lucide-react';
import api from '../../../../services/api';

export default function CashProfitAndLoss() {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);
    const [showInfo, setShowInfo] = useState(false);
    const [dateRange, setDateRange] = useState({
        startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0], // Jan 1st
        endDate: new Date().toISOString().split('T')[0] // Today
    });

    useEffect(() => {
        fetchReport();
    }, []);

    const fetchReport = async () => {
        setLoading(true);
        try {
            // Using basis=cash to get cash specific filtering from backend
            const res = await api.get(`/accounting/pnl?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}&basis=cash`);
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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
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
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100">
                    <div className="flex items-center gap-3 mb-2">
                        <ArrowUpCircle className="text-emerald-500" size={20} />
                        <span className="text-emerald-700 font-medium">Total Cash Revenue</span>
                    </div>
                    <h3 className="text-2xl font-bold text-emerald-900">
                        {data.revenue.total.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                    </h3>
                    <p className="text-xs text-emerald-600 mt-1">Fees + Other Income</p>
                </div>

                <div className="bg-rose-50 rounded-2xl p-6 border border-rose-100">
                    <div className="flex items-center gap-3 mb-2">
                        <ArrowDownCircle className="text-rose-500" size={20} />
                        <span className="text-rose-700 font-medium">Total Cash Expenses</span>
                    </div>
                    <h3 className="text-2xl font-bold text-rose-900">
                        {data.expenses.total.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                    </h3>
                    <p className="text-xs text-rose-600 mt-1">Operational Expenses</p>
                </div>

                <div className={`rounded-2xl p-6 border ${data.netProfit >= 0 ? 'bg-indigo-50 border-indigo-100' : 'bg-orange-50 border-orange-100'}`}>
                    <div className="flex items-center gap-3 mb-2">
                        <PieChart className={data.netProfit >= 0 ? 'text-indigo-500' : 'text-orange-500'} size={20} />
                        <span className={data.netProfit >= 0 ? 'text-indigo-700 font-medium' : 'text-orange-700 font-medium'}>
                            Cash Surplus / (Deficit)
                        </span>
                    </div>
                    <h3 className={`text-2xl font-bold ${data.netProfit >= 0 ? 'text-indigo-900' : 'text-orange-900'}`}>
                        {data.netProfit.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                    </h3>
                </div>
            </div>

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
