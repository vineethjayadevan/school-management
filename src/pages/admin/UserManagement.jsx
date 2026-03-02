import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { userService } from '../../services/userService';
import { useToast } from '../../components/ui/Toast';
import { Users, Plus, Loader2, Edit2 } from 'lucide-react';

const userSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().optional().or(z.string().min(6, 'Password must be at least 6 characters')),
    role: z.enum(['admin', 'office_staff', 'teacher'], {
        errorMap: () => ({ message: 'Please select a valid role' }),
    }),
});

export default function UserManagement() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const { addToast } = useToast();

    const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
        resolver: zodResolver(userSchema),
    });

    useEffect(() => {
        fetchUsers();
    }, []);

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

    const handleEdit = (user) => {
        setEditingUser(user);
        setValue('name', user.name);
        setValue('email', user.email);
        setValue('role', user.role);
        // Password is not required for edit but schema might need it. 
        // Let's refine schema to make password optional for edit.
    };

    const handleCancelEdit = () => {
        setEditingUser(null);
        reset({
            name: '',
            email: '',
            password: '',
            role: ''
        });
    };

    const onSubmit = async (data) => {
        setIsCreating(true);
        try {
            if (editingUser) {
                await userService.updateUser(editingUser._id, data);
                addToast('User updated successfully', 'success');
                setEditingUser(null);
            } else {
                await userService.createUser(data);
                addToast('User created successfully', 'success');
            }
            reset();
            fetchUsers();
        } catch (error) {
            addToast(error.response?.data?.message || 'Operation failed', 'error');
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">User Management</h1>
                    <p className="text-gray-500 mt-1">Manage system access and roles</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Create User Form */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-5 border-b border-gray-100 bg-gray-50/50">
                            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                                {editingUser ? (
                                    <>
                                        <Edit2 className="w-4 h-4" />
                                        Edit User
                                    </>
                                ) : (
                                    <>
                                        <Plus className="w-4 h-4" />
                                        Add New User
                                    </>
                                )}
                            </h2>
                        </div>
                        <div className="p-5">
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                    <input
                                        type="text"
                                        {...register('name')}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                                        placeholder="e.g. John Doe"
                                    />
                                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                    <input
                                        type="email"
                                        {...register('email')}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                                        placeholder="john@example.com"
                                    />
                                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                    <input
                                        type="password"
                                        {...register('password')}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                                        placeholder={editingUser ? "Leave blank to keep current" : "••••••••"}
                                        disabled={!!editingUser} // Disable password change for now as backend doesn't handle it in updateUser
                                    />
                                    {!editingUser && errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                    <select
                                        {...register('role')}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                                    >
                                        <option value="">Select a role...</option>
                                        <option value="admin">Admin</option>
                                        <option value="teacher">Teacher</option>
                                        <option value="office_staff">Office Staff</option>
                                    </select>
                                    {errors.role && <p className="text-red-500 text-xs mt-1">{errors.role.message}</p>}
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        type="submit"
                                        disabled={isCreating}
                                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                                    >
                                        {isCreating ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            editingUser ? 'Update User' : 'Create User'
                                        )}
                                    </button>
                                    {editingUser && (
                                        <button
                                            type="button"
                                            onClick={handleCancelEdit}
                                            className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                                        >
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
                                <Users className="w-4 h-4" />
                                Existing Users
                            </h2>
                            <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                {users.length} Users
                            </span>
                        </div>

                        {loading ? (
                            <div className="p-8 text-center text-gray-500">Loading users...</div>
                        ) : users.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">No users found. Create one to get started.</div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {users.map((user) => (
                                    <div key={user._id} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-medium">
                                                {user.name.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-medium text-gray-900">{user.name}</h3>
                                                <p className="text-xs text-gray-500">{user.email}</p>
                                            </div>
                                        </div>
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize
                                            ${user.role === 'superuser' ? 'bg-purple-100 text-purple-700' :
                                                user.role === 'admin' ? 'bg-blue-100 text-blue-700' :
                                                    user.role === 'teacher' ? 'bg-green-100 text-green-700' :
                                                        'bg-gray-100 text-gray-700'
                                            }`}>
                                            {user.role}
                                        </span>
                                        <button
                                            onClick={() => handleEdit(user)}
                                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Edit Role"
                                        >
                                            <Edit2 size={16} />
                                        </button>
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
