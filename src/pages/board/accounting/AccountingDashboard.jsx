import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, PieChart, Scale, Calculator, ArrowLeft } from 'lucide-react';

export default function AccountingDashboard() {
    const location = useLocation();
    const navigate = useNavigate();

    // If we are at root /board/accounting, redirect to P&L or show a landing?
    // Let's redirect to P&L by default or show menu
    useEffect(() => {
        if (location.pathname === '/board/accounting' || location.pathname === '/board/accounting/') {
            navigate('/board/accounting/pnl');
        }
    }, [location, navigate]);

    const navItems = [
        { path: 'pnl', icon: PieChart, label: 'Profit & Loss' },
        { path: 'balance-sheet', icon: Scale, label: 'Balance Sheet' },
        { path: 'assets', icon: LayoutDashboard, label: 'Asset Register' },
        { path: 'adjustments', icon: Calculator, label: 'Adjustments' },
    ];

    return (
        <div className="space-y-6">
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
                        <p className="text-slate-500 text-sm">Accrual-based financial reporting</p>
                    </div>
                </div>
            </div>

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
    );
}
