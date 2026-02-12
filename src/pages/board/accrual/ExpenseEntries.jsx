import React, { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    Filter,
    Calendar,
    IndianRupee,
    FileText,
    User,
    ArrowDownLeft
} from 'lucide-react';
import api from '../../../services/api';
import { useToast } from '../../../components/ui/Toast';

export default function ExpenseEntries() {
    const { addToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [entries, setEntries] = useState([]);
    const [showForm, setShowForm] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        vendor: '',
        category: '',
        subcategory: '',
        amount: '',
        dueDate: '', // Optional
        description: ''
    });

    const [categories, setCategories] = useState([]);

    // Filters
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        vendor: ''
    });

    useEffect(() => {
        fetchEntries();
        fetchCategories();
    }, []);

    useEffect(() => {
        fetchEntries();
    }, [filters]);

    const fetchCategories = async () => {
        try {
            const res = await api.get('/finance/expense-categories');
            setCategories(res.data);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const fetchEntries = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.startDate) params.append('startDate', filters.startDate);
            if (filters.endDate) params.append('endDate', filters.endDate);
            if (filters.vendor) params.append('vendor', filters.vendor);

            const res = await api.get(`/accrual/expense?${params.toString()}`);
            setEntries(res.data);
        } catch (error) {
            console.error('Error fetching expense entries:', error);
            addToast('Failed to load expense entries', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/accrual/expense', formData);
            addToast('Expense recognized successfully', 'success');
            setShowForm(false);
            setFormData({
                date: new Date().toISOString().split('T')[0],
                vendor: '',
                category: '',
                subcategory: '',
                amount: '',
                dueDate: '',
                description: ''
            });
            fetchEntries();
        } catch (error) {
            console.error('Error saving expense:', error);
            addToast(error.response?.data?.message || 'Failed to save expense', 'error');
        } finally {
            setLoading(false);
        }
    };

    const availableSubcategories = formData.category
        ? categories.find(c => c.name === formData.category)?.subcategories || []
        : [];

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-200 shadow-sm flex-1">
                    <Search className="text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search by vendor/staff..."
                        value={filters.vendor}
                        onChange={(e) => setFilters(prev => ({ ...prev, vendor: e.target.value }))}
                        className="bg-transparent border-none focus:outline-none text-sm w-full"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <input
                        type="date"
                        value={filters.startDate}
                        onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                        className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className="text-slate-400">-</span>
                    <input
                        type="date"
                        value={filters.endDate}
                        onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                        className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>

                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 bg-rose-600 text-white px-4 py-2 rounded-lg hover:bg-rose-700 transition-colors shadow-sm font-medium whitespace-nowrap"
                >
                    <Plus size={18} />
                    Recognize Expense
                </button>
            </div>

            {/* Form Modal/Panel */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <ArrowDownLeft className="text-rose-500" /> Recognize Expense
                            </h2>
                            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
                                <Plus size={24} className="rotate-45" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Date *</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Vendor / Staff *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Office Supplies Co, Teacher Name"
                                        value={formData.vendor}
                                        onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Category *</label>
                                    <select
                                        required
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value, subcategory: '' })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="">Select Category</option>
                                        {categories.map(c => (
                                            <option key={c._id} value={c.name}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Subcategory</label>
                                    <select
                                        value={formData.subcategory}
                                        onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        disabled={!formData.category}
                                    >
                                        <option value="">Select Subcategory</option>
                                        {availableSubcategories.map(s => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Amount *</label>
                                    <div className="relative">
                                        <IndianRupee size={16} className="absolute left-3 top-2.5 text-slate-400" />
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            value={formData.amount}
                                            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Due Date (For Payment)</label>
                                    <input
                                        type="date"
                                        value={formData.dueDate}
                                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                                    <textarea
                                        rows="3"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                                        placeholder="Optional details..."
                                    ></textarea>
                                </div>
                            </div>

                            <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-6 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {loading ? 'Saving...' : 'Save & Create Payable'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* List */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Vendor / Staff</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Description</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {entries.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                                                <FileText className="text-slate-400" />
                                            </div>
                                            <p>No expense entries found.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                entries.map((entry) => (
                                    <tr key={entry._id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                            {new Date(entry.date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 bg-rose-100 rounded-full flex items-center justify-center text-rose-600 font-bold text-xs">
                                                    {entry.vendor.charAt(0)}
                                                </div>
                                                <span className="text-sm font-medium text-slate-900">{entry.vendor}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                            <div className="flex flex-col">
                                                <span>{entry.category}</span>
                                                {entry.subcategory && (
                                                    <span className="text-xs text-slate-400">{entry.subcategory}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600 max-w-xs truncate">
                                            {entry.description || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-rose-600">
                                            - {parseFloat(entry.amount).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
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
