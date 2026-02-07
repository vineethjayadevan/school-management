import React from 'react';

export default function Adjustments() {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="bg-slate-50 p-6 rounded-full mb-4">
                <span className="text-4xl">🚧</span>
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Adjustments Module</h2>
            <p className="text-slate-500 max-w-sm">
                This module will handle manual journal entries for accruals, prepaid expenses, and unearned income adjustments.
            </p>
            <p className="mt-4 text-xs text-slate-400">Implementation pending (Backend ready).</p>
        </div>
    );
}
