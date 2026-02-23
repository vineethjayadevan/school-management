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
    User
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
        { name: 'Attendance', href: '/teacher/attendance', icon: CheckSquare },
        { name: 'Schedule', href: '/teacher/schedule', icon: Calendar },
        { name: 'My Profile', href: '/teacher/profile', icon: User },
    ];

    if (!user) return null;

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar */}
            <aside
                className={clsx(
                    "fixed inset-y-0 left-0 z-[100] w-64 bg-indigo-900 text-white transition-transform duration-300 ease-in-out lg:translate-x-0 flex flex-col h-full",
                    !isSidebarOpen && "-translate-x-full lg:hidden"
                )}
            >
                {/* Sidebar Header */}
                <div className="p-4 border-b border-indigo-800 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center font-bold text-white shrink-0">
                            T
                        </div>
                        <span className="font-semibold text-lg">Teacher Portal</span>
                    </div>
                    <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="lg:hidden text-indigo-400 hover:text-white p-2 shrink-0 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
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
                                    "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                                    isActive
                                        ? "bg-indigo-600 text-white"
                                        : "text-indigo-200 hover:text-white hover:bg-white/5"
                                )
                            }
                        >
                            <item.icon size={20} />
                            <span>{item.name}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* Sidebar Footer */}
                <div className="p-4 border-t border-indigo-800 bg-indigo-900 shrink-0">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 text-indigo-200 hover:text-white transition-colors w-full px-3 py-2 rounded-lg hover:bg-indigo-800"
                    >
                        <LogOut size={20} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 lg:pl-64 transition-all duration-300">
                <TopBanner />
                <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="lg:hidden text-slate-500 hover:text-slate-700"
                    >
                        <Menu size={24} />
                    </button>

                    <div className="flex items-center gap-4 ml-auto">
                        <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                            <img
                                src={user.avatar}
                                alt={user.name}
                                className="w-8 h-8 rounded-full border border-slate-200"
                            />
                            <div className="hidden md:block">
                                <p className="text-sm font-medium text-slate-900">{user.name}</p>
                                <p className="text-xs text-slate-500 capitalize">{user.role}</p>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="flex-1 p-6 overflow-auto">
                    <Outlet />
                </main>
            </div>

            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-[90] lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}
        </div>
    );
}
