import { useState, useEffect } from 'react';
import TopBanner from '../components/common/TopBanner';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    BookOpen,
    Calendar,
    LogOut,
    Menu,
    X,
    Bell,
    CheckSquare,
    User,
    ClipboardList,
    FlaskConical,
    FileText
} from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../context/AuthContext';

export default function TeacherLayout() {
    const navigate = useNavigate();
    // Initialize sidebar based on screen width
    const [isSidebarOpen, setIsSidebarOpen] = useState(() => window.innerWidth >= 1024);
    const { user, logout } = useAuth();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const navigation = [
        { name: 'Dashboard', href: '/teacher/dashboard', icon: LayoutDashboard },
        { name: 'My Classes', href: '/teacher/classes', icon: BookOpen },
        { name: 'Mark Attendance', href: '/teacher/attendance', icon: CheckSquare },
        { name: 'My Attendance', href: '/teacher/my-attendance', icon: ClipboardList },
        { name: 'Schedule', href: '/teacher/schedule', icon: Calendar },
        { name: 'Exams', href: '/teacher/exams', icon: FlaskConical },
        { name: 'Question Papers', href: '/teacher/question-papers', icon: FileText },
        { name: 'My Profile', href: '/teacher/profile', icon: User },
    ];

    if (!user) return null;

    return (
        <div className="h-[100dvh] bg-slate-50 flex overflow-hidden">
            {/* Sidebar */}
            <aside
                className={clsx(
                    "fixed inset-y-0 left-0 z-[100] w-64 bg-indigo-950 text-white transition-transform duration-300 ease-in-out lg:translate-x-0 flex flex-col h-full shadow-2xl border-r border-white/5",
                    !isSidebarOpen && "-translate-x-full lg:hidden"
                )}
            >
                {/* Sidebar Header */}
                <div className="p-4 border-b border-white/5 flex items-center justify-between shrink-0 h-16 bg-indigo-950">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-white shrink-0 shadow-lg shadow-indigo-500/20">
                            T
                        </div>
                        <span className="font-bold text-lg truncate tracking-tight">Teacher Portal</span>
                    </div>
                    <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="lg:hidden text-indigo-400 hover:text-white p-2 shrink-0 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Navigation - Scrollable Area */}
                <nav className="flex-1 overflow-y-auto p-4 pb-8 space-y-1 custom-scrollbar scroll-smooth">
                    {navigation.map((item) => (
                        <NavLink
                            key={item.name}
                            to={item.href}
                            onClick={() => {
                                if (window.innerWidth < 1024) {
                                    setIsSidebarOpen(false);
                                }
                            }}
                            className={({ isActive }) =>
                                clsx(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300",
                                    isActive
                                        ? "bg-indigo-600 text-white shadow-xl shadow-indigo-950/40 translate-x-1"
                                        : "text-indigo-300 hover:text-white hover:bg-white/5 hover:translate-x-1"
                                )
                            }
                        >
                            <item.icon size={20} className="shrink-0" />
                            <span className="font-medium truncate">{item.name}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* Sidebar Footer with User Profile */}
                <div className="p-4 border-t border-white/5 bg-indigo-950/40 backdrop-blur-md shrink-0">
                    <div className="flex items-center justify-between gap-3 px-2">
                        <div className="flex items-center gap-3 min-w-0">
                            <img
                                src={user.avatar}
                                alt={user.name}
                                className="w-9 h-9 rounded-full border border-indigo-700/50 object-cover shrink-0"
                            />
                            <div className="min-w-0">
                                <p className="text-sm font-bold text-white truncate leading-tight">{user.name}</p>
                                <p className="text-[10px] font-medium text-indigo-400 capitalize truncate uppercase tracking-wider">
                                    {user.role}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            title="Sign Out"
                            className="p-2 text-indigo-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors shrink-0"
                        >
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 lg:pl-64 transition-all duration-300 h-full overflow-hidden relative">
                <TopBanner />
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                    <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-40 shrink-0 h-16">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                className="lg:hidden text-slate-500 hover:text-slate-700 p-2 -ml-2 rounded-lg hover:bg-slate-100 transition-colors"
                            >
                                <Menu size={24} />
                            </button>
                            <h2 className="text-lg font-bold text-slate-800 hidden sm:block truncate">
                                Welcome back, {user.name.split(' ')[0]}!
                            </h2>
                        </div>

                        <div className="flex items-center gap-4 ml-auto">
                            <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                                <div className="hidden md:block text-right">
                                    <p className="text-sm font-bold text-slate-900 leading-tight">{user.name}</p>
                                    <p className="text-[10px] font-black text-slate-400 capitalize tracking-wider">{user.role}</p>
                                </div>
                                <img
                                    src={user.avatar}
                                    alt={user.name}
                                    className="w-9 h-9 rounded-full border border-slate-200 shadow-sm object-cover"
                                />
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-2 px-3 py-1.5 ml-2 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-lg transition-all border border-slate-200 hover:border-red-100 group font-semibold text-sm"
                                >
                                    <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" />
                                    <span>Sign Out</span>
                                </button>
                            </div>
                        </div>
                    </header>

                    <main className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-slate-50/50">
                        <div className="max-w-[1600px] mx-auto">
                            <Outlet />
                        </div>
                    </main>
                </div>
            </div>

            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[90] lg:hidden animate-in fade-in duration-300"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}
        </div>
    );
}
