import React, { useState } from 'react';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import Receivables from './Receivables';
import Payables from './Payables';

export default function ReceivablesPayablesManager() {
    const [activeTab, setActiveTab] = useState('receivables');

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-800">Receivables & Payables</h2>

            {/* Tabs */}
            <div className="bg-white p-1 rounded-xl border border-slate-200 inline-flex flex-wrap gap-1">
                <button
                    onClick={() => setActiveTab('receivables')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'receivables'
                        ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                        }`}
                >
                    <ArrowDownLeft size={16} />
                    <span>Receivables</span>
                </button>
                <button
                    onClick={() => setActiveTab('payables')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'payables'
                        ? 'bg-orange-50 text-orange-700 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                        }`}
                >
                    <ArrowUpRight size={16} />
                    <span>Payables</span>
                </button>
            </div>

            {/* Content */}
            <div>
                {activeTab === 'receivables' ? <Receivables /> : <Payables />}
            </div>
        </div>
    );
}
