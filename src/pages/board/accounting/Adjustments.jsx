import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

export default function Adjustments() {
    const { user } = useAuth();
    const [adjustments, setAdjustments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        type: 'Outstanding Expense',
        date: new Date().toISOString().slice(0, 10),
        amount: '',
        description: ''
    });

    const adjustmentTypes = ['Outstanding Expense', 'Prepaid Expense', 'Accrued Income', 'Unearned Income'];

    useEffect(() => {
        fetchAdjustments();
    }, []);

    const fetchAdjustments = async () => {
        try {
            const response = await api.get('/accounting/adjustments');
            setAdjustments(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching adjustments:', error);
            toast.error('Failed to load adjustments');
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this adjustment?')) return;
        try {
            await api.delete(`/accounting/adjustments/${id}`);
            toast.success('Adjustment deleted');
            fetchAdjustments();
        } catch (error) {
            toast.error('Failed to delete adjustment');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/accounting/adjustments', formData);
            toast.success('Adjustment added successfully');
            setShowForm(false);
            setFormData({
                type: 'Outstanding Expense',
                date: new Date().toISOString().slice(0, 10),
                amount: '',
                description: ''
            });
            fetchAdjustments();
        } catch (error) {
            toast.error('Failed to add adjustment');
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Adjustments</h1>
                    <p className="text-slate-500 text-sm">Manage accruals and manual journal entries</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                >
                    {showForm ? 'Cancel' : '+ New Adjustment'}
                </button>
            </div>

            {showForm && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6 animate-fade-in">
                    <h3 className="font-semibold text-lg mb-4">Add New Adjustment</h3>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                            <select
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                            >
                                {adjustmentTypes.map(t => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Date (As Of)</label>
                            <input
                                type="date"
                                required
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Amount (₹)</label>
                            <input
                                type="number"
                                required
                                min="0"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                            <input
                                type="text"
                                required
                                placeholder="e.g. Accrued Salary for March"
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                        <div className="md:col-span-2 flex justify-end">
                            <button
                                type="submit"
                                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700"
                            >
                                Save Entry
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider">
                            <tr>
                                <th className="p-4 border-b">Date</th>
                                <th className="p-4 border-b">Type</th>
                                <th className="p-4 border-b">Description</th>
                                <th className="p-4 border-b text-right">Amount</th>
                                <th className="p-4 border-b text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                            {loading ? (
                                <tr><td colSpan="5" className="p-8 text-center text-slate-500">Loading...</td></tr>
                            ) : adjustments.length === 0 ? (
                                <tr><td colSpan="5" className="p-8 text-center text-slate-500">No adjustments recorded.</td></tr>
                            ) : (
                                adjustments.map((adj) => (
                                    <tr key={adj._id} className="hover:bg-slate-50">
                                        <td className="p-4 text-slate-600">{format(new Date(adj.date), 'dd MMM yyyy')}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${adj.type.includes('Income') ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                                                }`}>
                                                {adj.type}
                                            </span>
                                        </td>
                                        <td className="p-4 text-slate-800 font-medium">{adj.description}</td>
                                        <td className="p-4 text-slate-800 text-right font-mono">₹{adj.amount.toLocaleString()}</td>
                                        <td className="p-4 text-center">
                                            <button
                                                onClick={() => handleDelete(adj._id)}
                                                className="text-red-500 hover:text-red-700 p-1"
                                                title="Delete"
                                            >
                                                🗑️
                                            </button>
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
