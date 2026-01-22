import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight, BookOpen } from 'lucide-react';
import { authService } from '../../services/auth';
import { useToast } from '../../components/ui/Toast';
import TopBanner from '../../components/common/TopBanner';

export default function Login() {
    const navigate = useNavigate();
    const { addToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    useEffect(() => {
        if (authService.isAuthenticated()) {
            navigate('/redirect', { replace: true });
        }
    }, [navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = await authService.login(formData.email, formData.password);
            addToast('Welcome back!', 'success');

            // Redirect based on role
            if (['superuser', 'admin'].includes(data.role)) navigate('/admin/dashboard');
            else if (data.role === 'office_staff') navigate('/admin/enquiries');
            else if (data.role === 'teacher') navigate('/teacher/dashboard');
            else if (data.role === 'student') navigate('/student/dashboard');
            else navigate('/');
        } catch (error) {
            addToast(error.message, 'error');
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
                    className="absolute top-6 left-6 text-white/80 hover:text-white flex items-center gap-2 font-medium transition-colors"
                >
                    <ArrowRight className="rotate-180" size={20} /> Back to Home
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

                            <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                                <p className="text-xs text-slate-400">
                                    Demo Credentials: <br />
                                    Admin: <span className="font-mono text-slate-600">admin@school.com</span> / <span className="font-mono text-slate-600">password123</span><br />
                                    Teacher: <span className="font-mono text-slate-600">sarah.math@school.com</span> / <span className="font-mono text-slate-600">password123</span>

                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
