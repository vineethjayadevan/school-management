import React, { useState } from 'react';
import {
    AlertCircle,
    TrendingUp,
    TrendingDown,
    ArrowDownLeft,
    ArrowUpRight,
    CheckCircle2,
    Calculator
} from 'lucide-react';
import AccrualAccountingView from './accounting/AccrualAccountingView';
import RevenueEntries from './accrual/RevenueEntries';
import ExpenseEntries from './accrual/ExpenseEntries';
import Receivables from './accrual/Receivables';
import Payables from './accrual/Payables';
import Settlements from './accrual/Settlements';

export default function AccrualBasedAccounting() {
    const [activeTab, setActiveTab] = useState('revenue');

    const tabs = [
        { id: 'revenue', label: 'Revenue Entries', icon: TrendingUp },
        { id: 'expense', label: 'Expense Entries', icon: TrendingDown },
        { id: 'receivables', label: 'Receivables', icon: ArrowDownLeft },
        { id: 'payables', label: 'Payables', icon: ArrowUpRight },
        { id: 'settlements', label: 'Settlements', icon: CheckCircle2 },
        { id: 'accounting', label: 'Accounting', icon: Calculator },
    ];

    const renderComingSoon = (title) => (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center animate-in fade-in duration-300">
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="text-indigo-500" size={32} />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">{title}</h2>
            <p className="text-slate-500">The Accrual-based {title.toLowerCase()} module is currently under development.</p>
        </div>
    );

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-900">Accrual Based Accounting</h1>

            {/* Tabs */}
            <div className="border-b border-slate-200">
                <nav className="-mb-px flex space-x-8 overflow-x-auto pb-1">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                                    group inline-flex items-center px-1 py-4 border-b-2 font-medium text-sm gap-2 whitespace-nowrap transition-colors
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
                {activeTab === 'revenue' && <RevenueEntries />}
                {activeTab === 'expense' && <ExpenseEntries />}
                {activeTab === 'receivables' && <Receivables />}
                {activeTab === 'payables' && <Payables />}
                {activeTab === 'settlements' && <Settlements />}
                {activeTab === 'accounting' && <AccrualAccountingView />}
            </div>
        </div>
    );
}
