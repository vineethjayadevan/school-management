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
    Search
} from 'lucide-react';
import api from '../../services/api';

export default function ManageCategories() {
    const [incomeCategories, setIncomeCategories] = useState([]);
    const [expenseCategories, setExpenseCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    // State for managing expanded categories
    const [expandedCategories, setExpandedCategories] = useState({});

    // State for new subcategory input
    const [addingSubcatTo, setAddingSubcatTo] = useState(null); // ID of category being added to
    const [newSubcategory, setNewSubcategory] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchCategories();
    }, []);

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

    const toggleCategory = (id) => {
        setExpandedCategories(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const handleAddSubcategory = async (type, categoryId) => {
        if (!newSubcategory.trim()) return;

        try {
            setSubmitting(true);
            // type needed for API: 'income' or 'expense'
            // For income categories, the type in DB might be 'capital', but API expects 'income' for the route suffix if it maps to IncomeCategory model.
            // Wait, my controller logic is:
            // if (type === 'income') -> IncomeCategory
            // if (type === 'expense') -> ExpenseCategory
            // So for Capital categories (which are in IncomeCategory model), we must send 'income' as type to the API.

            const apiType = type === 'expense' ? 'expense' : 'income';

            const res = await api.post(`/finance/categories/${apiType}/${categoryId}/subcategories`, {
                subcategory: newSubcategory.trim()
            });

            // Update local state
            if (type === 'expense') {
                setExpenseCategories(prev => prev.map(c => c._id === categoryId ? res.data : c));
            } else {
                setIncomeCategories(prev => prev.map(c => c._id === categoryId ? res.data : c));
            }

            setNewSubcategory('');
            setAddingSubcatTo(null);
        } catch (err) {
            console.error('Error adding subcategory:', err);
            alert(err.response?.data?.message || 'Failed to add subcategory');
        } finally {
            setSubmitting(false);
        }
    };

    // Group categories by visual type
    const getGroupedCategories = () => {
        const income = incomeCategories.filter(c => c.type === 'income' || !c.type);
        const capital = incomeCategories.filter(c => c.type === 'capital');
        const expenses = expenseCategories;

        return { income, capital, expenses };
    };

    const grouped = getGroupedCategories();

    const filteredGroup = (group) => {
        if (!searchQuery) return group;
        return group.filter(c =>
            c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.subcategories.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    };

    const renderCategoryCard = (category, type) => {
        const isExpanded = expandedCategories[category._id];
        const isAdding = addingSubcatTo === category._id;

        return (
            <div key={category._id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-4">
                <div
                    onClick={() => toggleCategory(category._id)}
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${type === 'expense' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                            {type === 'expense' ? <PieChart size={20} /> : <TrendingUp size={20} />}
                        </div>
                        <div>
                            <h3 className="font-semibold text-slate-800">{category.name}</h3>
                            <p className="text-xs text-slate-500">{category.subcategories.length} subcategories</p>
                        </div>
                    </div>
                    {isExpanded ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                </div>

                {isExpanded && (
                    <div className="bg-slate-50 p-4 border-t border-slate-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                            {category.subcategories.map((sub, idx) => (
                                <div key={idx} className="bg-white px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 flex items-center justify-between">
                                    <span>{sub}</span>
                                    {/* No delete button as per requirement */}
                                </div>
                            ))}
                            {category.subcategories.length === 0 && (
                                <div className="col-span-full text-center py-2 text-slate-400 text-sm italic">
                                    No subcategories defined
                                </div>
                            )}
                        </div>

                        {/* Add Subcategory */}
                        {isAdding ? (
                            <div className="flex items-center gap-2 mt-4 animate-in fade-in slide-in-from-top-2">
                                <input
                                    type="text"
                                    value={newSubcategory}
                                    onChange={(e) => setNewSubcategory(e.target.value)}
                                    placeholder="Enter subcategory name..."
                                    className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    autoFocus
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleAddSubcategory(type, category._id);
                                        if (e.key === 'Escape') {
                                            setAddingSubcatTo(null);
                                            setNewSubcategory('');
                                        }
                                    }}
                                />
                                <button
                                    onClick={() => handleAddSubcategory(type, category._id)}
                                    disabled={submitting}
                                    className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    {submitting ? 'Adding...' : 'Add'}
                                </button>
                                <button
                                    onClick={() => {
                                        setAddingSubcatTo(null);
                                        setNewSubcategory('');
                                    }}
                                    className="p-2 text-slate-500 hover:bg-slate-200 rounded-lg"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => {
                                    setAddingSubcatTo(category._id);
                                    setNewSubcategory('');
                                }}
                                className="mt-2 flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                            >
                                <Plus size={16} />
                                Add Subcategory
                            </button>
                        )}
                    </div>
                )}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="min-h-[400px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Manage Categories</h1>
                    <p className="text-slate-500">View and add subcategories for financial tracking</p>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search categories..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full md:w-64"
                    />
                </div>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-100">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Income & Capital Column */}
                <div className="space-y-8">
                    {/* Income Section */}
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <span className="w-2 h-6 bg-green-500 rounded-full"></span>
                            Income Categories
                        </h2>
                        <div className="space-y-4">
                            {filteredGroup(grouped.income).map(c => renderCategoryCard(c, 'income'))}
                            {filteredGroup(grouped.income).length === 0 && (
                                <p className="text-slate-500 text-sm italic">No income categories found.</p>
                            )}
                        </div>
                    </div>

                    {/* Capital Section */}
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <span className="w-2 h-6 bg-blue-500 rounded-full"></span>
                            Capital Categories
                        </h2>
                        <div className="space-y-4">
                            {filteredGroup(grouped.capital).map(c => renderCategoryCard(c, 'capital'))}
                            {filteredGroup(grouped.capital).length === 0 && (
                                <p className="text-slate-500 text-sm italic">No capital categories found.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Expenses Column */}
                <div>
                    <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <span className="w-2 h-6 bg-red-500 rounded-full"></span>
                        Expense Categories
                    </h2>
                    <div className="space-y-4">
                        {filteredGroup(grouped.expenses).map(c => renderCategoryCard(c, 'expense'))}
                        {filteredGroup(grouped.expenses).length === 0 && (
                            <p className="text-slate-500 text-sm italic">No expense categories found.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
