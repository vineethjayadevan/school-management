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
    Banknote
} from 'lucide-react';
import clsx from 'clsx';
import { authService } from '../services/auth';

export default function StudentLayout() {
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [user] = useState(() => authService.getCurrentUser());

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    const navigation = [
        { name: 'Overview', href: '/student/dashboard', icon: LayoutDashboard },
        { name: 'My Schedule', href: '/student/schedule', icon: Calendar },
        { name: 'Assignments', href: '/student/assignments', icon: BookOpen },
        { name: 'Fee Status', href: '/student/fees', icon: Banknote },
    ];

    if (!user) return null;

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar */}
            <aside
                className={clsx(
                    "fixed inset-y-0 left-0 z-50 w-64 bg-emerald-900 text-white transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0",
                    !isSidebarOpen && "-translate-x-full lg:hidden"
                )}
            >
                <div className="p-4 border-b border-emerald-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center font-bold text-white">
                            S
                        </div>
                        <span className="font-semibold text-lg">Student Portal</span>
                    </div>
                    <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="lg:hidden text-emerald-200 hover:text-white"
                    >
                        <X size={20} />
                    </button>
                </div>

                <nav className="p-4 space-y-1">
                    {navigation.map((item) => (
                        <NavLink
                            key={item.name}
                            to={item.href}
                            className={({ isActive }) =>
                                clsx(
                                    "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                                    isActive
                                        ? "bg-white/10 text-white"
                                        : "text-emerald-200 hover:text-white hover:bg-white/5"
                                )
                            }
                        >
                            <item.icon size={20} />
                            <span>{item.name}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="absolute bottom-0 w-full p-4 border-t border-emerald-800">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 text-emerald-200 hover:text-white transition-colors w-full px-3 py-2 rounded-lg hover:bg-white/5"
                    >
                        <LogOut size={20} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
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
        </div>
    );
}
