import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Users, TrendingUp, DollarSign, Wallet, Info, Calculator, X } from 'lucide-react';

// Projection Modal Component
const ValuationProjectionModal = ({ isOpen, onClose, currentNetWorth, totalShareholders }) => {
    if (!isOpen) return null;

    const [projectedIncome, setProjectedIncome] = useState('');
    const [projectedExpenses, setProjectedExpenses] = useState('');

    // Formula: (Current Net Position + Projected Income - Projected Expenses)
    const incomeVal = parseFloat(projectedIncome) || 0;
    const expenseVal = parseFloat(projectedExpenses) || 0;

    const estimatedNetWorth = currentNetWorth + incomeVal - expenseVal;

    // Ensure we don't divide by zero
    const estimatedShareValue = totalShareholders > 0 ? (estimatedNetWorth / totalShareholders) : 0;

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Calculator size={20} className="text-indigo-600" />
                        Value Projection
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                        <p className="text-xs text-indigo-600 font-semibold uppercase mb-1">Current Base Value (Net Position)</p>
                        <p className="text-xl font-bold text-slate-800">{formatCurrency(currentNetWorth)}</p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                                Projected Fee Income (+)
                            </label>
                            <input
                                type="number"
                                value={projectedIncome}
                                onChange={(e) => setProjectedIncome(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="Enter expected income"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                                Expected Expenses (-)
                            </label>
                            <input
                                type="number"
                                value={projectedExpenses}
                                onChange={(e) => setProjectedExpenses(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="Enter expected expenses"
                            />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-slate-500 font-medium">Est. Future Net Position</p>
                                <p className={`text-lg font-bold ${estimatedNetWorth >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {formatCurrency(estimatedNetWorth)}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-slate-500 font-medium">Est. Per-Partner Balance</p>
                                <p className={`text-lg font-bold ${estimatedShareValue >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
                                    {formatCurrency(estimatedShareValue)}
                                </p>
                            </div>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2 text-center">
                            Based on {totalShareholders} partners equally sharing the projected outcome.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function Cashflow() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showTooltip, setShowTooltip] = useState(false);
    const [showCalculator, setShowCalculator] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await api.get('/finance/shareholders');
                setData(res.data);
            } catch (error) {
                console.error('Failed to fetch shareholder data', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!data) return <div>Error loading data.</div>;

    const { netWorth, totalShareholders, shareValue, shareholders, components } = data;

    return (
        <div className="space-y-6">
            <ValuationProjectionModal
                isOpen={showCalculator}
                onClose={() => setShowCalculator(false)}
                currentNetWorth={netWorth}
                totalShareholders={totalShareholders}
            />

            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Cashflow</h1>
                    <p className="text-slate-500 mt-1">Equity distribution and share value analysis</p>
                </div>
                <button
                    onClick={() => setShowCalculator(true)}
                    className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl font-medium hover:bg-indigo-100 transition-colors"
                >
                    <Calculator size={18} />
                    Estimate Future Value
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                            <Wallet size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">Current Net Cash Position</p>
                            <h3 className={`text-2xl font-bold ${netWorth < 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                                {formatCurrency(netWorth)}
                            </h3>
                        </div>
                    </div>
                    {netWorth < 0 ? (
                        <div className="text-xs text-rose-600 bg-rose-50 p-3 rounded-lg mt-2 border border-rose-100 leading-relaxed font-medium">
                            📉 This is a live cash position based on entries recorded so far. It will change as fees 💰, further investments 🚀, and other expenses are added. 🚧
                        </div>
                    ) : (
                        <div className="text-xs text-slate-400">Total Assets - Total Liabilities</div>
                    )}
                </div>

                <div className="bg-indigo-600 p-6 rounded-2xl shadow-lg shadow-indigo-200 text-white relative">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-white/20 rounded-xl">
                            <DollarSign size={24} />
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-indigo-100">Current Per-Partner Cash Balance</p>
                                <div
                                    className="relative"
                                    onMouseEnter={() => setShowTooltip(true)}
                                    onMouseLeave={() => setShowTooltip(false)}
                                >
                                    <Info size={16} className="text-indigo-200 cursor-help hover:text-white transition-colors" />

                                    {/* Tooltip */}
                                    {showTooltip && (
                                        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-72 bg-slate-900 text-white p-4 rounded-xl text-xs shadow-xl z-50">
                                            <div className="font-bold mb-2 text-indigo-300">Balance Formula</div>
                                            <div className="space-y-1.5 mb-3 border-b border-slate-700 pb-2">
                                                <div className="flex justify-between">
                                                    <span className="text-slate-400">Capital Invested:</span>
                                                    <span>{formatCurrency(components?.capitalInvested || 0)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-slate-400">(+) Revenue:</span>
                                                    <span>{formatCurrency(components?.incomeReceived || 0)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-slate-400">(-) Expenses:</span>
                                                    <span>{formatCurrency(components?.expensesPaid || 0)}</span>
                                                </div>
                                            </div>
                                            <div className="flex justify-between font-bold text-indigo-300">
                                                <span>= Net Position:</span>
                                                <span>{formatCurrency(netWorth)}</span>
                                            </div>
                                            <div className="mt-2 text-[10px] text-slate-500 text-center">
                                                (Net Position ÷ {totalShareholders} Members)
                                            </div>
                                            {/* Arrow */}
                                            <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900 rotate-45"></div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <h3 className="text-2xl font-bold">{formatCurrency(shareValue)}</h3>
                        </div>
                    </div>
                    {shareValue < 0 ? (
                        <div className="text-xs text-indigo-100 bg-white/10 p-3 rounded-lg mt-2 border border-white/10 leading-relaxed font-medium">
                            📉 Live position. Will update with new fees 💰 & investments 🚀.
                        </div>
                    ) : (
                        <div className="text-xs text-indigo-200">Per Shareholder (1/{totalShareholders})</div>
                    )}
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                            <Users size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-500">Total Shareholders</p>
                            <h3 className="text-2xl font-bold text-slate-800">{totalShareholders}</h3>
                        </div>
                    </div>
                    <div className="text-xs text-slate-400">Active Board Members</div>
                </div>
            </div>

            {/* Members Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                        <Users size={18} />
                        Board Members & Equity
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100">
                                <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Member</th>
                                <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Role</th>
                                <th className="p-4 text-xs font-semibold text-slate-500 uppercase text-right">Total Invested</th>
                                <th className="p-4 text-xs font-semibold text-slate-500 uppercase text-right">Equity Share</th>
                                <th className="p-4 text-xs font-semibold text-slate-500 uppercase text-right">Current Value</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {shareholders.map((member) => (
                                <tr key={member._id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={member.avatar || `https://ui-avatars.com/api/?name=${member.name}`}
                                                alt={member.name}
                                                className="w-10 h-10 rounded-full border border-slate-200"
                                            />
                                            <div>
                                                <div className="font-medium text-slate-800">{member.name}</div>
                                                <div className="text-xs text-slate-500">{member.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className="bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full text-xs font-medium capitalize">
                                            Board Member
                                        </span>
                                    </td>
                                    <td className="p-4 text-right font-medium text-slate-600">
                                        {formatCurrency(member.investedAmount || 0)}
                                    </td>
                                    <td className="p-4 text-right text-slate-600 font-medium">
                                        {(100 / totalShareholders).toFixed(2)}%
                                    </td>
                                    <td className="p-4 text-right font-bold text-slate-800">
                                        {formatCurrency(shareValue)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
