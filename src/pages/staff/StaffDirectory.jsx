import { useState, useEffect } from 'react';
import {
    Search,
    Plus,
    Phone,
    Mail,
    Edit2,
    Trash2,
    X,
    Settings,
    Save,
    Check,
    ChevronDown
} from 'lucide-react';
import api from '../../services/api'; // Use real API
import { useToast } from '../../components/ui/Toast';

export default function StaffDirectory() {
    const [staff, setStaff] = useState([]);
    const [categories, setCategories] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('');

    // UI States
    const [showStaffModal, setShowStaffModal] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const { addToast } = useToast();

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        role: '', // Will be synched with category/subcategory or just free text? Sticking to plan: Role ~ Category/Subcategory
        category: '',
        subcategory: '',
        contact: '',
        email: '',
        subjects: [], // Array of IDs
        qualification: '',
        fixedSalary: '',
        paymentMode: 'Cash',
        status: 'Active'
    });

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setIsLoading(true);
        try {
            const [staffRes, catRes, subRes] = await Promise.all([
                api.get('/staff'),
                api.get('/staff-categories'),
                api.get('/academics/subjects')
            ]);
            setStaff(staffRes.data);
            setCategories(catRes.data);
            setSubjects(subRes.data);

            if (catRes.data.length > 0 && !activeTab) {
                setActiveTab(catRes.data[0].name);
            }
        } catch (error) {
            console.error(error);
            addToast("Failed to load staff data", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const fetchStaff = async () => {
        try {
            const res = await api.get('/staff');
            setStaff(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchCategories = async () => {
        try {
            const res = await api.get('/staff-categories');
            setCategories(res.data);
            // If active tab is no longer valid, switch to first one or empty
            if (activeTab && !res.data.find(c => c.name === activeTab)) {
                setActiveTab(res.data.length > 0 ? res.data[0].name : '');
            } else if (!activeTab && res.data.length > 0) {
                setActiveTab(res.data[0].name);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value.toLowerCase());
    };

    const resetForm = () => {
        setFormData({
            name: '',
            role: '',
            category: activeTab || (categories[0]?.name || ''),
            subcategory: '',
            contact: '',
            email: '',
            subjects: [],
            qualification: '',
            fixedSalary: '',
            paymentMode: 'Cash',
            status: 'Active'
        });
        setIsEditing(false);
        setEditingId(null);
        setShowStaffModal(false);
    };

    const handleEdit = (member) => {
        setFormData({
            name: member.name,
            role: member.role || '',
            category: member.category || '',
            subcategory: member.subcategory || '',
            contact: member.phone || '',
            email: member.email || '',
            subjects: member.subjects ? member.subjects.map(s => s._id) : [],
            qualification: member.qualification || '',
            fixedSalary: member.salary || '',
            paymentMode: member.paymentMode || 'Cash',
            status: member.status || 'Active'
        });
        setIsEditing(true);
        setEditingId(member._id);
        setShowStaffModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this staff member?')) {
            try {
                await api.delete(`/staff/${id}`);
                addToast("Staff deleted successfully", "success");
                fetchStaff();
            } catch (error) {
                addToast("Failed to delete staff", "error");
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                role: formData.category, // Simple mapping for now
                salary: formData.fixedSalary
            };

            if (isEditing) {
                await api.put(`/staff/${editingId}`, payload);
                addToast("Staff updated successfully", "success");
            } else {
                await api.post('/staff', payload);
                addToast("Staff added successfully", "success");
            }

            fetchStaff();
            resetForm();
        } catch (error) {
            console.error(error);
            addToast(error.response?.data?.message || "Operation failed", "error");
        }
    };

    // Filter Logic
    const filteredStaff = staff.filter(s => {
        const matchesTab = s.category === activeTab;
        const search = searchTerm.toLowerCase();
        const matchesSearch = s.name.toLowerCase().includes(search) ||
            (s.role && s.role.toLowerCase().includes(search)) ||
            (s.email && s.email.toLowerCase().includes(search));
        return matchesTab && matchesSearch;
    });

    const activeCategoryData = categories.find(c => c.name === formData.category);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex flex-wrap gap-2 bg-slate-100 p-1 rounded-lg">
                    {categories.length === 0 && !isLoading && <div className="px-4 py-2 text-slate-500 text-sm">No categories configured</div>}
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

                <div className="flex gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-initial">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search staff..."
                            value={searchTerm}
                            onChange={handleSearch}
                            className="w-full sm:w-64 pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <button
                        onClick={() => setShowCategoryModal(true)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap"
                        title="Configure Categories"
                    >
                        <Settings size={20} />
                    </button>
                    <button
                        onClick={() => { resetForm(); setShowStaffModal(true); }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap"
                    >
                        <Plus size={20} />
                        <span>Add Staff</span>
                    </button>
                </div>
            </div>

            {/* Staff Table */}
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
                                    <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Contact</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Subjects</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Salary</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Status</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700 text-sm text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {filteredStaff.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
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
                                                        <div className="text-xs text-slate-500">Since {new Date(member.joiningDate).toLocaleDateString()}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-slate-900 font-medium">{member.category}</div>
                                                {member.subcategory && <div className="text-xs text-slate-500">{member.subcategory}</div>}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1 text-sm text-slate-600">
                                                    <div className="flex items-center gap-2">
                                                        <Phone size={14} className="text-slate-400" />
                                                        {member.phone}
                                                    </div>
                                                    {member.email && (
                                                        <div className="flex items-center gap-2">
                                                            <Mail size={14} className="text-slate-400" />
                                                            <span className="truncate max-w-[150px]" title={member.email}>{member.email}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-slate-600 max-w-[200px] flex flex-wrap gap-1">
                                                    {member.subjects && member.subjects.length > 0 ? (
                                                        member.subjects.map((sub, i) => (
                                                            <span key={i} className="inline-block px-2 py-0.5 bg-slate-100 rounded-full text-xs border border-slate-200">
                                                                {sub.name || sub}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="text-slate-400 italic">N/A</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-slate-900">₹{member.salary?.toLocaleString()}</div>
                                                <div className="text-xs text-slate-500">{member.paymentMode}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${member.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {member.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button onClick={() => handleEdit(member)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Edit2 size={18} /></button>
                                                    <button onClick={() => handleDelete(member._id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={18} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Add/Edit Staff Modal */}
            {showStaffModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200] p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-slate-50">
                            <h2 className="text-xl font-bold text-slate-900">{isEditing ? 'Edit Staff' : 'Add New Staff'}</h2>
                            <button onClick={() => setShowStaffModal(false)} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                                <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                                    <select
                                        value={formData.category}
                                        onChange={e => {
                                            const newCat = categories.find(c => c.name === e.target.value);
                                            setFormData({
                                                ...formData,
                                                category: e.target.value,
                                                subcategory: '', // Reset subcategory
                                                subjects: [] // Reset subjects if switching away from teaching? Maybe keep.
                                            });
                                        }}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="">Select Category</option>
                                        {categories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Subcategory</label>
                                    <select
                                        value={formData.subcategory}
                                        onChange={e => setFormData({ ...formData, subcategory: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        disabled={!activeCategoryData || !activeCategoryData.subcategories?.length}
                                    >
                                        <option value="">Select Subcategory</option>
                                        {activeCategoryData?.subcategories?.map((sub, i) => (
                                            <option key={i} value={sub}>{sub}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Subjects Multi-Select (Only if isTeaching) */}
                            {activeCategoryData?.isTeaching && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Subjects Handled</label>
                                    <div className="border border-slate-300 rounded-lg p-3 max-h-40 overflow-y-auto grid grid-cols-2 gap-2">
                                        {subjects.map(sub => (
                                            <label key={sub._id} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-1 rounded">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.subjects.includes(sub._id)}
                                                    onChange={e => {
                                                        const newSubjects = e.target.checked
                                                            ? [...formData.subjects, sub._id]
                                                            : formData.subjects.filter(id => id !== sub._id);
                                                        setFormData({ ...formData, subjects: newSubjects });
                                                    }}
                                                    className="rounded text-indigo-600 focus:ring-indigo-500"
                                                />
                                                <span className="text-sm text-slate-700">{sub.name} ({sub.code})</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Monthly Salary (₹)</label>
                                    <input type="number" required min="0" value={formData.fixedSalary} onChange={e => setFormData({ ...formData, fixedSalary: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Payment Mode</label>
                                    <select value={formData.paymentMode} onChange={e => setFormData({ ...formData, paymentMode: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                        <option value="Cash">Cash</option>
                                        <option value="Bank Transfer">Bank Transfer</option>
                                        <option value="UPI">UPI</option>
                                        <option value="Cheque">Cheque</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                                    <input type="tel" required value={formData.contact} onChange={e => setFormData({ ...formData, contact: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Qualification</label>
                                    <input value={formData.qualification} onChange={e => setFormData({ ...formData, qualification: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                                <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-3 pt-4">
                                <button type="button" onClick={() => setShowStaffModal(false)} className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50">Cancel</button>
                                <button type="submit" className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">{isEditing ? 'Update Staff' : 'Save Staff'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Manage Category Modal */}
            <ManageCategoryModal
                isOpen={showCategoryModal}
                onClose={() => { setShowCategoryModal(false); fetchCategories(); }}
            />
        </div>
    );
}

function ManageCategoryModal({ isOpen, onClose }) {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const { addToast } = useToast();

    // New Category Form
    const [newCatName, setNewCatName] = useState('');
    const [isTeaching, setIsTeaching] = useState(false);
    const [subcats, setSubcats] = useState(''); // Comma separated

    useEffect(() => {
        if (isOpen) fetchCats();
    }, [isOpen]);

    const fetchCats = async () => {
        setLoading(true);
        try {
            const res = await api.get('/staff-categories');
            setCategories(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        try {
            await api.post('/staff-categories', {
                name: newCatName,
                isTeaching,
                subcategories: subcats.split(',').map(s => s.trim()).filter(Boolean)
            });
            addToast("Category added", "success");
            setNewCatName('');
            setSubcats('');
            setIsTeaching(false);
            fetchCats();
        } catch (error) {
            addToast("Failed to add category", "error");
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Delete category?")) return;
        try {
            await api.delete(`/staff-categories/${id}`);
            addToast("Category deleted", "success");
            fetchCats();
        } catch (error) {
            addToast("Failed to delete", "error");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[210] p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-6 border-b border-slate-200">
                    <h2 className="text-xl font-bold text-slate-900">Manage Staff Categories</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 space-y-8">
                    {/* Add Form */}
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <h3 className="font-semibold text-slate-800 mb-3">Add New Category</h3>
                        <form onSubmit={handleAdd} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Category Name</label>
                                    <input
                                        value={newCatName}
                                        onChange={e => setNewCatName(e.target.value)}
                                        placeholder="e.g. Lab Assistant"
                                        required
                                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-indigo-500 text-sm"
                                    />
                                </div>
                                <div className="flex items-center pt-6">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={isTeaching}
                                            onChange={e => setIsTeaching(e.target.checked)}
                                            className="rounded text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span className="text-sm font-medium text-slate-700">Is Teaching Staff?</span>
                                    </label>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Subcategories (comma separated)</label>
                                <input
                                    value={subcats}
                                    onChange={e => setSubcats(e.target.value)}
                                    placeholder="e.g. Junior, Senior, Head"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-indigo-500 text-sm"
                                />
                                <p className="text-xs text-slate-400 mt-1">These will appear in the subcategory dropdown</p>
                            </div>
                            <div className="flex justify-end">
                                <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700">Add Category</button>
                            </div>
                        </form>
                    </div>

                    {/* List */}
                    <div>
                        <h3 className="font-semibold text-slate-800 mb-3">Existing Categories</h3>
                        {loading ? <p>Loading...</p> : (
                            <div className="space-y-3">
                                {categories.map(cat => (
                                    <div key={cat._id} className="flex items-start justify-between p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-medium text-slate-900">{cat.name}</h4>
                                                {cat.isTeaching && <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full">Teaching</span>}
                                            </div>
                                            <p className="text-sm text-slate-500 mt-1">
                                                Subcategories: {cat.subcategories.join(', ') || 'None'}
                                            </p>
                                        </div>
                                        <button onClick={() => handleDelete(cat._id)} className="text-red-500 hover:text-red-700 p-1"><Trash2 size={16} /></button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
