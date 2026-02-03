import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, Mail, ArrowRight, BookOpen } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import TopBanner from '../../components/common/TopBanner';

export default function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const { addToast } = useToast();
    const { login, logout, user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    useEffect(() => {
        const checkAuthStatus = async () => {
            if (user) {
                const intendedRole = location.state?.role;

                // Helper to check if roles are compatible
                // e.g., 'admin' intent is compatible with 'superuser', 'admin', 'office_staff'
                const isCompatible = (userRole, targetRole) => {
                    if (!targetRole) return true; // No specific intent, keep logged in
                    if (userRole === targetRole) return true;

                    // Admin portal handles multiple roles
                    if (targetRole === 'admin' && ['superuser', 'admin', 'office_staff'].includes(userRole)) return true;

                    return false;
                };

                if (intendedRole && !isCompatible(user.role, intendedRole)) {
                    // Conflicting role - logout and allow user to sign in
                    await logout();
                    return;
                }

                // Redirect if roles match or no specific intent
                if (['superuser', 'admin'].includes(user.role)) navigate('/admin/dashboard');
                else if (user.role === 'office_staff') navigate('/admin/enquiries');
                else if (user.role === 'teacher') navigate('/teacher/dashboard');
                else if (user.role === 'board_member') navigate('/board/dashboard');
                else if (user.role === 'student') navigate('/student/dashboard');
                else navigate('/');
            }
        };

        checkAuthStatus();
    }, [user, navigate, location.state, logout]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = await login(formData.email, formData.password);
            addToast('Welcome back!', 'success');
            // Navigation handled by useEffect when user state updates
        } catch (error) {
            console.error(error);
            addToast(error.response?.data?.message || 'Login failed', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex flex-col relative">
            <TopBanner />
            <div className="flex-1 flex items-center justify-center p-4">
                <button
                    onClick={() => navigate('/')}
                    className="absolute top-6 left-6 md:top-24 md:left-6 text-white hover:text-white/80 flex items-center gap-2 font-medium transition-colors z-50 shadow-sm"
                >
                    <ArrowRight className="rotate-180" size={20} />
                    <span>Back to Home</span>
                </button>
                <div className="w-full max-w-md">
                    {/* Glassmorphism Card */}
                    <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden">
                        <div className="p-8">
                            <div className="text-center mb-8">
                                <div className="w-16 h-16 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-2xl mx-auto flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 mb-4 transform rotate-3">
                                    <BookOpen size={32} />
                                </div>
                                <h1 className="text-2xl font-bold text-slate-900">Welcome Back</h1>
                                <p className="text-slate-500 mt-2">Sign in to manage your school</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                        <input
                                            type="email"
                                            required
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                                            placeholder="admin@school.com"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                        <input
                                            type="password"
                                            required
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between text-sm">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                                        <span className="text-slate-600">Remember me</span>
                                    </label>
                                    <button type="button" className="text-indigo-600 hover:text-indigo-700 font-medium">
                                        Forgot Password?
                                    </button>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white py-3.5 rounded-xl font-bold hover:shadow-lg hover:shadow-indigo-500/30 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            Sign In <ArrowRight size={20} />
                                        </>
                                    )}
                                </button>
                            </form>


                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
