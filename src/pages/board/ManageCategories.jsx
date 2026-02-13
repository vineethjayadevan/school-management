import React, { useState, useEffect } from 'react';
import {
    LayoutDashboard,
    PieChart,
    TrendingUp,
    ChevronDown,
    ChevronUp,
    Plus,
    X,
    Filter,
    Search,
    Wallet
} from 'lucide-react';
import api from '../../services/api';

export default function ManageCategories() {
    const [incomeCategories, setIncomeCategories] = useState([]);
    const [expenseCategories, setExpenseCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    // State for UI
    const [selectedCategory, setSelectedCategory] = useState(null);

    // State for new subcategory input
    const [newSubcategory, setNewSubcategory] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchCategories();
    }, []);

    // Select first category when loaded if none selected
    useEffect(() => {
        if (!selectedCategory && !loading && (incomeCategories.length > 0 || expenseCategories.length > 0)) {
            // Prefer income first
            if (incomeCategories.length > 0) setSelectedCategory(incomeCategories[0]);
            else if (expenseCategories.length > 0) setSelectedCategory(expenseCategories[0]);
        }
    }, [loading, incomeCategories, expenseCategories]);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const [incomeRes, expenseRes] = await Promise.all([
                api.get('/finance/categories'),
                api.get('/finance/expense-categories')
            ]);

            setIncomeCategories(incomeRes.data);
            setExpenseCategories(expenseRes.data);
            setError('');
        } catch (err) {
            console.error('Error fetching categories:', err);
            setError('Failed to load categories');
        } finally {
            setLoading(false);
        }
    };

    const handleAddSubcategory = async (type, categoryId) => {
        if (!newSubcategory.trim()) return;

        try {
            setSubmitting(true);
            const apiType = type === 'expense' ? 'expense' : 'income';

            const res = await api.post(`/finance/categories/${apiType}/${categoryId}/subcategories`, {
                subcategory: newSubcategory.trim()
            });

            // Update local state and keep selection updated
            if (type === 'expense') {
                setExpenseCategories(prev => prev.map(c => c._id === categoryId ? res.data : c));
                setSelectedCategory(res.data);
            } else {
                setIncomeCategories(prev => prev.map(c => c._id === categoryId ? res.data : c));
                setSelectedCategory(res.data);
            }

            setNewSubcategory('');
        } catch (err) {
            console.error('Error adding subcategory:', err);
            alert(err.response?.data?.message || 'Failed to add subcategory');
        } finally {
            setSubmitting(false);
        }
    };

    // Group categories
    const getGroupedCategories = () => {
        const income = incomeCategories.filter(c => c.type === 'income' || !c.type);
        const capital = incomeCategories.filter(c => c.type === 'capital');
        const expenses = expenseCategories;

        return { income, capital, expenses };
    };

    const grouped = getGroupedCategories();

    // Flatten for search
    const allCategories = [
        ...grouped.income.map(c => ({ ...c, uiType: 'income' })),
        ...grouped.capital.map(c => ({ ...c, uiType: 'capital' })),
        ...grouped.expenses.map(c => ({ ...c, uiType: 'expense' }))
    ];

    const filteredCategories = allCategories.filter(c =>
        !searchQuery ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.subcategories.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const getTypeColor = (type) => {
        if (type === 'expense') return { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-100', icon: PieChart };
        if (type === 'capital') return { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100', icon: Wallet };
        return { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', icon: TrendingUp };
    };

    if (loading) {
        return (
            <div className="min-h-[600px] flex flex-col items-center justify-center text-slate-400">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-4"></div>
                <p>Loading categories...</p>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-100px)] max-h-[900px] flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Header Area */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between gap-4 bg-slate-50/50">
                <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <Filter className="text-indigo-600" size={20} />
                    Manage Categories
                </h1>

                <div className="relative w-full max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search categories..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Left Sidebar: Category List */}
                <div className="w-80 border-r border-slate-200 overflow-y-auto bg-slate-50/30">
                    <div className="p-3 space-y-6">
                        {/* Group Render Helper */}
                        {['income', 'capital', 'expense'].map(groupType => {
                            const groupLabel = groupType === 'expense' ? 'Expenses' : (groupType === 'capital' ? 'Capital & Assets' : 'Income Source');
                            const items = filteredCategories.filter(c => c.uiType === groupType);
                            const style = getTypeColor(groupType);

                            if (items.length === 0) return null;

                            return (
                                <div key={groupType}>
                                    <h3 className={`text-xs font-bold uppercase tracking-wider mb-2 px-3 ${style.text} opacity-80`}>
                                        {groupLabel}
                                    </h3>
                                    <div className="space-y-1">
                                        {items.map(category => (
                                            <button
                                                key={category._id}
                                                onClick={() => setSelectedCategory(category)}
                                                className={`
                                                    w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all
                                                    ${selectedCategory?._id === category._id
                                                        ? 'bg-white shadow-sm border border-slate-200 ring-1 ring-indigo-500/10'
                                                        : 'hover:bg-slate-100/80 border border-transparent'}
                                                `}
                                            >
                                                <div className={`w-8 h-8 rounded-lg ${style.bg} ${style.text} flex items-center justify-center shrink-0`}>
                                                    <style.icon size={16} />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className={`text-sm font-medium truncate ${selectedCategory?._id === category._id ? 'text-slate-900' : 'text-slate-600'}`}>
                                                        {category.name}
                                                    </p>
                                                    <p className="text-xs text-slate-400">{category.subcategories.length} items</p>
                                                </div>
                                                {selectedCategory?._id === category._id && (
                                                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}

                        {filteredCategories.length === 0 && (
                            <div className="text-center py-10 text-slate-400 text-sm">
                                No categories found.
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Panel: Details */}
                <div className="flex-1 overflow-y-auto bg-white p-6 md:p-8">
                    {selectedCategory ? (
                        <div className="max-w-3xl mx-auto animate-in fade-in zoom-in-95 duration-200">
                            {/* Detail Header */}
                            <div className="flex items-start justify-between mb-8 pb-6 border-b border-slate-100">
                                <div className="flex items-center gap-5">
                                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${getTypeColor(selectedCategory.uiType).bg} ${getTypeColor(selectedCategory.uiType).text}`}>
                                        {React.createElement(getTypeColor(selectedCategory.uiType).icon, { size: 32 })}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${getTypeColor(selectedCategory.uiType).bg} ${getTypeColor(selectedCategory.uiType).text}`}>
                                                {selectedCategory.uiType === 'expense' ? 'Expense Category' : (selectedCategory.uiType === 'capital' ? 'Capital Account' : 'Income Source')}
                                            </span>
                                        </div>
                                        <h2 className="text-3xl font-bold text-slate-900">{selectedCategory.name}</h2>
                                    </div>
                                </div>
                            </div>

                            {/* Subcategories List */}
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-slate-800">Subcategories</h3>
                                    <span className="text-sm text-slate-500 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                                        {selectedCategory.subcategories.length} Total
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {selectedCategory.subcategories.map((sub, idx) => (
                                        <div key={idx} className="group flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl hover:border-indigo-200 hover:shadow-sm transition-all">
                                            <div className="flex items-center gap-3">
                                                <div className="w-2 h-2 rounded-full bg-slate-300 group-hover:bg-indigo-500 transition-colors"></div>
                                                <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">{sub}</span>
                                            </div>
                                        </div>
                                    ))}
                                    {selectedCategory.subcategories.length === 0 && (
                                        <div className="col-span-full py-10 text-center border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
                                            <p className="text-slate-400 mb-1">No subcategories yet</p>
                                            <p className="text-xs text-slate-400">Add one below to get started</p>
                                        </div>
                                    )}
                                </div>

                                {/* Add New Trigger */}
                                <div className="pt-6 mt-6 border-t border-slate-100">
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Add New Subcategory</label>
                                    <div className="flex gap-3">
                                        <input
                                            type="text"
                                            value={newSubcategory}
                                            onChange={(e) => setNewSubcategory(e.target.value)}
                                            placeholder={`e.g. ${selectedCategory.uiType === 'expense' ? 'Electricity Bill' : 'Tuition Fees'}`}
                                            className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddSubcategory(selectedCategory.uiType, selectedCategory._id)}
                                        />
                                        <button
                                            onClick={() => handleAddSubcategory(selectedCategory.uiType, selectedCategory._id)}
                                            disabled={submitting || !newSubcategory.trim()}
                                            className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md transition-all flex items-center gap-2"
                                        >
                                            {submitting ? (
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            ) : (
                                                <Plus size={20} />
                                            )}
                                            Add
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 opacity-60">
                            <Filter size={64} className="mb-4 text-slate-200" />
                            <h3 className="text-lg font-medium text-slate-600">Select a Category</h3>
                            <p className="max-w-xs mx-auto mt-1">Choose a category from the sidebar to view details and manage subcategories.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
