import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { systemService } from '../../services/systemApi';
import { useAuth } from '../../context/AuthContext';
import { Lock, User, KeyRound, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const SystemLogin = () => {
    const [formData, setFormData] = useState({ username: '', password: '', pin: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { updateUser } = useAuth(); // Using this to inject the user

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const userData = await systemService.login(
                formData.username,
                formData.password,
                formData.pin
            );

            // The cookie is now set. Update context or force reload
            updateUser(userData);

            // Redirect
            toast.success('System Authentication Successful');
            window.location.href = '/system/dashboard'; // Hard reload ensures auth context cleanly fetches
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen fixed inset-0 flex items-center justify-center relative overflow-hidden bg-slate-900 border border-slate-800">
            {/* Background elements */}
            <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
            <div className="absolute top-0 -right-4 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-8 left-20 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

            <div className="w-full max-w-md p-8 relative z-10">
                <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700 p-8">

                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-500/10 mb-4">
                            <Lock className="w-8 h-8 text-indigo-400" />
                        </div>
                        <h2 className="text-3xl font-bold text-white tracking-tight">System Access</h2>
                        <p className="text-slate-400 mt-2 text-sm">Super Administrator Portal</p>
                    </div>

                    {error && (
                        <div className="mb-6 bg-red-500/10 border border-red-500/50 rounded-lg p-4 flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                            <p className="text-sm text-red-400">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">System Username</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-slate-500" />
                                </div>
                                <input
                                    type="text"
                                    name="username"
                                    required
                                    value={formData.username}
                                    onChange={handleChange}
                                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-600 rounded-xl leading-5 bg-slate-800/50 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all duration-200"
                                    placeholder="Enter username"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-slate-500" />
                                </div>
                                <input
                                    type="password"
                                    name="password"
                                    required
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-600 rounded-xl leading-5 bg-slate-800/50 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all duration-200"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Secret PIN</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <KeyRound className="h-5 w-5 text-slate-500" />
                                </div>
                                <input
                                    type="password"
                                    name="pin"
                                    required
                                    value={formData.pin}
                                    onChange={handleChange}
                                    maxLength={6}
                                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-600 rounded-xl leading-5 bg-slate-800/50 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all duration-200 tracking-[0.5em] font-mono"
                                    placeholder="••••"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !formData.username || !formData.password || !formData.pin}
                            className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-slate-900 transition-all duration-200 ${(loading || !formData.username || !formData.password || !formData.pin) ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                'Authenticate'
                            )}
                        </button>
                    </form>
                </div>
                <div className="text-center mt-6">
                    <p className="text-xs text-slate-500 flex items-center justify-center gap-1">
                        <Lock className="w-3 h-3" /> Secure System Gateway
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SystemLogin;
