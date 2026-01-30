import { useState, useEffect } from 'react';
import {
    Plus,
    Trash2,
    TrendingUp,
    Wallet,
    Calendar,
    IndianRupee,
    Briefcase
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../components/ui/Toast';

export default function IncomeOverview() {
    const { addToast } = useToast();
    const [income, setIncome] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        amount: '',
        source: 'Investment',
        description: '',
        date: new Date().toISOString().split('T')[0]
    });

    const sources = ['Investment', 'Donation', 'Grant', 'Rental', 'Other'];

    const fetchData = async () => {
        try {
            const [summaryRes, incomeRes] = await Promise.all([
                api.get('/finance/summary'),
                api.get('/finance/income')
            ]);

            setSummary(summaryRes.data);
            setIncome(incomeRes.data);
        } catch (error) {
            addToast('Failed to load income data', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/finance/income', formData);
            addToast('Income source recorded', 'success');
            setShowForm(false);
            setFormData({
                title: '',
                amount: '',
                source: 'Investment',
                description: '',
                date: new Date().toISOString().split('T')[0]
            });
            fetchData();
        } catch (error) {
            addToast(error.response?.data?.message || 'Failed to add income', 'error');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this income record?')) {
            try {
                await api.delete(`/finance/income/${id}`);
                addToast('Record deleted', 'success');
                setIncome(income.filter(inc => inc._id !== id));
                // Refresh summary to update totals
                const summaryRes = await api.get('/finance/summary');
                setSummary(summaryRes.data);
            } catch (error) {
                addToast('Failed to delete record', 'error');
            }
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Income & Funding</h1>
                <p className="text-slate-500">Monitor student fees and manage other revenue sources</p>
            </div>

            {/* Income Highlights */}
            <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-6 text-white shadow-lg shadow-indigo-500/30">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                            <Wallet size={24} />
                        </div>
                        <div>
                            <p className="text-indigo-100 font-medium">Total Student Fees</p>
                            <h2 className="text-3xl font-bold">₹{summary?.totalFeeIncome?.toLocaleString() || 0}</h2>
                        </div>
                    </div>
                    <div className="h-1.5 w-full bg-black/20 rounded-full overflow-hidden">
                        <div className="h-full bg-white/80 w-3/4 rounded-full" /> {/* Mock progress bar */}
                    </div>
                    <p className="text-xs text-indigo-200 mt-2">Collected from authorized student payments</p>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-slate-500 font-medium mb-1">Other Income</p>
                        <h2 className="text-3xl font-bold text-slate-900">₹{summary?.totalOtherIncome?.toLocaleString() || 0}</h2>
                        <p className="text-xs text-emerald-500 flex items-center gap-1 mt-1 font-medium">
                            <TrendingUp size={14} /> +12% this month
                        </p>
                    </div>
                    <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
                        <Briefcase size={28} />
                    </div>
                </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4 border-t border-slate-200/60">
                <h2 className="text-xl font-bold text-slate-900">Other Sources</h2>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl hover:bg-slate-800 transition-colors"
                >
                    <Plus size={20} />
                    <span>Add New Source</span>
                </button>
            </div>

            {/* Add Income Form */}
            {showForm && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 animate-in fade-in slide-in-from-top-4">
                    <div className="mb-6 flex items-center justify-between">
                        <h2 className="text-lg font-bold text-slate-800">Record New Income</h2>
                        <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">Close</button>
                    </div>
                    <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-500 uppercase">Title / Name</label>
                            <input
                                type="text"
                                required
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="e.g. Alumni Donation"
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
                            <label className="text-xs font-semibold text-slate-500 uppercase">Source Type</label>
                            <select
                                value={formData.source}
                                onChange={e => setFormData({ ...formData, source: e.target.value })}
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                {sources.map(src => <option key={src} value={src}>{src}</option>)}
                            </select>
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
                {loading ? (
                    <div className="p-8 text-center text-slate-500">Loading records...</div>
                ) : income.length === 0 ? (
                    <div className="p-12 text-center text-slate-400">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <IndianRupee size={24} />
                        </div>
                        <p>No additional income sources recorded.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                                <tr>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Source Name</th>
                                    <th className="px-6 py-4">Type</th>
                                    <th className="px-6 py-4">Added By</th>
                                    <th className="px-6 py-4 text-right">Amount</th>
                                    <th className="px-6 py-4 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {income.map((item) => (
                                    <tr key={item._id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 text-slate-600 text-sm">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={14} className="text-slate-400" />
                                                {new Date(item.date).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-900">
                                            {item.title}
                                            {item.description && <p className="text-xs text-slate-400 font-normal">{item.description}</p>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                                                {item.source}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500">
                                            {item.addedBy?.name || 'Unknown'}
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-slate-900">
                                            + ₹{item.amount.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => handleDelete(item._id)}
                                                className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
