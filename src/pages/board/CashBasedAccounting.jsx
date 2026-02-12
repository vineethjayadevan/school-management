import React, { useState } from 'react';
import {
    LayoutDashboard,
    PieChart,
    TrendingUp,
    Calculator
} from 'lucide-react';
import BoardDashboard from './BoardDashboard';
import ExpenseManager from './ExpenseManager';
import IncomeOverview from './IncomeOverview';
import CashAccountingView from './accounting/CashAccountingView';

export default function CashBasedAccounting() {
    const [activeTab, setActiveTab] = useState('ledger');

    const tabs = [
        { id: 'ledger', label: 'Cash Ledger', icon: LayoutDashboard },
        { id: 'expenses', label: 'Expenses', icon: PieChart },
        { id: 'income', label: 'Income & Funding', icon: TrendingUp },
        { id: 'accounting', label: 'Accounting', icon: Calculator },
    ];

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-900">Cash Based Accounting</h1>

            {/* Tabs */}
            <div className="border-b border-slate-200">
                <nav className="-mb-px flex space-x-8 overflow-x-auto">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    group inline-flex items-center px-1 py-4 border-b-2 font-medium text-sm gap-2 whitespace-nowrap
                                    ${activeTab === tab.id
                                        ? 'border-indigo-500 text-indigo-600'
                                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}
                                `}
                            >
                                <Icon size={18} className={activeTab === tab.id ? 'text-indigo-500' : 'text-slate-400 group-hover:text-slate-500'} />
                                {tab.label}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Content Area */}
            <div className="min-h-[500px]">
                {activeTab === 'ledger' && <BoardDashboard />}
                {activeTab === 'expenses' && <ExpenseManager />}
                {activeTab === 'income' && <IncomeOverview />}
                {activeTab === 'accounting' && <CashAccountingView />}
            </div>
        </div>
    );
}
