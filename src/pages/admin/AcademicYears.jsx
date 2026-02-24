import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Edit2, Trash2, Check, X, AlertCircle } from 'lucide-react';
import api from '../../services/api';

const AcademicYears = () => {
    const [years, setYears] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ name: '', startDate: '', endDate: '', isActive: false });
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchYears();
    }, []);

    const fetchYears = async () => {
        try {
            const { data } = await api.get('/academic-years');
            setYears(data);
        } catch (error) {
            console.error('Error fetching academic years:', error);
            showMessage('error', 'Failed to load academic years');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await api.put(`/academic-years/${editingId}`, formData);
                showMessage('success', 'Academic year updated successfully');
            } else {
                await api.post('/academic-years', formData);
                showMessage('success', 'Academic year created successfully');
            }
            fetchYears();
            resetForm();
        } catch (error) {
            console.error('Error saving academic year:', error);
            showMessage('error', error.response?.data?.message || 'Failed to save academic year');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this academic year?')) return;
        try {
            await api.delete(`/academic-years/${id}`);
            showMessage('success', 'Academic year deleted');
            fetchYears();
        } catch (error) {
            console.error('Error deleting academic year:', error);
            showMessage('error', error.response?.data?.message || 'Failed to delete academic year');
        }
    };

    const toggleActive = async (id, currentStatus) => {
        try {
            await api.put(`/academic-years/${id}`, { isActive: !currentStatus });
            fetchYears();
            showMessage('success', `Academic year marked as ${!currentStatus ? 'Active' : 'Inactive'}`);
        } catch (error) {
            showMessage('error', 'Failed to update status');
        }
    };

    const resetForm = () => {
        setFormData({ name: '', startDate: '', endDate: '', isActive: false });
        setEditingId(null);
        setShowForm(false);
    };

    const handleEdit = (year) => {
        setFormData({
            name: year.name,
            startDate: year.startDate.split('T')[0],
            endDate: year.endDate.split('T')[0],
            isActive: year.isActive
        });
        setEditingId(year._id);
        setShowForm(true);
    };

    const showMessage = (type, text) => {
        setMessage({ type, text });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    };

    return (
        <div className="p-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Calendar className="text-indigo-600" />
                        Academic Years
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Manage school terms and academic sessions.
                    </p>
                </div>
                {!showForm && (
                    <button
                        onClick={() => setShowForm(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-colors"
                    >
                        <Plus size={18} />
                        New Academic Year
                    </button>
                )}
            </div>

            {message.text && (
                <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                    {message.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
                    <span className="font-medium text-sm">{message.text}</span>
                </div>
            )}

            {showForm && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6 animate-in fade-in slide-in-from-top-4">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-slate-800">
                            {editingId ? 'Edit Academic Year' : 'Create New Academic Year'}
                        </h2>
                        <button onClick={resetForm} className="text-slate-400 hover:text-slate-600">
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Name (e.g., 2024-2025)</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            <div className="flex items-center mt-6">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.isActive}
                                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                        className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                                    />
                                    <span className="text-sm font-medium text-slate-700">Set as Active Year</span>
                                </label>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                                <input
                                    type="date"
                                    required
                                    value={formData.startDate}
                                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
                                <input
                                    type="date"
                                    required
                                    value={formData.endDate}
                                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors"
                            >
                                {editingId ? 'Update Year' : 'Create Year'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* List */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {loading ? (
                    <div className="p-8 flex justify-center">
                        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : years.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">
                        No academic years found. Create one to get started.
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                                <th className="p-4 font-semibold">Academic Year</th>
                                <th className="p-4 font-semibold">Start Date</th>
                                <th className="p-4 font-semibold">End Date</th>
                                <th className="p-4 font-semibold">Status</th>
                                <th className="p-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {years.map((year) => (
                                <tr key={year._id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-4">
                                        <div className="font-semibold text-slate-800">{year.name}</div>
                                    </td>
                                    <td className="p-4 text-sm text-slate-600">
                                        {new Date(year.startDate).toLocaleDateString()}
                                    </td>
                                    <td className="p-4 text-sm text-slate-600">
                                        {new Date(year.endDate).toLocaleDateString()}
                                    </td>
                                    <td className="p-4">
                                        <button
                                            onClick={() => toggleActive(year._id, year.isActive)}
                                            className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide border transition-colors ${year.isActive
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                                }`}
                                        >
                                            {year.isActive ? 'Active' : 'Inactive'}
                                        </button>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleEdit(year)}
                                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                                title="Edit"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(year._id)}
                                                disabled={year.isLocked}
                                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                                                title={year.isLocked ? "Cannot delete locked year" : "Delete"}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default AcademicYears;
