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
    FileSpreadsheet, // Add this
    Search
} from 'lucide-react';
import api from '../../services/api'; // Keep existing imports
import { useAuth } from '../../context/AuthContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx'; // Import xlsx

export default function BoardDashboard() {
    // ... existing state ...
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

    // We need to split income categories into 'income' and 'capital' for the UI
    // But the API returns all. We'll filter them in the UI.
    const [allIncomeCategories, setAllIncomeCategories] = useState([]);

    // Filter State
    const [filters, setFilters] = useState({
        type: 'all',
        userId: '',
        startDate: '',
        endDate: '',
        category: '',
        subcategory: ''
    });

    const [activeTab, setActiveTab] = useState('cash');

    const downloadExcel = () => {
        // 1. Prepare Data
        const reportIncome = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + (t.amount || 0), 0);

        const reportExpense = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + (t.amount || 0), 0);

        const reportCapital = transactions
            .filter(t => t.type === 'capital')
            .reduce((sum, t) => sum + (t.amount || 0), 0);

        // Filter Summary String
        const filterParts = [];
        if (filters.startDate || filters.endDate) filterParts.push(`Date: ${filters.startDate || 'Start'} to ${filters.endDate || 'Now'}`);
        if (filters.type !== 'all') filterParts.push(`Type: ${filters.type}`);
        if (filters.category) filterParts.push(`Category: ${filters.category}`);
        if (filters.subcategory) filterParts.push(`Sub: ${filters.subcategory}`);
        if (filters.userId && boardMembers.length > 0) {
            const u = boardMembers.find(m => m._id === filters.userId);
            if (u) filterParts.push(`User: ${u.name}`);
        }
        const filterString = filterParts.length > 0 ? filterParts.join(', ') : 'All Records';

        // 2. Build Worksheet Rows
        const wsData = [
            ['STEM Global Public School'],
            ['Financial Transaction Report'],
            [`Generated on: ${new Date().toLocaleDateString('en-GB')}`],
            [],
            ['Applied Filters:', filterString],
            [],
            ['Financial Summary'],
            ['Total Income', reportIncome],
            ['Total Expenses', reportExpense],
            ['Total Capital (Inflow)', reportCapital],
            [],
            ['Detailed Transactions'],
            ['Date', 'Ref/Receipt', 'Type', 'Category', 'Description', 'User', 'Amount'] // Headers
        ];

        // Add Transaction Rows
        transactions.forEach(t => {
            wsData.push([
                new Date(t.date).toLocaleDateString('en-GB'),
                t.type === 'expense'
                    ? (t.referenceType === 'Receipt' ? `Rcpt: ${t.referenceNo}` : 'Voucher')
                    : (t.receiptNo || '-'),
                t.type === 'income' ? 'Income' : t.type === 'capital' ? 'Capital' : 'Expense',
                t.category + (t.subcategory ? ` (${t.subcategory})` : ''),
                t.description || '-',
                t.addedBy?.name || 'Unknown',
                t.amount
            ]);
        });

        // 3. Create Workbook and Sheet
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(wsData);

        // 4. Formatting (Column Widths)
        const wscols = [
            { wch: 12 }, // Date
            { wch: 15 }, // Ref
            { wch: 10 }, // Type
            { wch: 30 }, // Category
            { wch: 40 }, // Description
            { wch: 15 }, // User
            { wch: 12 }  // Amount
        ];
        ws['!cols'] = wscols;

        XLSX.utils.book_append_sheet(wb, ws, "Financial Report");

        // 5. Save File
        XLSX.writeFile(wb, `Financial_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const downloadPDF = () => {
        const doc = new jsPDF();

        // --- Header ---
        doc.setFontSize(20);
        doc.setTextColor(40, 40, 100); // Dark Blue
        doc.text('STEM Global Public School', 14, 22);

        doc.setFontSize(14);
        doc.setTextColor(100, 100, 100); // Grey
        doc.text('Financial Transaction Report', 14, 30);

        doc.setFontSize(10);
        doc.text(`Generated on: ${new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}`, 14, 38);

        let yPos = 48;

        // --- Active Filters ---
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.text('Applied Filters:', 14, yPos);
        yPos += 7;

        doc.setFontSize(10);
        doc.setTextColor(80, 80, 80);

        const filterList = [];
        if (filters.startDate || filters.endDate) filterList.push(`Date: ${filters.startDate || 'Start'} to ${filters.endDate || 'Now'}`);
        if (filters.type !== 'all') filterList.push(`Type: ${filters.type.charAt(0).toUpperCase() + filters.type.slice(1)}`);
        if (filters.category) filterList.push(`Category: ${filters.category}`);
        if (filters.subcategory) filterList.push(`Sub: ${filters.subcategory}`);
        if (filters.userId && boardMembers.length > 0) {
            const u = boardMembers.find(m => m._id === filters.userId);
            if (u) filterList.push(`User: ${u.name}`);
        }

        if (filterList.length === 0) doc.text('- None (All Records)', 20, yPos);
        else {
            filterList.forEach(f => {
                doc.text(`• ${f}`, 20, yPos);
                yPos += 5;
            });
        }
        yPos += 5;

        // --- Summary Section (Mini Table) ---
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.text('Financial Summary:', 14, yPos);
        yPos += 4; // Spacing for autoTable

        // Calculate type-specific totals for the report
        const reportIncome = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + (t.amount || 0), 0);

        const reportExpense = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + (t.amount || 0), 0);

        const reportCapital = transactions
            .filter(t => t.type === 'capital')
            .reduce((sum, t) => sum + (t.amount || 0), 0);

        const summaryData = [
            ['Total Income', `Rs. ${reportIncome.toLocaleString()}`],
            ['Total Expenses', `Rs. ${reportExpense.toLocaleString()}`],
            ['Total Capital (Inflow)', `Rs. ${reportCapital.toLocaleString()}`]
        ];

        autoTable(doc, {
            body: summaryData,
            startY: yPos,
            theme: 'plain',
            styles: { fontSize: 10, cellPadding: 2 },
            columnStyles: {
                0: { fontStyle: 'bold', cellWidth: 50 },
                1: { halign: 'right', cellWidth: 40 }
            },
        });

        yPos = doc.lastAutoTable.finalY + 15;

        // --- Transactions Table ---
        doc.setFontSize(12);
        doc.text('Detailed Transactions:', 14, yPos - 5);

        const tableColumn = ["Date", "Ref/Receipt", "Type", "Category", "Description", "User", "Amount"];
        const tableRows = transactions.map(t => [
            new Date(t.date).toLocaleDateString('en-GB').replace(/\//g, '-'),
            t.type === 'expense'
                ? (t.referenceType === 'Receipt' ? `Rcpt: ${t.referenceNo}` : 'Voucher')
                : (t.receiptNo || '-'),
            t.type === 'income' ? 'Income' : t.type === 'capital' ? 'Capital' : 'Expense',
            t.category + (t.subcategory ? ` (${t.subcategory})` : ''),
            t.description || '-',
            t.addedBy?.name || 'Unknown',
            `Rs. ${t.amount?.toLocaleString()}`
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: yPos,
            theme: 'grid',
            headStyles: { fillColor: [63, 81, 181], textColor: 255 }, // Indigo
            styles: { fontSize: 8, cellPadding: 3 },
            columnStyles: {
                6: { halign: 'right', fontStyle: 'bold' } // Amount
            },
            didParseCell: (data) => {
                // Color amount column based on type
                if (data.section === 'body' && data.column.index === 6) {
                    const type = data.row.raw[2]; // Index 2 is Type
                    if (type === 'Income') data.cell.styles.textColor = [22, 163, 74]; // Emerald 600
                    else if (type === 'Capital') data.cell.styles.textColor = [37, 99, 235]; // Blue 600
                    else if (type === 'Expense') data.cell.styles.textColor = [220, 38, 38]; // Red 600
                }
            },
            didDrawPage: (data) => {
                const pageCount = doc.internal.getNumberOfPages();
                doc.setFontSize(8);
                doc.setTextColor(150);
                doc.text(`Page ${pageCount}`, data.settings.margin.left, doc.internal.pageSize.height - 10);
            }
        });

        doc.save(`Financial_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
    };

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
            setAllIncomeCategories(incCatRes.data);
            // Split provided for easier debugging if needed, but we filter on the fly
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
                // Update subcategories based on type
                if (prev.type === 'expense') {
                    const catObj = expenseCategories.find(c => c.name === value);
                    setAvailableSubcategories(catObj ? catObj.subcategories : []);
                } else if (prev.type === 'income' || prev.type === 'capital') {
                    const catObj = allIncomeCategories.find(c => c.name === value);
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
        setSearchQuery('');
    };

    // Search & Highlight Logic
    const [searchQuery, setSearchQuery] = useState('');

    const filteredTransactions = transactions.filter(t => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        // Search in Description, Title, Category, Subcategory
        return (
            (t.description && t.description.toLowerCase().includes(query)) ||
            (t.title && t.title.toLowerCase().includes(query)) ||
            (t.category && t.category.toLowerCase().includes(query)) ||
            (t.subcategory && t.subcategory.toLowerCase().includes(query))
        );
    });

    const HighlightText = ({ text, highlight }) => {
        if (!highlight || !text) return <span>{text || '-'}</span>;
        const parts = text.toString().split(new RegExp(`(${highlight})`, 'gi'));
        return (
            <span>
                {parts.map((part, i) =>
                    part.toLowerCase() === highlight.toLowerCase() ? (
                        <span key={i} className="bg-yellow-200 text-slate-800 rounded-sm px-0.5">{part}</span>
                    ) : (
                        part
                    )
                )}
            </span>
        );
    };

    if (loading && !summary) return <div className="p-8 text-center text-slate-500">Loading financial data...</div>;
    if (error) return <div className="p-8 text-center text-red-500 flex items-center justify-center gap-2"><AlertCircle /> {error}</div>;





    const renderCashLedger = () => (
        <div className="space-y-8">


            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center flex-wrap">
                <div className="flex items-center gap-2">
                    <Filter size={18} className="text-slate-400" />
                    <span className="text-sm font-medium text-slate-700">Filters:</span>
                </div>

                {/* Search Input */}
                <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search description..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-full md:w-64"
                    />
                </div>

                {/* Type Toggle */}
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    {['all', 'income', 'expense', 'capital'].map((type) => (
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
                        {(filters.type === 'income' || filters.type === 'capital') && allIncomeCategories
                            .filter(cat => cat.type === filters.type)
                            .map(cat => (
                                <option key={cat._id} value={cat.name}>{cat.name}</option>
                            ))
                        }
                    </select>
                )}

                {/* Subcategory Dropdown - Now for ALL types */}
                {filters.type !== 'all' && availableSubcategories.length > 0 && (
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

            {/* Table Wrapper */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <CreditCard size={20} className="text-indigo-500" />
                        Recent Transactions
                    </h3>
                    <span className="text-xs text-slate-400">
                        Showing {filteredTransactions.length} records
                    </span>
                </div>

                {filteredTransactions.length === 0 ? (
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
                                {filteredTransactions.map((t) => (
                                    <tr key={t._id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 text-slate-600 text-sm whitespace-nowrap">
                                            {new Date(t.date).toLocaleDateString('en-GB').replace(/\//g, '-')}
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
                                                : t.type === 'capital'
                                                    ? 'bg-blue-50 text-blue-700 border border-blue-100'
                                                    : 'bg-rose-50 text-rose-700 border border-rose-100'
                                                }`}>
                                                {t.type === 'income' ? 'Income' : t.type === 'capital' ? 'Capital' : 'Expense'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-700">
                                            <div className="flex flex-col">
                                                <span className="font-medium"><HighlightText text={t.category} highlight={searchQuery} /></span>
                                                {t.subcategory && <span className="text-xs text-slate-500"><HighlightText text={t.subcategory} highlight={searchQuery} /></span>}
                                            </div>
                                        </td>
                                        <td
                                            className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate cursor-help"
                                            title={t.title || t.description || ''}
                                        >
                                            <HighlightText text={t.title || t.description || '-'} highlight={searchQuery} />
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500">
                                            {t.addedBy?.name || 'Unknown'}
                                        </td>
                                        <td className={`px-6 py-4 text-right font-bold ${t.type === 'income' ? 'text-emerald-600'
                                            : t.type === 'capital' ? 'text-blue-600'
                                                : 'text-rose-600'
                                            }`}>
                                            {t.type === 'income' || t.type === 'capital' ? '+' : '-'} ₹{t.amount?.toLocaleString()}
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

    const renderComingSoon = (title) => (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center">
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="text-indigo-500" size={32} />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">{title}</h2>
            <p className="text-slate-500">This feature is currently under development.</p>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Financial Ledger</h1>
                    <p className="text-slate-500">Welcome, {user?.name}. Manage and track school finances.</p>
                </div>
                {activeTab === 'cash' && (
                    <div className="flex gap-2">
                        <button
                            onClick={downloadExcel}
                            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
                        >
                            <FileSpreadsheet size={18} />
                            <span>Download Excel</span>
                        </button>
                        <button
                            onClick={downloadPDF}
                            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                        >
                            <Download size={18} />
                            <span>Download Report</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div className="border-b border-slate-200">
                <nav className="-mb-px flex space-x-8 overflow-x-auto">
                    {['Cash Ledger', 'Revenue Ledger', 'Expense Ledger', 'Receivable/Payable Ledger'].map((tab) => {
                        const key = tab.toLowerCase().replace(/[\s/]+/g, '_').replace('_ledger', '');

                        return (
                            <button
                                key={key}
                                onClick={() => setActiveTab(key)}
                                className={`
                                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors
                                ${activeTab === key
                                        ? 'border-indigo-500 text-indigo-600'
                                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}
                            `}
                            >
                                {tab}
                            </button>
                        )
                    })}
                </nav>
            </div>

            {/* Tab Content */}
            <div className="mt-6">
                {activeTab === 'cash' && renderCashLedger()}
                {activeTab === 'revenue' && renderComingSoon('Revenue Ledger')}
                {activeTab === 'expense' && renderComingSoon('Expense Ledger')}
                {activeTab === 'receivable_payable' && renderComingSoon('Receivable/Payable Ledger')}
            </div>
        </div>
    );
}
