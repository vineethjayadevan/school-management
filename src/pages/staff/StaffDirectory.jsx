import { useState, useEffect } from 'react';
import {
    Search,
    Plus,
    Phone,
    Mail,
    MapPin,
    Briefcase,
    User,
    MoreVertical
} from 'lucide-react';
import { storageService } from '../../services/storage';

export default function StaffDirectory() {
    const [staff, setStaff] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);

    // New Staff Form State
    const [newStaff, setNewStaff] = useState({
        name: '',
        role: 'Teacher',
        contact: '',
        email: '',
        subject: '',
        qualification: ''
    });

    useEffect(() => {
        const fetchStaff = async () => {
            try {
                const data = await storageService.staff.getAll();
                setStaff(data);
            } catch (error) {
                console.error("Failed to fetch staff", error);
            }
        };
        fetchStaff();
    }, []);

    const handleSearch = async (e) => {
        const term = e.target.value.toLowerCase();
        setSearchTerm(term);
        // Filter locally for now, as API simple search might be enough but local is faster for just filtering the list
        // If we want API search:
        /*
        const data = await storageService.staff.getAll(); // Ideally pass search param
        // ...
        */
        // Let's keep local filter for responsiveness for now since we fetched all users
        const allStaff = await storageService.staff.getAll(); // This effectively refetches, which is safer but slower. 
        // Better pattern: store 'allStaff' separately or use Memo.
        // For now, let's just filter the *current* state if we assume we have all.
        // BUT, strict correctness:
        const filtered = allStaff.filter(s =>
            s.name.toLowerCase().includes(term) ||
            s.role.toLowerCase().includes(term) ||
            (s.subject && s.subject.toLowerCase().includes(term))
        );
        setStaff(filtered);
    };

    const handleAddStaff = async (e) => {
        e.preventDefault();
        try {
            const staffMember = {
                ...newStaff,
                status: 'Active',
                joinDate: new Date().toISOString().split('T')[0]
            };
            await storageService.staff.add(staffMember);

            // Refresh list
            const updatedList = await storageService.staff.getAll();
            setStaff(updatedList);

            setShowAddModal(false);
            setNewStaff({ name: '', role: 'Teacher', contact: '', email: '', subject: '', qualification: '' });
        } catch (error) {
            console.error(error);
            alert("Failed to add staff");
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
                    onClick={() => setShowAddModal(true)}
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
                        placeholder="Search staff by name, role or subject..."
                        value={searchTerm}
                        onChange={handleSearch}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
            </div>

            {/* Staff Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {staff.map((member) => (
                    <div key={member.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
                        <div className="p-6">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-lg">
                                        {member.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-900">{member.name}</h3>
                                        <p className="text-sm text-indigo-600 font-medium">{member.role}</p>
                                    </div>
                                </div>
                                <button className="text-slate-400 hover:text-slate-600">
                                    <MoreVertical size={20} />
                                </button>
                            </div>

                            <div className="mt-6 space-y-3">
                                <div className="flex items-center gap-3 text-sm text-slate-600">
                                    <Briefcase size={16} className="text-slate-400" />
                                    <span>{member.subject !== 'N/A' ? member.subject : 'Administration'}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-slate-600">
                                    <User size={16} className="text-slate-400" />
                                    <span>{member.qualification}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-slate-600">
                                    <Phone size={16} className="text-slate-400" />
                                    <span>{member.contact}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-slate-600">
                                    <Mail size={16} className="text-slate-400" />
                                    <span className="truncate">{member.email}</span>
                                </div>
                            </div>
                        </div>
                        <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex items-center justify-between text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${member.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                {member.status}
                            </span>
                            <span className="text-slate-400">Joined {new Date(member.joinDate).toLocaleDateString()}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Add Staff Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
                        <div className="flex items-center justify-between p-6 border-b border-slate-200">
                            <h2 className="text-xl font-bold text-slate-900">Add New Staff</h2>
                            <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                                <MoreVertical className="rotate-90" size={24} /> {/* Using rotate as X icon substitute or simple text X */}
                            </button>
                        </div>

                        <form onSubmit={handleAddStaff} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                                <input
                                    required
                                    value={newStaff.name}
                                    onChange={e => setNewStaff({ ...newStaff, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                                    <select
                                        value={newStaff.role}
                                        onChange={e => setNewStaff({ ...newStaff, role: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option>Teacher</option>
                                        <option>Admin</option>
                                        <option>Support Staff</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
                                    <input
                                        value={newStaff.subject}
                                        onChange={e => setNewStaff({ ...newStaff, subject: e.target.value })}
                                        placeholder="e.g. Math (Optional)"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    required
                                    value={newStaff.email}
                                    onChange={e => setNewStaff({ ...newStaff, email: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                                    <input
                                        type="tel"
                                        required
                                        value={newStaff.contact}
                                        onChange={e => setNewStaff({ ...newStaff, contact: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Qualification</label>
                                    <input
                                        required
                                        value={newStaff.qualification}
                                        onChange={e => setNewStaff({ ...newStaff, qualification: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                                >
                                    Save Staff
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
