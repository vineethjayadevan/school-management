import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, PieChart, Scale, Calculator, ArrowLeft } from 'lucide-react';
import ProfitAndLoss from './ProfitAndLoss';
import BalanceSheet from './BalanceSheet';

export default function AccountingDashboard() {
    const location = useLocation();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('accrual');
    const [cashSubTab, setCashSubTab] = useState('pnl');

    // If we are at root /board/accounting, redirect to P&L or show a landing?
    useEffect(() => {
        if (activeTab === 'accrual' && (location.pathname === '/board/accounting' || location.pathname === '/board/accounting/')) {
            navigate('/board/accounting/pnl');
        }
    }, [location, navigate, activeTab]);

    const navItems = [
        { path: 'pnl', icon: PieChart, label: 'Profit & Loss' },
        { path: 'balance-sheet', icon: Scale, label: 'Balance Sheet' },
        { path: 'assets', icon: LayoutDashboard, label: 'Asset Register' },
        { path: 'adjustments', icon: Calculator, label: 'Adjustments' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/board/dashboard')}
                            className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800">Accounting Module</h1>
                            <p className="text-slate-500 text-sm">Financial Reporting & Analysis</p>
                        </div>
                    </div>
                </div>

                {/* Main Tabs: Cash vs Accrual */}
                <div className="bg-slate-100 p-1 rounded-xl inline-flex self-start">
                    <button
                        onClick={() => setActiveTab('cash')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'cash'
                            ? 'bg-white text-indigo-700 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Cash Based Accounting
                    </button>
                    <button
                        onClick={() => setActiveTab('accrual')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'accrual'
                            ? 'bg-white text-indigo-700 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Accrual Based Accounting
                    </button>
                </div>
            </div>

            {/* CASH BASED VIEW */}
            {activeTab === 'cash' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    {/* Sub-navigation for Cash Basis */}
                    <div className="bg-white p-1 rounded-xl border border-slate-200 inline-flex flex-wrap gap-1">
                        <button
                            onClick={() => setCashSubTab('pnl')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${cashSubTab === 'pnl'
                                ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                }`}
                        >
                            <PieChart size={16} />
                            Cash Profit & Loss
                        </button>
                        <button
                            onClick={() => setCashSubTab('balance-sheet')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${cashSubTab === 'balance-sheet'
                                ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                }`}
                        >
                            <Scale size={16} />
                            Cash Balance Sheet
                        </button>
                    </div>

                    <div className="bg-white min-h-[500px] rounded-2xl shadow-sm border border-slate-200 p-6">
                        {cashSubTab === 'pnl' && (
                            <>
                                <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                                    <PieChart className="text-indigo-600" /> Cash Profit & Loss
                                </h2>
                                <ProfitAndLoss basis="cash" />
                            </>
                        )}
                        {cashSubTab === 'balance-sheet' && (
                            <>
                                <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                                    <Scale className="text-indigo-600" /> Cash Balance Sheet
                                </h2>
                                <BalanceSheet basis="cash" />
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* ACCRUAL BASED VIEW (Existing) */}
            {activeTab === 'accrual' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                    {/* Sub-navigation */}
                    <div className="bg-white p-1 rounded-xl border border-slate-200 inline-flex flex-wrap gap-1">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) => `
                                    flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                                    ${isActive
                                        ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                    }
                                `}
                            >
                                <item.icon size={16} />
                                {item.label}
                            </NavLink>
                        ))}
                    </div>

                    <div className="bg-white min-h-[500px] rounded-2xl shadow-sm border border-slate-200 p-6">
                        <Outlet />
                    </div>
                </div>
            )}
        </div>
    );
}
