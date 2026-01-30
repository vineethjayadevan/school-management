import { useState, useEffect, useRef } from 'react';
import {
    DollarSign,
    TrendingDown,
    TrendingUp,
    CreditCard,
    AlertCircle,
    Filter,
    Printer,
    Download,
    X,
    Calendar,
    Search
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useReactToPrint } from 'react-to-print';

export default function BoardDashboard() {
    const { user } = useAuth();
    const [summary, setSummary] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [boardMembers, setBoardMembers] = useState([]);

    // Categories State
    const [expenseCategories, setExpenseCategories] = useState([]);
    const [incomeCategories, setIncomeCategories] = useState([]);
    const [availableSubcategories, setAvailableSubcategories] = useState([]);

    // Filter State
    const [filters, setFilters] = useState({
        type: 'all',
        userId: '',
        startDate: '',
        endDate: '',
        category: '',
        subcategory: ''
    });

    const componentRef = useRef();

    const handlePrint = useReactToPrint({
        content: () => document.getElementById('printable-dashboard-content'),
        documentTitle: `Financial_Report_${new Date().toISOString().split('T')[0]}`,
        pageStyle: `
          @page {
            size: auto;
            margin: 20mm;
          }
          @media print {
            body { 
              -webkit-print-color-adjust: exact; 
            }
            .print-header {
              display: block !important;
            }
          }
        `
    });

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        fetchDashboardData();
    }, [filters]); // Re-fetch when filters change

    const fetchInitialData = async () => {
        try {
            const [expCatRes, incCatRes] = await Promise.all([
                api.get('/finance/expense-categories'),
                api.get('/finance/categories')
            ]);
            setExpenseCategories(expCatRes.data);
            setIncomeCategories(incCatRes.data);
        } catch (err) {
            console.error('Failed to load categories', err);
        }
    };

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            // Build Query String
            const params = new URLSearchParams();
            if (filters.type !== 'all') params.append('type', filters.type);
            if (filters.userId) params.append('userId', filters.userId);
            if (filters.startDate) params.append('startDate', filters.startDate);
            if (filters.endDate) params.append('endDate', filters.endDate);
            if (filters.category) params.append('category', filters.category);
            if (filters.subcategory) params.append('subcategory', filters.subcategory);

            const [summaryRes, transactionsRes] = await Promise.all([
                api.get('/finance/summary'),
                api.get(`/finance/transactions?${params.toString()}`)
            ]);

            setSummary(summaryRes.data);
            setTransactions(transactionsRes.data);

            // Extract unique users for filter dropdown from loaded data (lazy way for now)
            if (boardMembers.length === 0 && transactionsRes.data.length > 0) {
                const uniqueUsers = [...new Map(transactionsRes.data.map(item => [item.addedBy?._id, item.addedBy])).values()].filter(u => u);
                setBoardMembers(uniqueUsers);
            }

        } catch (err) {
            setError('Failed to load financial data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => {
            const newFilters = { ...prev, [key]: value };

            // Reset dependent filters
            if (key === 'type') {
                newFilters.category = '';
                newFilters.subcategory = '';
                setAvailableSubcategories([]);
            }
            if (key === 'category') {
                newFilters.subcategory = '';
                // Update subcategories if type is expense
                if (prev.type === 'expense') {
                    const catObj = expenseCategories.find(c => c.name === value);
                    setAvailableSubcategories(catObj ? catObj.subcategories : []);
                } else {
                    setAvailableSubcategories([]);
                }
            }

            return newFilters;
        });
    };

    const clearFilters = () => {
        setFilters({
            type: 'all',
            userId: '',
            startDate: '',
            endDate: '',
            category: '',
            subcategory: ''
        });
        setAvailableSubcategories([]);
    };

    if (loading && !summary) return <div className="p-8 text-center text-slate-500">Loading financial data...</div>;
    if (error) return <div className="p-8 text-center text-red-500 flex items-center justify-center gap-2"><AlertCircle /> {error}</div>;

    const cards = [
        {
            title: 'Total Income',
            value: `₹${summary?.totalIncome?.toLocaleString() || 0}`,
            subtext: `Fees: ₹${summary?.totalFeeIncome?.toLocaleString()} | Other: ₹${summary?.totalOtherIncome?.toLocaleString()}`,
            icon: TrendingUp,
            color: 'bg-emerald-500',
            textColor: 'text-emerald-500'
        },
        {
            title: 'Total Expenses',
            value: `₹${summary?.totalExpenses?.toLocaleString() || 0}`,
            subtext: 'Operational & Capital',
            icon: TrendingDown,
            color: 'bg-rose-500',
            textColor: 'text-rose-500'
        },
        {
            title: 'Net Balance',
            value: `₹${summary?.netBalance?.toLocaleString() || 0}`,
            subtext: 'Available Funds',
            icon: DollarSign,
            color: 'bg-indigo-500',
            textColor: 'text-indigo-500'
        }
    ];

    return (
        <div id="printable-dashboard-content" className="space-y-8">
            {/* Print Header - Visible only in Print */}
            <div className="hidden print-header mb-8 text-center bg-white print:block">
                <h1 className="text-3xl font-bold text-slate-900 mb-2">STEM Global Public School</h1>
                <h2 className="text-xl text-slate-600 font-medium">Financial Transaction Report</h2>

                <div className="mt-6 flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm text-slate-600">
                    <p><span className="font-semibold">Generated:</span> {new Date().toLocaleDateString()}</p>

                    {filters.startDate && (
                        <p><span className="font-semibold">From:</span> {new Date(filters.startDate).toLocaleDateString()}</p>
                    )}
                    {filters.endDate && (
                        <p><span className="font-semibold">To:</span> {new Date(filters.endDate).toLocaleDateString()}</p>
                    )}

                    <p><span className="font-semibold">Type:</span> <span className="capitalize">{filters.type || 'All'}</span></p>

                    {filters.userId && (
                        <p><span className="font-semibold">User:</span> {boardMembers.find(u => u._id === filters.userId)?.name || 'Unknown'}</p>
                    )}

                    {filters.category && (
                        <p><span className="font-semibold">Category:</span> {filters.category}</p>
                    )}

                    {filters.subcategory && (
                        <p><span className="font-semibold">Subcategory:</span> {filters.subcategory}</p>
                    )}
                </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Financial Overview</h1>
                    <p className="text-slate-500">Welcome, {user?.name}. Manage and track school finances.</p>
                </div>
                <button
                    onClick={handlePrint}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                >
                    <Printer size={18} />
                    <span>Print Report</span>
                </button>
            </div>

            {/* Summary Cards - Visible in Print now */}
            <div className="grid md:grid-cols-3 gap-6">
                {cards.map((card, index) => (
                    <div key={index} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-all">
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`p-3 rounded-xl ${card.color} bg-opacity-10 ${card.textColor}`}>
                                    <card.icon size={24} />
                                </div>
                                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${card.color} bg-opacity-10 ${card.textColor}`}>
                                    LIVE
                                </span>
                            </div>
                            <h3 className="text-slate-500 font-medium mb-1">{card.title}</h3>
                            <p className="text-3xl font-bold text-slate-900 mb-2">{card.value}</p>
                            <p className="text-xs text-slate-400">{card.subtext}</p>
                        </div>
                        <div className={`absolute -right-6 -bottom-6 w-32 h-32 rounded-full ${card.color} opacity-5 group-hover:scale-110 transition-transform`} />
                    </div>
                ))}
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center flex-wrap print:hidden">
                <div className="flex items-center gap-2">
                    <Filter size={18} className="text-slate-400" />
                    <span className="text-sm font-medium text-slate-700">Filters:</span>
                </div>

                {/* Type Toggle */}
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    {['all', 'income', 'expense'].map((type) => (
                        <button
                            key={type}
                            onClick={() => handleFilterChange('type', type)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-all ${filters.type === type
                                ? 'bg-white text-indigo-600 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            {type}
                        </button>
                    ))}
                </div>

                {/* User Dropdown */}
                <select
                    value={filters.userId}
                    onChange={(e) => handleFilterChange('userId', e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-40"
                >
                    <option value="">All Board Members</option>
                    {boardMembers.map(member => (
                        <option key={member._id} value={member._id}>{member.name}</option>
                    ))}
                </select>

                {/* Category Dropdown - Dynamic */}
                {filters.type !== 'all' && (
                    <select
                        value={filters.category}
                        onChange={(e) => handleFilterChange('category', e.target.value)}
                        className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-40"
                    >
                        <option value="">All Categories</option>
                        {filters.type === 'expense' && expenseCategories.map(cat => (
                            <option key={cat._id} value={cat.name}>{cat.name}</option>
                        ))}
                        {filters.type === 'income' && incomeCategories.map(cat => (
                            <option key={cat._id} value={cat.name}>{cat.name}</option>
                        ))}
                    </select>
                )}

                {/* Subcategory Dropdown - Only for Expenses */}
                {filters.type === 'expense' && availableSubcategories.length > 0 && (
                    <select
                        value={filters.subcategory}
                        onChange={(e) => handleFilterChange('subcategory', e.target.value)}
                        disabled={!filters.category}
                        className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-40 disabled:opacity-50"
                    >
                        <option value="">All Subcategories</option>
                        {availableSubcategories.map(sub => (
                            <option key={sub} value={sub}>{sub}</option>
                        ))}
                    </select>
                )}

                {/* Date Range */}
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="date"
                            value={filters.startDate}
                            onChange={(e) => handleFilterChange('startDate', e.target.value)}
                            className="pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                    </div>
                    <span className="text-slate-400">-</span>
                    <div className="relative">
                        <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="date"
                            value={filters.endDate}
                            onChange={(e) => handleFilterChange('endDate', e.target.value)}
                            className="pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                    </div>
                </div>

                {/* Clear Filters */}
                <button
                    onClick={clearFilters}
                    className="ml-auto text-xs font-medium text-slate-500 hover:text-red-500 flex items-center gap-1"
                >
                    <X size={14} /> Clear
                </button>
            </div>

            {/* Printable Content Section - Table Only Wrapper */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden print:shadow-none print:border-none print:p-0 print:overflow-visible">

                <div className="p-6 border-b border-slate-100 flex items-center justify-between print:hidden">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <CreditCard size={20} className="text-indigo-500" />
                        Recent Transactions
                    </h3>
                    <span className="text-xs text-slate-400">
                        Showing {transactions.length} records
                    </span>
                </div>

                {transactions.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">
                        <p>No transactions found for the selected filters.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                                <tr>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Ref/Receipt</th>
                                    <th className="px-6 py-4">Type</th>
                                    <th className="px-6 py-4">Category</th>
                                    <th className="px-6 py-4">Description</th>
                                    <th className="px-6 py-4">User</th>
                                    <th className="px-6 py-4 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {transactions.map((t) => (
                                    <tr key={t._id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 text-slate-600 text-sm whitespace-nowrap">
                                            {new Date(t.date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600 text-sm whitespace-nowrap">
                                            {t.type === 'expense' ? (
                                                t.referenceType === 'Receipt' ? (
                                                    <span className="font-mono bg-slate-100 px-2 py-1 rounded text-xs">{t.referenceNo}</span>
                                                ) : (
                                                    <span className="text-slate-400 text-xs">Voucher</span>
                                                )
                                            ) : (
                                                t.receiptNo ? (
                                                    <span className="font-mono bg-slate-100 px-2 py-1 rounded text-xs">{t.receiptNo}</span>
                                                ) : (
                                                    <span className="text-slate-400 text-xs">-</span>
                                                )
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${t.type === 'income'
                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                                : 'bg-rose-50 text-rose-700 border border-rose-100'
                                                }`}>
                                                {t.type === 'income' ? 'Income' : 'Expense'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-700">
                                            <div className="flex flex-col">
                                                <span className="font-medium">{t.category}</span>
                                                {t.subcategory && <span className="text-xs text-slate-500">{t.subcategory}</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate">
                                            {t.description || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500">
                                            {t.addedBy?.name || 'Unknown'}
                                        </td>
                                        <td className={`px-6 py-4 text-right font-bold ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                                            }`}>
                                            {t.type === 'income' ? '+' : '-'} ₹{t.amount?.toLocaleString()}
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
