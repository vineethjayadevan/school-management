import React, { useState, useEffect } from 'react';
import { systemService } from '../../services/systemApi';
import { useAuth } from '../../context/AuthContext';
import { Users, Plus, KeyRound, ShieldAlert, LogOut, Loader2, AlertCircle, CheckCircle2, Search, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

const SuperAdminDashboard = () => {
    const { user, logout } = useAuth();
    const [usersList, setUsersList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showResetModal, setShowResetModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    // List and filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('');

    // Form states
    const [newUserForm, setNewUserForm] = useState({ name: '', username: '', email: '', password: '', role: 'admin' });
    const [resetForm, setResetForm] = useState({ newPassword: '' });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const data = await systemService.getUsers();
            setUsersList(data);
        } catch (error) {
            toast.error('Failed to fetch users');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await systemService.createUser(newUserForm);
            toast.success('User created successfully');
            setShowCreateModal(false);
            setNewUserForm({ name: '', username: '', email: '', password: '', role: 'admin' });
            fetchUsers();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create user');
        } finally {
            setSubmitting(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await systemService.resetPassword(selectedUser._id, resetForm.newPassword);
            toast.success('Password reset successfully');
            setShowResetModal(false);
            setResetForm({ newPassword: '' });
            setSelectedUser(null);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to reset password');
        } finally {
            setSubmitting(false);
        }
    };

    const openResetModal = (userToReset) => {
        setSelectedUser(userToReset);
        setShowResetModal(true);
    };

    // Filtering logic
    const filteredUsers = usersList.filter(u => {
        const matchesSearch =
            u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (u.username && u.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesRole = roleFilter === '' || u.role === roleFilter;

        return matchesSearch && matchesRole;
    });

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            {/* Top Navigation */}
            <nav className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex justify-between items-center sticky top-0 z-20">
                <div className="flex items-center gap-3">
                    <div className="bg-indigo-500/10 p-2 rounded-lg border border-indigo-500/20">
                        <ShieldAlert className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white leading-tight">System Portal</h1>
                        <p className="text-xs text-slate-400 font-medium tracking-wide">LEVEL: SUPER_ADMIN</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 min-w-0 pr-4 border-r border-slate-800">
                        <div className="hidden sm:block text-right">
                            <p className="text-sm font-medium text-white">{user?.name}</p>
                            <p className="text-xs text-slate-400">@{user?.username || 'system'}</p>
                        </div>
                        <div className="w-9 h-9 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30 text-indigo-300 font-bold uppercase shrink-0">
                            {user?.name?.charAt(0) || 'S'}
                        </div>
                    </div>
                    <button
                        onClick={() => { logout(); window.location.href = '/login'; }}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                        <LogOut className="w-4 h-4" />
                        <span className="hidden sm:inline">Logout</span>
                    </button>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">User Management (Unified)</h2>
                        <p className="text-slate-500 text-sm mt-1">Manage all system users, roles, and administrative access.</p>
                    </div>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl shadow-sm transition-all focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        <Plus className="w-4 h-4" />
                        New User
                    </button>
                </div>

                {/* Table Section */}
                <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between bg-slate-50/50 gap-4">
                        <div className="flex items-center gap-4">
                            <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                                <Users className="w-4 h-4 text-slate-500" />
                                Registered Users
                            </h3>
                            <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded-md border border-slate-200">
                                Total: {filteredUsers.length} / {usersList.length}
                            </span>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2 flex-grow max-w-2xl justify-end">
                            {/* Search Box */}
                            <div className="relative flex-grow max-w-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Search className="h-4 w-4 text-slate-400" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search name, username or email..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-white"
                                />
                            </div>

                            {/* Role Filter */}
                            <div className="relative min-w-[160px]">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Filter className="h-4 w-4 text-slate-400" />
                                </div>
                                <select
                                    value={roleFilter}
                                    onChange={(e) => setRoleFilter(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                                >
                                    <option value="">All Roles</option>
                                    <option value="superadmin">Super Admin</option>
                                    <option value="superuser">Super User</option>
                                    <option value="admin">Administrator</option>
                                    <option value="board_member">Board Member</option>
                                    <option value="officestaff">Office Staff</option>
                                    <option value="teacher">Teacher</option>
                                    <option value="student">Student</option>
                                </select>
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                    <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">User Details</th>
                                    <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Identifiers</th>
                                    <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Role & Status</th>
                                    <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Created By</th>
                                    <th scope="col" className="relative px-6 py-3.5"><span className="sr-only">Actions</span></th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center">
                                            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-3" />
                                            <p className="text-sm text-slate-500">Loading user database...</p>
                                        </td>
                                    </tr>
                                ) : usersList.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center">
                                            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                                <Users className="w-6 h-6 text-slate-400" />
                                            </div>
                                            <h4 className="text-sm font-medium text-slate-900">No Users Found</h4>
                                            <p className="text-sm text-slate-500 mt-1">There are no users registered in the system yet.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map((u) => (
                                        <tr key={u._id} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="h-10 w-10 shrink-0">
                                                        <img className="h-10 w-10 rounded-full border border-slate-200 bg-slate-100" src={u.avatar || `https://ui-avatars.com/api/?name=${u.name}&background=random`} alt="" />
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-semibold text-slate-900">{u.name}</div>
                                                        <div className="text-xs text-slate-500 mt-0.5 font-mono">ID: {u._id.substring(0, 8)}...</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-slate-800">
                                                    <span className="font-medium text-slate-500 text-xs uppercase mr-1">USR:</span>
                                                    {u.username ? <span className="font-mono">{u.username}</span> : <span className="text-slate-400 italic">None</span>}
                                                </div>
                                                <div className="text-sm text-slate-600 mt-1">
                                                    <span className="font-medium text-slate-500 text-xs uppercase mr-1">EML:</span>
                                                    {u.email || <span className="text-slate-400 italic">None</span>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${u.role === 'superadmin' ? 'bg-purple-100 text-purple-700' :
                                                    u.role === 'admin' ? 'bg-blue-100 text-blue-700' :
                                                        u.role === 'office_staff' || u.role === 'officestaff' ? 'bg-amber-100 text-amber-700' :
                                                            u.role === 'teacher' ? 'bg-emerald-100 text-emerald-700' :
                                                                u.role === 'board_member' ? 'bg-pink-100 text-pink-700' :
                                                                    'bg-slate-100 text-slate-700'
                                                    }`}>
                                                    {u.role.replace('_', ' ').toUpperCase()}
                                                </span>
                                                <div className="mt-2 flex items-center gap-1.5">
                                                    {u.isActive ? (
                                                        <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center gap-1 text-xs font-medium text-red-600">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> Inactive
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                                {u.createdBy ? (
                                                    <div>
                                                        <p className="font-medium text-slate-800">{u.createdBy.name}</p>
                                                        <p className="text-xs font-mono text-slate-500 mt-0.5">{u.createdBy.username}</p>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400 italic">System Auto / N/A</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={() => openResetModal(u)}
                                                    className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2 inline-flex"
                                                >
                                                    <KeyRound className="w-3.5 h-3.5" />
                                                    Reset Pass
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {/* Create User Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowCreateModal(false)}></div>
                    <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="border-b border-slate-100 px-6 py-4">
                            <h3 className="text-lg font-bold text-slate-900">Create Unified User</h3>
                            <p className="text-sm text-slate-500">Add a new user directly to the database.</p>
                        </div>
                        <form onSubmit={handleCreateUser} className="p-6 space-y-4">

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    value={newUserForm.name}
                                    onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow sm:text-sm"
                                    placeholder="e.g. John Doe"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Username <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        required
                                        value={newUserForm.username}
                                        onChange={(e) => setNewUserForm({ ...newUserForm, username: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm transition-shadow"
                                        placeholder="johndoe"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Email <span className="text-slate-400 text-xs font-normal">(Optional)</span></label>
                                    <input
                                        type="email"
                                        value={newUserForm.email}
                                        onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow sm:text-sm"
                                        placeholder="jane@example.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Initial Password <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    required
                                    value={newUserForm.password}
                                    onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm transition-shadow"
                                    placeholder="auto-hashed on save"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">System Role</label>
                                <select
                                    value={newUserForm.role}
                                    onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow sm:text-sm bg-white"
                                >
                                    <option value="superadmin">Super Admin (Highest Privilege)</option>
                                    <option value="superuser">Super User (Legacy Root)</option>
                                    <option value="admin">Administrator / Principal</option>
                                    <option value="board_member">Board Member</option>
                                    <option value="office_staff">Office Staff (Legacy)</option>
                                    <option value="officestaff">Office Staff (New)</option>
                                    <option value="teacher">Teacher</option>
                                    <option value="student">Student</option>
                                </select>
                            </div>

                            <div className="pt-4 mt-2 flex justify-end gap-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all flex items-center justify-center min-w-[100px]"
                                >
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create User'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Reset Password Modal */}
            {showResetModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowResetModal(false)}></div>
                    <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-5 text-center">
                            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <KeyRound className="w-6 h-6 text-amber-600" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-1">Reset Password</h3>
                            <p className="text-sm text-slate-500 px-2">
                                Enter a new password for <span className="font-semibold text-slate-700">{selectedUser?.name}</span> (@{selectedUser?.username})
                            </p>
                        </div>
                        <form onSubmit={handleResetPassword} className="px-6 pb-6">
                            <div className="mb-5">
                                <input
                                    type="text"
                                    required
                                    value={resetForm.newPassword}
                                    onChange={(e) => setResetForm({ newPassword: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 font-mono text-center sm:text-sm"
                                    placeholder="Enter new password"
                                />
                            </div>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowResetModal(false)}
                                    className="flex-1 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting || !resetForm.newPassword}
                                    className="flex-1 py-2 text-sm font-medium text-white bg-amber-600 rounded-xl hover:bg-amber-700 shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 transition-all flex items-center justify-center"
                                >
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Reset'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SuperAdminDashboard;
