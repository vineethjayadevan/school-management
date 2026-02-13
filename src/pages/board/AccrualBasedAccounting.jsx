import React, { useState } from 'react';
import {
    LayoutDashboard,
    TrendingUp,
    ArrowDownLeft,
    CheckCircle2,
    Calculator,
    Tags,
    Briefcase
} from 'lucide-react';
import AccrualAccountingView from './accounting/AccrualAccountingView';
import Settlements from './accrual/Settlements';
import BoardDashboard from './BoardDashboard';
import ManageCategories from './ManageCategories';
import RevenueExpenseManager from './accrual/RevenueExpenseManager';
import ReceivablesPayablesManager from './accrual/ReceivablesPayablesManager';

export default function AccrualBasedAccounting() {
    const [activeTab, setActiveTab] = useState('ledger');

    const menuItems = [
        { id: 'ledger', label: 'Cash Ledger', icon: LayoutDashboard },
        { id: 'revenue_expense', label: 'Revenue & Expenses', icon: TrendingUp },
        { id: 'receivables_payables', label: 'Receivables & Payables', icon: ArrowDownLeft },
        { id: 'settlements', label: 'Settlements', icon: CheckCircle2 },
        { id: 'accounting', label: 'Accounting', icon: Calculator },
        { id: 'categories', label: 'Manage Categories', icon: Tags },
    ];

    const renderContent = () => {
        switch (activeTab) {
            case 'ledger':
                return <BoardDashboard />;
            case 'revenue_expense':
                return <RevenueExpenseManager />;
            case 'receivables_payables':
                return <ReceivablesPayablesManager />;
            case 'settlements':
                return <Settlements />;
            case 'accounting':
                return <AccrualAccountingView />;
            case 'categories':
                return <ManageCategories />;
            default:
                return <BoardDashboard />;
        }
    };

    return (
        <div className="flex flex-col lg:flex-row min-h-screen gap-6">
            {/* Sidebar Navigation */}
            <div className="w-full lg:w-64 flex-shrink-0">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sticky top-6">
                    <div className="mb-6 px-2">
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <Briefcase className="text-indigo-600" size={24} />
                            Finance & Acc.
                        </h2>
                        <p className="text-xs text-slate-500 mt-1">Accrual Based Management</p>
                    </div>

                    <nav className="space-y-1">
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = activeTab === item.id;

                            return (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveTab(item.id)}
                                    className={`
                                        w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all
                                        ${isActive
                                            ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                                    `}
                                >
                                    <Icon size={18} className={isActive ? 'text-indigo-600' : 'text-slate-400'} />
                                    {item.label}
                                </button>
                            );
                        })}
                    </nav>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 min-w-0">
                {renderContent()}
            </div>
        </div>
    );
}
