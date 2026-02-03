import { useState, useEffect } from 'react';
import {
    Plus,
    Trash2,
    Calendar,
    IndianRupee,
    Edit,
    Filter,
    Search,
    RotateCcw
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import ConfirmationModal from '../../components/ui/ConfirmationModal';

export default function IncomeOverview() {
    const { addToast } = useToast();
    const { user } = useAuth();
    const [income, setIncome] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState(null);
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null });

    const [categories, setCategories] = useState([]);

    // Filters
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        category: ''
    });

    // Form State
    const [formData, setFormData] = useState({
        amount: '',
        category: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        receiptNo: ''
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [summaryRes, categoriesRes] = await Promise.all([
                api.get('/finance/summary'),
                api.get('/finance/categories')
            ]);

            setSummary(summaryRes.data);
            setCategories(categoriesRes.data);

            // Set default category if available
            if (categoriesRes.data.length > 0 && !formData.category) {
                setFormData(prev => ({ ...prev, category: categoriesRes.data[0].name }));
            }

            // Fetch Personal Income List
            const params = new URLSearchParams();
            if (user?._id) params.append('userId', user._id);
            if (filters.category) params.append('category', filters.category);
            if (filters.startDate) params.append('startDate', filters.startDate);
            if (filters.endDate) params.append('endDate', filters.endDate);

            const incomeRes = await api.get(`/finance/income?${params.toString()}`);
            setIncome(incomeRes.data);

        } catch (error) {
            addToast('Failed to load data', 'error');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user, filters]);

    const clearFilters = () => {
        setFilters({
            startDate: '',
            endDate: '',
            category: ''
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editId) {
                await api.put(`/finance/income/${editId}`, formData);
                addToast('Income record updated', 'success');
            } else {
                await api.post('/finance/income', formData);
                addToast('Income source recorded', 'success');
            }

            setShowForm(false);
            setEditId(null);
            setFormData({
                amount: '',
                category: categories.length > 0 ? categories[0].name : '',
                description: '',
                date: new Date().toISOString().split('T')[0],
                receiptNo: ''
            });
            fetchData();
        } catch (error) {
            addToast(error.response?.data?.message || 'Failed to save income', 'error');
        }
    };

    const handleEdit = (item) => {
        setFormData({
            amount: item.amount,
            category: item.category,
            description: item.description,
            date: new Date(item.date).toISOString().split('T')[0],
            receiptNo: item.receiptNo || ''
        });
        setEditId(item._id);
        setShowForm(true);
    };

    const handleDeleteClick = (id) => {
        setDeleteModal({ isOpen: true, id });
    };

    const handleConfirmDelete = async () => {
        if (!deleteModal.id) return;

        try {
            await api.delete(`/finance/income/${deleteModal.id}`);
            addToast('Record deleted', 'success');
            setIncome(income.filter(inc => inc._id !== deleteModal.id));
            // Refresh summary to update totals
            const summaryRes = await api.get('/finance/summary');
            setSummary(summaryRes.data);
        } catch (error) {
            addToast('Failed to delete record', 'error');
        } finally {
            setDeleteModal({ isOpen: false, id: null });
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Income & Funding</h1>
                <p className="text-slate-500">Monitor student fees and manage other revenue sources</p>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4 border-t border-slate-200/60">
                <h2 className="text-xl font-bold text-slate-900">My Income Entries</h2>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${showFilters ? 'bg-indigo-50 text-indigo-600' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}`}
                    >
                        <Filter size={18} />
                        <span className="hidden md:inline">Filters</span>
                    </button>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl hover:bg-slate-800 transition-colors"
                    >
                        <Plus size={20} />
                        <span className="hidden md:inline">Add New Source</span>
                        <span className="md:hidden">Add</span>
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            {showFilters && (
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm animate-in fade-in slide-in-from-top-2">
                    <div className="flex flex-col md:flex-row gap-4 items-center flex-wrap">
                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <Calendar size={16} className="text-slate-400" />
                            <input
                                type="date"
                                value={filters.startDate}
                                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm w-full md:w-auto focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                placeholder="Start Date"
                            />
                            <span className="text-slate-400">-</span>
                            <input
                                type="date"
                                value={filters.endDate}
                                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm w-full md:w-auto focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                placeholder="End Date"
                            />
                        </div>

                        <select
                            value={filters.category}
                            onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm w-full md:w-48 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        >
                            <option value="">All Categories</option>
                            {categories.map(cat => <option key={cat._id} value={cat.name}>{cat.name}</option>)}
                        </select>

                        <button
                            onClick={clearFilters}
                            className="ml-auto flex items-center gap-1 text-sm text-slate-500 hover:text-red-500 transition-colors"
                            title="Reset Filters"
                        >
                            <RotateCcw size={16} /> Reset
                        </button>
                    </div>
                </div>
            )}

            {/* Add Income Form */}
            {showForm && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 animate-in fade-in slide-in-from-top-4">
                    <div className="mb-6 flex items-center justify-between">
                        <h2 className="text-lg font-bold text-slate-800">{editId ? 'Edit Income Record' : 'Record New Income'}</h2>
                        <button onClick={() => { setShowForm(false); setEditId(null); }} className="text-slate-400 hover:text-slate-600">Close</button>
                    </div>
                    <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-500 uppercase">Income Category</label>
                            <select
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                {categories.map(cat => <option key={cat._id} value={cat.name}>{cat.name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-500 uppercase">Receipt No (Optional)</label>
                            <input
                                type="text"
                                value={formData.receiptNo}
                                onChange={e => setFormData({ ...formData, receiptNo: e.target.value })}
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="Enter Receipt ID"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-500 uppercase">Amount (₹)</label>
                            <input
                                type="number"
                                required
                                min="0"
                                value={formData.amount}
                                onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-500 uppercase">Date Received</label>
                            <input
                                type="date"
                                required
                                value={formData.date}
                                onChange={e => setFormData({ ...formData, date: e.target.value })}
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-xs font-semibold text-slate-500 uppercase">Description</label>
                            <textarea
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 h-24 resize-none"
                            />
                        </div>

                        <div className="md:col-span-2 flex justify-end gap-3 pt-4 border-t border-slate-50">
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="px-6 py-2 text-slate-600 hover:bg-slate-50 rounded-lg font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-6 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors"
                            >
                                Save Income Record
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Income List */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <IndianRupee size={20} className="text-indigo-500" />
                        <h3 className="font-semibold text-slate-800">My Recorded Income</h3>
                    </div>
                    <span className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded">
                        {income.length} Records
                    </span>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-slate-500">Loading records...</div>
                ) : income.length === 0 ? (
                    <div className="p-12 text-center text-slate-400">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <IndianRupee size={24} />
                        </div>
                        <p>No additional income sources found.</p>
                        {Object.values(filters).some(x => x) && <p className="text-xs mt-2">Try clearing filters.</p>}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                                <tr>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Receipt No</th>
                                    <th className="px-6 py-4">Category</th>
                                    <th className="px-6 py-4">Description</th>
                                    <th className="px-6 py-4 text-right">Amount</th>
                                    {/* <th className="px-6 py-4 text-center">Actions</th> */}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {income.map((item) => (
                                    <tr key={item._id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 text-slate-600 text-sm">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={14} className="text-slate-400" />
                                                {new Date(item.date).toLocaleDateString('en-GB').replace(/\//g, '-')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 text-sm whitespace-nowrap">
                                            {item.receiptNo ? (
                                                <span className="font-mono bg-slate-100 px-2 py-1 rounded text-xs">{item.receiptNo}</span>
                                            ) : (
                                                <span className="text-slate-400 text-xs">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                                                {item.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-900">
                                            <p className="text-sm text-slate-600 font-normal line-clamp-1" title={item.description}>{item.description || '-'}</p>
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-slate-900">
                                            + ₹{item.amount.toLocaleString()}
                                        </td>
                                        {/* Actions Column Hidden
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => handleEdit(item)}
                                                    className="p-2 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                    title="Edit Record"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(item._id)}
                                                    className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                    title="Delete Record"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                        */}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <ConfirmationModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, id: null })}
                onConfirm={handleConfirmDelete}
                title="Delete Income Record"
                message="Are you sure you want to delete this income record? This action cannot be undone."
                confirmText="Delete Record"
            />
        </div>
    );
}
