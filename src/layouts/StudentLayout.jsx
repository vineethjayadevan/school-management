import { useState } from 'react';
import TopBanner from '../components/common/TopBanner';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    BookOpen,
    Calendar,
    LogOut,
    Menu,
    X,
    Banknote,
    User,
    GraduationCap
} from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../context/AuthContext';

export default function StudentLayout() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleLogout = async () => {
        try {
            setIsLoggingOut(true);
            await logout();
            navigate('/login');
        } catch (error) {
            console.error('Logout failed:', error);
        } finally {
            setIsLoggingOut(false);
        }
    };

    const navigation = [
        { name: 'Overview', href: '/student/dashboard', icon: LayoutDashboard },
        { name: 'My Profile', href: '/student/profile', icon: User },
        { name: 'My Timetable', href: '/student/timetable', icon: Calendar },
        { name: 'Assignments', href: '/student/assignments', icon: BookOpen },
        { name: 'Fee Status', href: '/student/fees', icon: Banknote },
        { name: 'Exams & Results', href: '/student/exams', icon: GraduationCap },
    ];

    if (!user) return null;

    return (
        <div className="h-[100dvh] bg-slate-50 flex font-sans overflow-hidden">
            {/* Sidebar with Premium Gradient and Fixed Positioning */}
            <aside
                className={clsx(
                    "fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 transition-all duration-300 ease-in-out lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 shadow-2xl shrink-0 h-full flex flex-col",
                    !isSidebarOpen && "-translate-x-full lg:hidden"
                )}
            >
                {/* Visual Background Element */}
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"></div>

                <div className="relative h-full flex flex-col z-10">
                    <div className="p-6 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                <GraduationCap size={24} className="text-white" />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-bold text-white tracking-tight text-lg">My Academy</span>
                                <span className="text-[10px] font-bold text-indigo-400 tracking-[0.2em] uppercase">Student Portal</span>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsSidebarOpen(false)}
                            className="lg:hidden text-slate-400 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar">
                        <div className="px-3 mb-4">
                            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Navigation</h3>
                        </div>
                        {navigation.map((item) => (
                            <NavLink
                                key={item.name}
                                to={item.href}
                                className={({ isActive }) =>
                                    clsx(
                                        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative",
                                        isActive
                                            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                                            : "text-slate-400 hover:text-white hover:bg-white/5"
                                    )
                                }
                            >
                                <item.icon size={20} className={clsx("transition-transform group-hover:scale-110")} />
                                <span className="font-medium">{item.name}</span>
                            </NavLink>
                        ))}
                    </nav>

                    <div className="p-4 bg-slate-900/50 backdrop-blur-md border-t border-white/5 shrink-0">
                        <div className="flex items-center gap-3 mb-3 px-2">
                            <div className="w-9 h-9 rounded-full border border-indigo-500/30 overflow-hidden bg-slate-800 flex items-center justify-center shrink-0">
                                {user.avatar ? (
                                    <img src={user.avatar} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <User size={18} className="text-slate-400" />
                                )}
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-bold text-white truncate">{user.name}</p>
                                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Student</p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            disabled={isLoggingOut}
                            className={clsx(
                                "flex items-center justify-center gap-2 transition-all w-full px-3 py-2 rounded-xl border font-bold text-xs shadow-sm",
                                isLoggingOut
                                    ? "bg-rose-500/20 text-rose-300 border-rose-500/30 cursor-not-allowed"
                                    : "text-rose-400 hover:text-white hover:bg-rose-500 border-rose-500/20"
                            )}
                        >
                            <LogOut size={16} className={clsx(isLoggingOut && "animate-pulse")} />
                            <span>{isLoggingOut ? 'Please wait...' : 'Sign Out'}</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 relative h-full overflow-hidden">
                <TopBanner />
                <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-40 shrink-0 h-16 shadow-sm">
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="lg:hidden p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                    >
                        <Menu size={24} />
                    </button>

                    <div className="flex items-center gap-4 ml-auto">
                        <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Online</span>
                        </div>

                        <div className="flex items-center gap-3 pl-6 border-l border-slate-200/60">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-bold text-slate-900 leading-tight">{user.name}</p>
                                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-tight">Student</p>
                            </div>
                            <NavLink to="/student/profile" className="hover:scale-110 transition-transform">
                                <div className="w-10 h-10 rounded-full border border-indigo-500/10 overflow-hidden bg-slate-100 flex items-center justify-center">
                                    {user.avatar ? (
                                        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <User size={20} className="text-indigo-400" />
                                    )}
                                </div>
                            </NavLink>
                            <button
                                onClick={handleLogout}
                                disabled={isLoggingOut}
                                className="flex items-center gap-2 px-3 py-1.5 ml-1 bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-lg transition-all border border-slate-200 hover:border-rose-100 group font-bold text-xs"
                            >
                                <LogOut size={14} className={clsx("group-hover:-translate-x-1 transition-transform", isLoggingOut && "animate-spin")} />
                                <span>Sign Out</span>
                            </button>
                        </div>
                    </div>
                </header>

                <main className="flex-1 p-8 overflow-y-auto custom-scrollbar bg-slate-50/50">
                    <div className="max-w-[1600px] mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>

            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-300"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}
        </div>
    );
}
