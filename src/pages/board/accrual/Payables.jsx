import React, { useState, useEffect } from 'react';
import {
    Search,
    Filter,
    ArrowUpRight,
    Calendar,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';
import api from '../../../services/api';
import { useToast } from '../../../components/ui/Toast';

export default function Payables() {
    const { addToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [payables, setPayables] = useState([]);

    // Filters
    const [filters, setFilters] = useState({
        status: 'Unpaid',
        vendor: ''
    });

    useEffect(() => {
        fetchPayables();
    }, [filters]);

    const fetchPayables = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.status && filters.status !== 'All') params.append('status', filters.status);
            if (filters.vendor) params.append('vendor', filters.vendor);

            const res = await api.get(`/accrual/payables?${params.toString()}`);
            setPayables(res.data);
        } catch (error) {
            console.error('Error fetching payables:', error);
            addToast('Failed to load payables', 'error');
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Paid': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'Partial': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'Unpaid': return 'bg-rose-100 text-rose-700 border-rose-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    const totalOutstanding = payables.reduce((sum, item) => sum + (item.balance || 0), 0);

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Stats / Header */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                        <ArrowUpRight size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 font-medium">Total Payable</p>
                        <h3 className="text-2xl font-bold text-slate-900">
                            {totalOutstanding.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                        </h3>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200 shadow-sm flex-1 max-w-md">
                    <Search className="text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search by vendor..."
                        value={filters.vendor}
                        onChange={(e) => setFilters(prev => ({ ...prev, vendor: e.target.value }))}
                        className="bg-transparent border-none focus:outline-none text-sm w-full"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <div className="bg-white border border-slate-200 rounded-lg p-1 flex">
                        {['All', 'Unpaid', 'Partial', 'Paid'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setFilters(prev => ({ ...prev, status }))}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${filters.status === status
                                    ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                    }`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Vendor</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Due Date</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Original Amount</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Paid</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Balance</th>
                                <th className="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {payables.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                                                <CheckCircle2 className="text-slate-400" />
                                            </div>
                                            <p>No payables found matching filters.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                payables.map((item) => (
                                    <tr key={item._id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-amber-50 rounded-full flex items-center justify-center text-amber-600 font-bold text-xs">
                                                    {item.vendor.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-slate-900">{item.vendor}</p>
                                                    <p className="text-xs text-slate-500">{item.description}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                            {item.dueDate ? (
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar size={14} className="text-slate-400" />
                                                    {new Date(item.dueDate).toLocaleDateString('en-GB').replace(/\//g, '-')}
                                                </div>
                                            ) : (
                                                <span className="text-slate-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-slate-600">
                                            {parseFloat(item.amount).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-emerald-600 font-medium">
                                            {parseFloat(item.paidAmount).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-rose-600 font-bold">
                                            {parseFloat(item.balance).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(item.status)}`}>
                                                {item.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
