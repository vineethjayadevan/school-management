import { useState, useEffect } from 'react';
import {
    Plus,
    Trash2,
    Search,
    Filter,
    FileText,
    Calendar,
    IndianRupee,
    Edit,
    X,
    RotateCcw
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import ConfirmationModal from '../../components/ui/ConfirmationModal';

export default function ExpenseManager() {
    const { addToast } = useToast();
    const { user } = useAuth();
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState(null);
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null });

    const [expenseCategories, setExpenseCategories] = useState([]);
    const [availableSubcategories, setAvailableSubcategories] = useState([]);

    // Filters
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        category: '',
        subcategory: ''
    });
    const [filterSubcategories, setFilterSubcategories] = useState([]);

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        amount: '',
        category: '',
        subcategory: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        receiptUrl: '',
        referenceType: 'Voucher',
        referenceNo: ''
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch Categories first if empty
            if (expenseCategories.length === 0) {
                const categoriesRes = await api.get('/finance/expense-categories');
                setExpenseCategories(categoriesRes.data);
            }

            // Build Params
            const params = new URLSearchParams();
            if (user?._id) params.append('userId', user._id); // Restrict to current user
            if (filters.category) params.append('category', filters.category);
            if (filters.subcategory) params.append('subcategory', filters.subcategory);
            if (filters.startDate) params.append('startDate', filters.startDate);
            if (filters.endDate) params.append('endDate', filters.endDate);

            const expensesRes = await api.get(`/finance/expenses?${params.toString()}`);
            setExpenses(expensesRes.data);

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
    }, [user, filters]); // Re-fetch when filters or user changes

    // Update filter subcategories when filter category changes
    const handleFilterCategoryChange = (e) => {
        const catName = e.target.value;
        setFilters(prev => ({ ...prev, category: catName, subcategory: '' }));
        const categoryObj = expenseCategories.find(c => c.name === catName);
        setFilterSubcategories(categoryObj ? categoryObj.subcategories : []);
    };

    const clearFilters = () => {
        setFilters({
            startDate: '',
            endDate: '',
            category: '',
            subcategory: ''
        });
    };

    // Form logic methods (kept same)
    const handleCategoryChange = (e) => {
        const selectedCategoryName = e.target.value;
        const categoryObj = expenseCategories.find(c => c.name === selectedCategoryName);

        setFormData({
            ...formData,
            category: selectedCategoryName,
            subcategory: '' // Reset subcategory
        });

        setAvailableSubcategories(categoryObj ? categoryObj.subcategories : []);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editId) {
                await api.put(`/finance/expenses/${editId}`, formData);
                addToast('Expense record updated', 'success');
            } else {
                await api.post('/finance/expenses', formData);
                addToast('Expense recorded successfully', 'success');
            }

            setShowForm(false);
            setEditId(null);
            setFormData({
                title: '',
                amount: '',
                category: '',
                subcategory: '',
                description: '',
                date: new Date().toISOString().split('T')[0],
                receiptUrl: '',
                referenceType: 'Voucher',
                referenceNo: ''
            });
            fetchData();
        } catch (error) {
            addToast(error.response?.data?.message || 'Failed to save expense', 'error');
        }
    };

    const handleEdit = (expense) => {
        setFormData({
            title: expense.title,
            amount: expense.amount,
            category: expense.category,
            subcategory: expense.subcategory,
            description: expense.description,
            date: new Date(expense.date).toISOString().split('T')[0],
            receiptUrl: expense.receiptUrl || '',
            referenceType: expense.referenceType || 'Voucher',
            referenceNo: expense.referenceNo || ''
        });

        const categoryObj = expenseCategories.find(c => c.name === expense.category);
        setAvailableSubcategories(categoryObj ? categoryObj.subcategories : []);

        setEditId(expense._id);
        setShowForm(true);
    };

    const handleDeleteClick = (id) => {
        setDeleteModal({ isOpen: true, id });
    };

    const handleConfirmDelete = async () => {
        if (!deleteModal.id) return;

        try {
            await api.delete(`/finance/expenses/${deleteModal.id}`);
            addToast('Expense deleted', 'success');
            setExpenses(expenses.filter(exp => exp._id !== deleteModal.id));
        } catch (error) {
            addToast('Failed to delete expense', 'error');
        } finally {
            setDeleteModal({ isOpen: false, id: null });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">My Expenses</h1>
                    <p className="text-slate-500">Manage your personal expense records</p>
                </div>
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
                        className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors"
                    >
                        <Plus size={20} />
                        <span className="hidden md:inline">Record Expense</span>
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
                            onChange={handleFilterCategoryChange}
                            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm w-full md:w-48 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        >
                            <option value="">All Categories</option>
                            {expenseCategories.map(cat => <option key={cat._id} value={cat.name}>{cat.name}</option>)}
                        </select>

                        <select
                            value={filters.subcategory}
                            onChange={(e) => setFilters(prev => ({ ...prev, subcategory: e.target.value }))}
                            disabled={!filters.category}
                            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm w-full md:w-48 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50"
                        >
                            <option value="">All Subcategories</option>
                            {filterSubcategories.map(sub => <option key={sub} value={sub}>{sub}</option>)}
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

            {/* Add Expense Form */}
            {showForm && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 animate-in fade-in slide-in-from-top-4">
                    <div className="mb-6 flex items-center justify-between">
                        <h2 className="text-lg font-bold text-slate-800">{editId ? 'Edit Expense Record' : 'New Expense Record'}</h2>
                        <button onClick={() => { setShowForm(false); setEditId(null); }} className="text-slate-400 hover:text-slate-600">Close</button>
                    </div>
                    <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-6">
                        {/* Reference Type Check */}
                        <div className="md:col-span-2 flex gap-6 bg-slate-50 p-4 rounded-lg">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="referenceType"
                                    value="Voucher"
                                    checked={formData.referenceType === 'Voucher'}
                                    onChange={(e) => setFormData({ ...formData, referenceType: e.target.value })}
                                    className="text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="font-medium text-slate-700">Voucher</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="referenceType"
                                    value="Receipt"
                                    checked={formData.referenceType === 'Receipt'}
                                    onChange={(e) => setFormData({ ...formData, referenceType: e.target.value })}
                                    className="text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="font-medium text-slate-700">Receipt Number</span>
                            </label>
                        </div>

                        {formData.referenceType === 'Receipt' && (
                            <div className="space-y-2 md:col-span-2 animate-in fade-in">
                                <label className="text-xs font-semibold text-slate-500 uppercase">Receipt No / ID</label>
                                <input
                                    type="text"
                                    required={formData.referenceType === 'Receipt'}
                                    value={formData.referenceNo}
                                    onChange={e => setFormData({ ...formData, referenceNo: e.target.value })}
                                    className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Enter Receipt Number"
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-500 uppercase">Expense Title</label>
                            <input
                                type="text"
                                required
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="e.g. Monthly Electricity Bill"
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
                                placeholder="0.00"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-500 uppercase">Category</label>
                            <select
                                value={formData.category}
                                onChange={handleCategoryChange}
                                required
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="">Select Category</option>
                                {expenseCategories.map(cat => <option key={cat._id} value={cat.name}>{cat.name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-500 uppercase">Subcategory</label>
                            <select
                                value={formData.subcategory}
                                onChange={e => setFormData({ ...formData, subcategory: e.target.value })}
                                required
                                disabled={!formData.category}
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                            >
                                <option value="">Select Subcategory</option>
                                {availableSubcategories.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-500 uppercase">Date</label>
                            <input
                                type="date"
                                required
                                value={formData.date}
                                onChange={e => setFormData({ ...formData, date: e.target.value })}
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-xs font-semibold text-slate-500 uppercase">Description (Optional)</label>
                            <textarea
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 h-24 resize-none"
                                placeholder="Additional details..."
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
                                className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20"
                            >
                                Save Record
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Expenses List */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                        <FileText size={20} className="text-indigo-500" />
                        My Transactions
                    </h3>
                    <span className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded">
                        {expenses.length} Records
                    </span>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-slate-500">Loading expenses...</div>
                ) : expenses.length === 0 ? (
                    <div className="p-12 text-center text-slate-400">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <IndianRupee size={24} />
                        </div>
                        <p>No expenses found.</p>
                        {Object.values(filters).some(x => x) && <p className="text-xs mt-2">Try clearing filters.</p>}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                                <tr>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Ref. No</th>
                                    <th className="px-6 py-4">Title</th>
                                    <th className="px-6 py-4">Category</th>
                                    <th className="px-6 py-4 text-right">Amount</th>
                                    <th className="px-6 py-4 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {expenses.map((expense) => (
                                    <tr key={expense._id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 text-slate-600 text-sm whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={14} className="text-slate-400" />
                                                {new Date(expense.date).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 text-sm whitespace-nowrap">
                                            {expense.referenceType === 'Receipt' ? (
                                                <span className="font-mono bg-slate-100 px-2 py-1 rounded text-xs">{expense.referenceNo}</span>
                                            ) : (
                                                <span className="text-slate-400 text-xs">Voucher</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-medium text-slate-900">{expense.title}</p>
                                            <p className="text-xs text-slate-400 truncate max-w-xs">{expense.description}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 w-fit mb-1">
                                                    {expense.category}
                                                </span>
                                                <span className="text-xs text-slate-500 ml-1">
                                                    {expense.subcategory}
                                                </span>
                                            </div>
                                        </td>
                                        {/* Removed Added By column */}
                                        <td className="px-6 py-4 text-right font-bold text-slate-900">
                                            ₹{expense.amount.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {/* Always show actions as we only fetch own expenses */}
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => handleEdit(expense)}
                                                    className="p-2 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                    title="Edit Record"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(expense._id)}
                                                    className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                    title="Delete Record"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
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
                title="Delete Expense"
                message="Are you sure you want to delete this expense record? This action cannot be undone."
                confirmText="Delete Expense"
            />
        </div>
    );
}
