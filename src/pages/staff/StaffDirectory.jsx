import { useState, useEffect } from 'react';
import {
    Search,
    Plus,
    Phone,
    Mail,
    MapPin,
    Briefcase,
    User,
    MoreVertical,
    Edit2,
    Trash2,
    X,
    Check
} from 'lucide-react';
import { storageService } from '../../services/storage';

export default function StaffDirectory() {
    const [staff, setStaff] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        role: 'Teacher',
        category: 'Teacher',
        contact: '',
        email: '',
        subject: '',
        qualification: '',
        fixedSalary: '',
        paymentMode: 'Cash',
        status: 'Active'
    });

    useEffect(() => {
        fetchStaff();
    }, []);

    const fetchStaff = async () => {
        try {
            const data = await storageService.staff.getAll();
            setStaff(data);
        } catch (error) {
            console.error("Failed to fetch staff", error);
        }
    };

    const handleSearch = async (e) => {
        const term = e.target.value.toLowerCase();
        setSearchTerm(term);
        const allStaff = await storageService.staff.getAll();
        const filtered = allStaff.filter(s =>
            s.name.toLowerCase().includes(term) ||
            s.role.toLowerCase().includes(term) ||
            (s.subject && s.subject.toLowerCase().includes(term)) ||
            (s.category && s.category.toLowerCase().includes(term))
        );
        setStaff(filtered);
    };

    const resetForm = () => {
        setFormData({
            name: '',
            role: 'Teacher',
            category: 'Teacher',
            contact: '',
            email: '',
            subject: '',
            qualification: '',
            fixedSalary: '',
            paymentMode: 'Cash',
            status: 'Active'
        });
        setIsEditing(false);
        setEditingId(null);
        setShowModal(false);
    };

    const handleEdit = (member) => {
        setFormData({
            name: member.name,
            role: member.role,
            category: member.category || 'Teacher',
            contact: member.contact,
            email: member.email || '',
            subject: member.subject !== 'N/A' ? member.subject : '',
            qualification: member.qualification || '',
            fixedSalary: member.fixedSalary || '',
            paymentMode: member.paymentMode || 'Cash',
            status: member.status || 'Active'
        });
        setIsEditing(true);
        setEditingId(member.id);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this staff member?')) {
            try {
                await storageService.staff.remove(id);
                fetchStaff();
            } catch (error) {
                console.error("Failed to delete staff", error);
                alert("Failed to delete staff");
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const staffMember = {
                ...formData,
                role: formData.category, // Sync role with category
                joinDate: isEditing ? undefined : new Date().toISOString().split('T')[0] // Don't overwrite join date on edit unless specified
            };

            if (isEditing) {
                await storageService.staff.update(editingId, staffMember);
            } else {
                await storageService.staff.add(staffMember);
            }

            fetchStaff();
            resetForm();
        } catch (error) {
            console.error(error);
            alert(`Failed to ${isEditing ? 'update' : 'add'} staff`);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Staff Directory</h1>
                    <p className="text-slate-500">Manage teaching and non-teaching staff.</p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                    <Plus size={20} />
                    <span>Add New Staff</span>
                </button>
            </div>

            {/* Search Bar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <div className="relative max-w-md">
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

            {/* Staff Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Staff Member</th>
                                <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Role/Category</th>
                                <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Contact</th>
                                <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Details</th>
                                <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Salary</th>
                                <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Status</th>
                                <th className="px-6 py-4 font-semibold text-slate-700 text-sm text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {staff.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-slate-500">
                                        No staff members found.
                                    </td>
                                </tr>
                            ) : (
                                staff.map((member) => (
                                    <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-sm">
                                                    {member.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-slate-900">{member.name}</div>
                                                    <div className="text-xs text-slate-500">Joined {new Date(member.joinDate).toLocaleDateString()}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-slate-900 font-medium">{member.category}</div>
                                            <div className="text-xs text-slate-500">{member.role}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1 text-sm text-slate-600">
                                                <div className="flex items-center gap-2">
                                                    <Phone size={14} className="text-slate-400" />
                                                    {member.contact}
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
                                            <div className="text-sm text-slate-600">
                                                {member.category === 'Teacher' && (
                                                    <div className="mb-0.5"><span className="font-medium">Sub:</span> {member.subject}</div>
                                                )}
                                                <div><span className="font-medium">Qual:</span> {member.qualification}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-slate-900">₹{member.fixedSalary?.toLocaleString()}</div>
                                            <div className="text-xs text-slate-500">{member.paymentMode}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${member.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {member.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleEdit(member)}
                                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(member.id)}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200] p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-slate-200">
                            <h2 className="text-xl font-bold text-slate-900">{isEditing ? 'Edit Staff' : 'Add New Staff'}</h2>
                            <button onClick={resetForm} className="text-slate-400 hover:text-slate-600">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                                <input
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                                    <select
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="Teacher">Teacher</option>
                                        <option value="Non-Teaching">Non-Teaching</option>
                                        <option value="Vehicle In-Charge">Vehicle In-Charge</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
                                    <input
                                        value={formData.subject}
                                        onChange={e => setFormData({ ...formData, subject: e.target.value })}
                                        placeholder="Optional"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        disabled={formData.category !== 'Teacher'}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Fixed Monthly Salary (₹)</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        value={formData.fixedSalary}
                                        onChange={e => setFormData({ ...formData, fixedSalary: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Payment Mode</label>
                                    <select
                                        value={formData.paymentMode}
                                        onChange={e => setFormData({ ...formData, paymentMode: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="Cash">Cash</option>
                                        <option value="Bank Transfer">Bank Transfer</option>
                                        <option value="UPI">UPI</option>
                                        <option value="Cheque">Cheque</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                                    <input
                                        type="tel"
                                        required
                                        value={formData.contact}
                                        onChange={e => setFormData({ ...formData, contact: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Qualification</label>
                                    <input
                                        value={formData.qualification}
                                        onChange={e => setFormData({ ...formData, qualification: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                                <select
                                    value={formData.status}
                                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                                >
                                    {isEditing ? 'Update Staff' : 'Save Staff'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
