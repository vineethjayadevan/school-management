import React, { useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import RevenueEntries from './RevenueEntries';
import ExpenseEntries from './ExpenseEntries';

export default function RevenueExpenseManager() {
    const [activeTab, setActiveTab] = useState('revenue');

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-800">Revenue & Expense Entries</h2>

            {/* Tabs */}
            <div className="bg-white p-1 rounded-xl border border-slate-200 inline-flex flex-wrap gap-1">
                <button
                    onClick={() => setActiveTab('revenue')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'revenue'
                        ? 'bg-emerald-50 text-emerald-700 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                        }`}
                >
                    <TrendingUp size={16} />
                    <span>Revenue Entries</span>
                </button>
                <button
                    onClick={() => setActiveTab('expense')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'expense'
                        ? 'bg-rose-50 text-rose-700 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                        }`}
                >
                    <TrendingDown size={16} />
                    <span>Expense Entries</span>
                </button>
            </div>

            {/* Content */}
            <div>
                {activeTab === 'revenue' ? <RevenueEntries /> : <ExpenseEntries />}
            </div>
        </div>
    );
}
