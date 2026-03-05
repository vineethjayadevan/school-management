import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { userService } from '../../services/userService';
import { useToast } from '../../components/ui/Toast';
import { Users, Plus, Loader2, Edit2, Link, CheckCircle, AlertCircle, UserCheck } from 'lucide-react';
import api from '../../services/api';

const ROLE_OPTIONS = [
    { value: 'admin', label: 'Admin' },
    { value: 'teacher', label: 'Teacher' },
    { value: 'student', label: 'Student' },
    { value: 'office_staff', label: 'Office Staff' },
];

export default function UserManagement() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [unlinkedProfiles, setUnlinkedProfiles] = useState([]);
    const [loadingProfiles, setLoadingProfiles] = useState(false);
    const [selectedProfile, setSelectedProfile] = useState(null);
    const { addToast } = useToast();

    const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
        defaultValues: { name: '', email: '', password: '', role: '', profileId: '' }
    });

    const selectedRole = watch('role');

    useEffect(() => {
        fetchUsers();
    }, []);

    // Fetch unlinked profiles when role changes to teacher or student
    useEffect(() => {
        if (!editingUser && (selectedRole === 'teacher' || selectedRole === 'student')) {
            fetchUnlinkedProfiles(selectedRole === 'teacher' ? 'staff' : 'student');
        } else {
            setUnlinkedProfiles([]);
            setSelectedProfile(null);
        }
    }, [selectedRole, editingUser]);

    const fetchUsers = async () => {
        try {
            const data = await userService.getUsers();
            setUsers(data);
        } catch (error) {
            addToast('Failed to fetch users', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchUnlinkedProfiles = async (type) => {
        setLoadingProfiles(true);
        setSelectedProfile(null);
        setValue('profileId', '');
        try {
            const { data } = await api.get(`/users/unlinked-profiles?type=${type}`);
            setUnlinkedProfiles(data);
        } catch (error) {
            addToast('Failed to load profiles', 'error');
        } finally {
            setLoadingProfiles(false);
        }
    };

    const handleProfileSelect = (profileId) => {
        const profile = unlinkedProfiles.find(p => p._id === profileId);
        setSelectedProfile(profile);
        setValue('profileId', profileId);
        if (profile) {
            setValue('name', profile.name);
            setValue('email', profile.email || '');
        }
    };

    const handleEdit = (user) => {
        setEditingUser(user);
        setValue('name', user.name);
        setValue('email', user.email || '');
        setValue('role', user.role);
        setValue('profileId', '');
        setUnlinkedProfiles([]);
        setSelectedProfile(null);
    };

    const handleCancelEdit = () => {
        setEditingUser(null);
        reset({ name: '', email: '', password: '', role: '', profileId: '' });
        setSelectedProfile(null);
        setUnlinkedProfiles([]);
    };

    const onSubmit = async (data) => {
        if (!data.name?.trim()) return addToast('Name is required', 'error');
        if (!data.role) return addToast('Please select a role', 'error');
        if (!editingUser && !data.password) return addToast('Password is required', 'error');

        setIsCreating(true);
        try {
            if (editingUser) {
                await userService.updateUser(editingUser._id, { name: data.name, role: data.role });
                addToast('User updated successfully', 'success');
                setEditingUser(null);
            } else {
                await userService.createUser({
                    name: data.name,
                    email: data.email || undefined,
                    password: data.password,
                    role: data.role,
                    profileId: data.profileId || undefined,
                });
                addToast('User created successfully', 'success');
            }
            reset({ name: '', email: '', password: '', role: '', profileId: '' });
            setSelectedProfile(null);
            setUnlinkedProfiles([]);
            fetchUsers();
        } catch (error) {
            addToast(error.response?.data?.message || 'Operation failed', 'error');
        } finally {
            setIsCreating(false);
        }
    };

    const roleBadge = (role) => {
        const map = {
            superuser: 'bg-purple-100 text-purple-700',
            superadmin: 'bg-purple-100 text-purple-700',
            admin: 'bg-blue-100 text-blue-700',
            teacher: 'bg-emerald-100 text-emerald-700',
            student: 'bg-amber-100 text-amber-700',
            office_staff: 'bg-slate-100 text-slate-600',
            officestaff: 'bg-slate-100 text-slate-600',
        };
        return map[role] || 'bg-gray-100 text-gray-600';
    };

    const needsProfileLink = selectedRole === 'teacher' || selectedRole === 'student';

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">User Management</h1>
                    <p className="text-gray-500 mt-1">Manage system access and roles</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Create / Edit User Form */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-5 border-b border-gray-100 bg-gray-50/50">
                            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                                {editingUser ? <><Edit2 className="w-4 h-4" /> Edit User</> : <><Plus className="w-4 h-4" /> Add New User</>}
                            </h2>
                        </div>

                        <div className="p-5">
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                {/* Role (First — drives everything) */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                    <select
                                        {...register('role')}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                                    >
                                        <option value="">Select a role...</option>
                                        {ROLE_OPTIONS.map(r => (
                                            <option key={r.value} value={r.value}>{r.label}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Profile Selector — only for teacher/student when not editing */}
                                {!editingUser && needsProfileLink && (
                                    <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4 space-y-2">
                                        <label className="block text-sm font-medium text-indigo-700 flex items-center gap-1.5">
                                            <Link size={14} />
                                            Link to {selectedRole === 'teacher' ? 'Staff' : 'Student'} Profile
                                        </label>

                                        {loadingProfiles ? (
                                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                                <Loader2 size={14} className="animate-spin" /> Loading profiles...
                                            </div>
                                        ) : (
                                            <select
                                                value={selectedProfile?._id || ''}
                                                onChange={e => handleProfileSelect(e.target.value)}
                                                className="w-full px-3 py-2 border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors text-sm bg-white"
                                            >
                                                <option value="">— Select a profile —</option>
                                                {unlinkedProfiles.map(p => (
                                                    <option key={p._id} value={p._id}>
                                                        {p.name}
                                                        {p.admissionNo ? ` (${p.admissionNo} · ${p.className}-${p.section})` : ''}
                                                        {p.category ? ` · ${p.category}` : ''}
                                                    </option>
                                                ))}
                                            </select>
                                        )}

                                        {selectedProfile && (
                                            <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
                                                <CheckCircle size={12} />
                                                Profile selected — name &amp; email auto-filled below
                                            </div>
                                        )}

                                        {!loadingProfiles && unlinkedProfiles.length === 0 && (
                                            <div className="flex items-center gap-1.5 text-xs text-amber-600">
                                                <AlertCircle size={12} />
                                                No unlinked {selectedRole === 'teacher' ? 'staff' : 'student'} profiles found
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                    <input
                                        type="text"
                                        {...register('name')}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                                        placeholder="e.g. John Doe"
                                        readOnly={!!selectedProfile}
                                    />
                                </div>

                                {/* Email */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address <span className="text-gray-400 text-xs">(optional)</span></label>
                                    <input
                                        type="email"
                                        {...register('email')}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                                        placeholder="john@example.com"
                                        readOnly={!!selectedProfile && !!selectedProfile.email}
                                    />
                                </div>

                                {/* Password */}
                                {!editingUser && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                        <input
                                            type="password"
                                            {...register('password')}
                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                )}

                                <div className="flex gap-2 pt-1">
                                    <button
                                        type="submit"
                                        disabled={isCreating}
                                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                                    >
                                        {isCreating ? (
                                            <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                                        ) : (
                                            editingUser ? 'Update User' : 'Create User'
                                        )}
                                    </button>
                                    {editingUser && (
                                        <button type="button" onClick={handleCancelEdit} className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
                                            Cancel
                                        </button>
                                    )}
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

                {/* User List */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                                <Users className="w-4 h-4" /> Existing Users
                            </h2>
                            <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                {users.length} Users
                            </span>
                        </div>

                        {loading ? (
                            <div className="p-8 text-center text-gray-500">Loading users...</div>
                        ) : users.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">No users found.</div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {users.map((user) => (
                                    <div key={user._id} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-blue-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="text-sm font-medium text-gray-900 truncate">{user.name}</h3>
                                                <p className="text-xs text-gray-500 truncate">{user.email || 'No email'}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            {/* Profile Link Badge */}
                                            {(user.role === 'teacher' || user.role === 'student') && (
                                                <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${user.profileId ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                    {user.profileId ? <><UserCheck size={10} /> Linked</> : <><AlertCircle size={10} /> Unlinked</>}
                                                </span>
                                            )}

                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${roleBadge(user.role)}`}>
                                                {user.role.replace('_', ' ')}
                                            </span>

                                            <button
                                                onClick={() => handleEdit(user)}
                                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Edit Role"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                        </div>
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
