import { useState, useEffect } from 'react';
import {
    Search,
    Save,
    Check,
    ChevronDown,
    DollarSign,
    CreditCard
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../components/ui/Toast';

export default function SalaryStructure() {
    const [staff, setStaff] = useState([]);
    const [categories, setCategories] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState(null);

    const { addToast } = useToast();

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setIsLoading(true);
        try {
            const [staffRes, catRes] = await Promise.all([
                api.get('/staff'),
                api.get('/staff-categories')
            ]);
            setStaff(staffRes.data);
            setCategories(catRes.data);

            if (catRes.data.length > 0 && !activeTab) {
                setActiveTab(catRes.data[0].name);
            }
        } catch (error) {
            console.error(error);
            addToast("Failed to load data", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateSalary = async (memberId, newSalary, newPaymentMode) => {
        setUpdatingId(memberId);
        try {
            await api.put(`/staff/${memberId}`, {
                salary: newSalary,
                paymentMode: newPaymentMode
            });
            addToast("Salary structure updated", "success");
            // Update local state
            setStaff(prev => prev.map(s => s._id === memberId ? { ...s, salary: newSalary, paymentMode: newPaymentMode } : s));
        } catch (error) {
            console.error(error);
            addToast("Update failed", "error");
        } finally {
            setUpdatingId(null);
        }
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value.toLowerCase());
    };

    const filteredStaff = staff.filter(s => {
        const matchesTab = s.category === activeTab;
        const search = searchTerm.toLowerCase();
        const matchesSearch = s.name.toLowerCase().includes(search) ||
            (s.role && s.role.toLowerCase().includes(search));
        return matchesTab && matchesSearch;
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Salary Structure</h1>
                <p className="text-slate-500">Configure monthly salary and payment modes for staff.</p>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex flex-wrap gap-2 bg-slate-100 p-1 rounded-lg">
                    {categories.map((cat) => (
                        <button
                            key={cat._id}
                            onClick={() => setActiveTab(cat.name)}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === cat.name
                                ? 'bg-white text-indigo-600 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>

                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search staff..."
                        value={searchTerm}
                        onChange={handleSearch}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
            </div>

            {/* Salary Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[400px]">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full py-20 text-slate-500">Loading...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Staff Member</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Category/Role</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Monthly Salary (₹)</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Payment Mode</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700 text-sm text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {filteredStaff.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                            No staff found in this category.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredStaff.map((member) => (
                                        <tr key={member._id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-sm">
                                                        {member.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-slate-900">{member.name}</div>
                                                        <div className="text-xs text-slate-500">{member.phone}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-slate-900">{member.category}</div>
                                                {member.subcategory && <div className="text-xs text-slate-500">{member.subcategory}</div>}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="relative max-w-[150px]">
                                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                                    <input
                                                        type="number"
                                                        defaultValue={member.salary}
                                                        onBlur={(e) => member.tempSalary = e.target.value}
                                                        className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="relative max-w-[150px]">
                                                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                                    <select
                                                        defaultValue={member.paymentMode || 'Cash'}
                                                        onChange={(e) => member.tempPaymentMode = e.target.value}
                                                        className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm appearance-none"
                                                    >
                                                        <option value="Cash">Cash</option>
                                                        <option value="Bank Transfer">Bank Transfer</option>
                                                        <option value="UPI">UPI</option>
                                                        <option value="Cheque">Cheque</option>
                                                    </select>
                                                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => {
                                                        const sal = member.tempSalary !== undefined ? member.tempSalary : member.salary;
                                                        const mode = member.tempPaymentMode !== undefined ? member.tempPaymentMode : (member.paymentMode || 'Cash');
                                                        handleUpdateSalary(member._id, sal, mode);
                                                    }}
                                                    disabled={updatingId === member._id}
                                                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                                                >
                                                    {updatingId === member._id ? (
                                                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                    ) : (
                                                        <>
                                                            <Save size={14} />
                                                            <span>Save</span>
                                                        </>
                                                    )}
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
