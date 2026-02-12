import React, { useState } from 'react';
import { PieChart, Scale } from 'lucide-react';
import AccrualProfitAndLoss from '../accrual/reports/AccrualProfitAndLoss';
import AccrualBalanceSheet from '../accrual/reports/AccrualBalanceSheet';

export default function AccrualAccountingView() {
    const [subTab, setSubTab] = useState('pnl');

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Sub-navigation for Accrual Basis */}
            <div className="bg-white p-1 rounded-xl border border-slate-200 inline-flex flex-wrap gap-1">
                <button
                    onClick={() => setSubTab('pnl')}
                    className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${subTab === 'pnl'
                        ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                        }`}
                >
                    <PieChart size={16} />
                    <span className="whitespace-nowrap">Profit & Loss (Accrual)</span>
                </button>
                <button
                    onClick={() => setSubTab('balance-sheet')}
                    className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${subTab === 'balance-sheet'
                        ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                        }`}
                >
                    <Scale size={16} />
                    <span className="whitespace-nowrap">Balance Sheet (Accrual)</span>
                </button>
            </div>

            <div className="bg-white min-h-[500px] rounded-2xl shadow-sm border border-slate-200 p-6">
                {subTab === 'pnl' && (
                    <>
                        <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <PieChart className="text-indigo-600" /> Profit & Loss Statement (Accrual Basis)
                        </h2>
                        <AccrualProfitAndLoss />
                    </>
                )}
                {subTab === 'balance-sheet' && (
                    <>
                        <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <Scale className="text-indigo-600" /> Balance Sheet
                        </h2>
                        <AccrualBalanceSheet />
                    </>
                )}
            </div>
        </div>
    );
}
