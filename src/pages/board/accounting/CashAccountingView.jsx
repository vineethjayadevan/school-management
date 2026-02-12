import React, { useState } from 'react';
import { PieChart, Scale } from 'lucide-react';
import ProfitAndLoss from './ProfitAndLoss';
import BalanceSheet from './BalanceSheet';

export default function CashAccountingView() {
    const [cashSubTab, setCashSubTab] = useState('pnl');

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Sub-navigation for Cash Basis */}
            <div className="bg-white p-1 rounded-xl border border-slate-200 inline-flex flex-wrap gap-1">
                <button
                    onClick={() => setCashSubTab('pnl')}
                    className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${cashSubTab === 'pnl'
                        ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                        }`}
                >
                    <PieChart size={16} />
                    <span className="whitespace-nowrap">Cash Profit & Loss</span>
                </button>
                <button
                    onClick={() => setCashSubTab('balance-sheet')}
                    className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${cashSubTab === 'balance-sheet'
                        ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                        }`}
                >
                    <Scale size={16} />
                    <span className="whitespace-nowrap">Cash Balance Sheet</span>
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
    );
}
