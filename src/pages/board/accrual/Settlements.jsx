import React, { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    Filter,
    CheckCircle2,
    ArrowDownLeft,
    ArrowUpRight,
    Calendar,
    IndianRupee,
    CreditCard,
    Wallet
} from 'lucide-react';
import api from '../../../services/api';
import { useToast } from '../../../components/ui/Toast';

export default function Settlements() {
    const { addToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [settlements, setSettlements] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [users, setUsers] = useState([]);

    // Filters
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        type: '',
        recordedBy: ''
    });

    // Form State
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        type: 'Receipt', // Receipt (In) or Payment (Out)
        relatedId: '', // ID of Receivable or Payable
        amount: '',
        paymentMode: 'Cash',
        description: '',
        documentType: 'Receipt', // Default for Payment
        documentNumber: '',
        category: '',
        subcategory: ''
    });

    // Dropdown Data
    const [outstandingItems, setOutstandingItems] = useState([]); // Receivables or Payables
    const [categories, setCategories] = useState([]); // For Capital Injection

    useEffect(() => {
        fetchSettlements();
        fetchUsers();
    }, [filters]); // Refetch when filters change

    // Fetch outstanding items whenever Type changes
    // Fetch dependencies whenever Type changes
    useEffect(() => {
        if (showForm) {
            if (formData.type === 'Capital Injection') {
                fetchCategories();
            } else {
                fetchOutstandingItems();
            }
        }
    }, [formData.type, showForm]);

    const fetchCategories = async () => {
        try {
            const res = await api.get('/finance/categories?type=capital');
            setCategories(res.data);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const fetchOutstandingItems = async () => {
        try {
            if (formData.type === 'Capital Injection') {
                setOutstandingItems([]);
                return;
            }

            const endpoint = formData.type === 'Receipt'
                ? '/accrual/receivables?status=Unpaid&status=Partial'
                : '/accrual/payables?status=Unpaid&status=Partial';

            const res = await api.get(endpoint);
            setOutstandingItems(res.data);
        } catch (error) {
            console.error('Error fetching outstanding items:', error);
        }
    };

    const fetchUsers = async () => {
        try {
            const res = await api.get('/users/list');
            setUsers(res.data);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const fetchSettlements = async () => {
        setLoading(true);
        try {
            const params = {};
            if (filters.startDate) params.startDate = filters.startDate;
            if (filters.endDate) params.endDate = filters.endDate;
            if (filters.type) params.type = filters.type;
            if (filters.recordedBy) params.recordedBy = filters.recordedBy;

            const res = await api.get('/accrual/settlements', { params });
            setSettlements(res.data);
        } catch (error) {
            console.error('Error fetching settlements:', error);
            addToast('Failed to load settlements', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleRelatedItemChange = (e) => {
        const id = e.target.value;
        const item = outstandingItems.find(i => i._id === id);

        setFormData(prev => ({
            ...prev,
            relatedId: id,
            amount: item ? item.balance : '', // Auto-fill with balance
            description: item
                ? `${formData.type} for ${formData.type === 'Receipt' ? item.customer : item.vendor}`
                : ''
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.post('/accrual/settlements', formData);
            addToast('Settlement recorded successfully', 'success');
            setShowForm(false);
            setFormData({
                date: new Date().toISOString().split('T')[0],
                type: 'Receipt',
                relatedId: '',
                amount: '',
                paymentMode: 'Cash',
                description: '',
                documentType: 'Receipt',
                documentNumber: '',
                category: '',
                subcategory: ''
            });
            fetchSettlements();
        } catch (error) {
            console.error('Error recording settlement:', error);
            addToast(error.response?.data?.message || 'Failed to record settlement', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header Actions */}
            <div className="flex flex-col space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h2 className="text-lg font-semibold text-slate-800">Cash Settlements</h2>

                    <button
                        onClick={() => setShowForm(true)}
                        className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm font-medium whitespace-nowrap"
                    >
                        <Plus size={18} />
                        Record Settlement
                    </button>
                </div>

                {/* Filters */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-center">
                    <div className="flex items-center gap-2">
                        <Filter size={16} className="text-slate-400" />
                        <span className="text-sm font-medium text-slate-700">Filters:</span>
                    </div>

                    {/* Date Range */}
                    <div className="flex gap-2">
                        <input
                            type="date"
                            value={filters.startDate}
                            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Start Date"
                        />
                        <span className="text-slate-400 self-center">-</span>
                        <input
                            type="date"
                            value={filters.endDate}
                            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="End Date"
                        />
                    </div>

                    {/* Type Filter */}
                    <select
                        value={filters.type}
                        onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                        className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="">All Types</option>
                        <option value="Receipt">Receipt (In)</option>
                        <option value="Payment">Payment (Out)</option>
                        <option value="Capital Injection">Capital Injection</option>
                    </select>

                    {/* Recorded By Filter */}
                    <select
                        value={filters.recordedBy}
                        onChange={(e) => setFilters({ ...filters, recordedBy: e.target.value })}
                        className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="">All Users</option>
                        {users.map(u => (
                            <option key={u._id} value={u._id}>{u.name}</option>
                        ))}
                    </select>

                    {/* Reset Filters */}
                    {(filters.startDate || filters.endDate || filters.type || filters.recordedBy) && (
                        <button
                            onClick={() => setFilters({ startDate: '', endDate: '', type: '', recordedBy: '' })}
                            className="text-sm text-rose-500 hover:text-rose-700 font-medium"
                        >
                            Reset
                        </button>
                    )}
                </div>
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
                            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <CheckCircle2 className="text-emerald-500" /> Record Cash Movement
                            </h2>
                            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
                                <Plus size={24} className="rotate-45" />
                            </button>
                        </div>

                        <div className="overflow-y-auto">
                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                {/* Toggle Type */}
                                <div className="flex bg-slate-100 p-1 rounded-lg">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, type: 'Receipt', relatedId: '', amount: '', category: '', subcategory: '' })}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${formData.type === 'Receipt'
                                            ? 'bg-white text-emerald-600 shadow-sm'
                                            : 'text-slate-500 hover:text-slate-700'
                                            }`}
                                    >
                                        <ArrowDownLeft size={16} /> Receipt (In)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, type: 'Payment', relatedId: '', amount: '', category: '', subcategory: '' })}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${formData.type === 'Payment'
                                            ? 'bg-white text-rose-600 shadow-sm'
                                            : 'text-slate-500 hover:text-slate-700'
                                            }`}
                                    >
                                        <ArrowUpRight size={16} /> Payment (Out)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, type: 'Capital Injection', relatedId: '', amount: '', category: '', subcategory: '' })}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${formData.type === 'Capital Injection'
                                            ? 'bg-white text-blue-600 shadow-sm'
                                            : 'text-slate-500 hover:text-slate-700'
                                            }`}
                                    >
                                        <Plus size={16} /> Capital (In)
                                    </button>
                                </div>

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

                                {formData.type !== 'Capital Injection' ? (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">
                                            Link to {formData.type === 'Receipt' ? 'Receivable' : 'Payable'} *
                                        </label>
                                        <select
                                            required
                                            value={formData.relatedId}
                                            onChange={handleRelatedItemChange}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        >
                                            <option value="">Select Item...</option>
                                            {outstandingItems.map(item => (
                                                <option key={item._id} value={item._id}>
                                                    {formData.type === 'Receipt' ? item.customer : item.vendor} - {parseFloat(item.balance).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })} due
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Category *</label>
                                            <select
                                                required
                                                value={formData.category}
                                                onChange={(e) => setFormData({ ...formData, category: e.target.value, subcategory: '' })}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            >
                                                <option value="">Select Category...</option>
                                                {categories.map(cat => (
                                                    <option key={cat._id} value={cat.name}>{cat.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Subcategory</label>
                                            <select
                                                value={formData.subcategory}
                                                onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            >
                                                <option value="">Select Subcategory...</option>
                                                {formData.category && categories.find(c => c.name === formData.category)?.subcategories?.map(sub => (
                                                    <option key={sub} value={sub}>{sub}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                )}

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
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Payment Mode *</label>
                                    <select
                                        required
                                        value={formData.paymentMode}
                                        onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="Cash">Cash</option>
                                        <option value="Bank Transfer">Bank Transfer</option>
                                        <option value="Cheque">Cheque</option>
                                        <option value="UPI">UPI</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        {formData.type === 'Payment' ? 'Document Details' : 'Receipt Number'}
                                    </label>
                                    <div className="space-y-3">
                                        {formData.type === 'Payment' && (
                                            <div className="flex gap-4">
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="documentType"
                                                        value="Receipt"
                                                        checked={formData.documentType === 'Receipt'}
                                                        onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}
                                                        className="text-indigo-600 focus:ring-indigo-500"
                                                    />
                                                    <span className="text-sm text-slate-700">Receipt</span>
                                                </label>
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="documentType"
                                                        value="Voucher"
                                                        checked={formData.documentType === 'Voucher'}
                                                        onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}
                                                        className="text-indigo-600 focus:ring-indigo-500"
                                                    />
                                                    <span className="text-sm text-slate-700">Voucher</span>
                                                </label>
                                            </div>
                                        )}

                                        <input
                                            type="text"
                                            placeholder={
                                                formData.type === 'Receipt'
                                                    ? "Enter Receipt Number (Optional)"
                                                    : formData.type === 'Capital Injection'
                                                        ? "Enter Reference/Receipt Number (Optional)"
                                                        : formData.documentType === 'Receipt'
                                                            ? "Enter Receipt Number (Mandatory)"
                                                            : "Enter Voucher Number (Optional)"
                                            }
                                            value={formData.documentNumber}
                                            onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            required={formData.type === 'Payment' && formData.documentType === 'Receipt'}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                                    <textarea
                                        rows="2"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                                    ></textarea>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className={`w-full py-2.5 rounded-lg text-white font-medium shadow-sm flex items-center justify-center gap-2 transition-colors ${formData.type === 'Payment'
                                        ? 'bg-rose-600 hover:bg-rose-700'
                                        : formData.type === 'Capital Injection'
                                            ? 'bg-blue-600 hover:bg-blue-700'
                                            : 'bg-emerald-600 hover:bg-emerald-700'
                                        }`}
                                >
                                    {loading
                                        ? 'Recording...'
                                        : `Confirm ${formData.type}`
                                    }
                                </button>
                            </form>
                        </div>
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
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Reference</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Mode</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Recorded By</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {settlements.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                                                <Wallet className="text-slate-400" />
                                            </div>
                                            <p>No settlements recorded yet.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                settlements.map((item) => (
                                    <tr key={item._id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                            {new Date(item.date).toLocaleDateString('en-GB').replace(/\//g, '-')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit ${item.type === 'Receipt'
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : item.type === 'Capital Injection'
                                                    ? 'bg-blue-100 text-blue-700'
                                                    : 'bg-rose-100 text-rose-700'
                                                }`}>
                                                {item.type === 'Receipt' ? <ArrowDownLeft size={12} />
                                                    : item.type === 'Capital Injection' ? <Plus size={12} />
                                                        : <ArrowUpRight size={12} />}
                                                {item.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-900 font-medium">
                                            <div className="flex flex-col">
                                                <span>
                                                    {item.type === 'Receipt'
                                                        ? item.relatedReceivable?.customer || 'Unknown Customer'
                                                        : item.type === 'Capital Injection'
                                                            ? `${item.category}${item.subcategory ? ` - ${item.subcategory}` : ''}`
                                                            : item.relatedPayable?.vendor || 'Unknown Vendor'
                                                    }
                                                </span>
                                                {(item.documentNumber || item.documentType) && (
                                                    <span className="text-xs text-slate-500">
                                                        {item.type === 'Receipt'
                                                            ? `Rcpt: ${item.documentNumber || '-'}`
                                                            : `${item.documentType}: ${item.documentNumber || '-'}`
                                                        }
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                            <span className="flex items-center gap-1.5">
                                                <CreditCard size={14} className="text-slate-400" />
                                                {item.paymentMode}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                            <div className="flex items-center gap-1.5">
                                                {/* Reusing User icon, make sure to import if not present, though most icons are already imported */}
                                                <span className="font-medium text-slate-600">{item.recordedBy?.name || 'Unknown'}</span>
                                            </div>
                                        </td>
                                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold text-right ${item.type === 'Receipt'
                                            ? 'text-emerald-600'
                                            : item.type === 'Capital Injection'
                                                ? 'text-blue-600'
                                                : 'text-rose-600'
                                            }`}>
                                            {item.type === 'Payment' ? '-' : '+'} {parseFloat(item.amount).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div >
    );
}
