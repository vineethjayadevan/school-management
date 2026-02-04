import { useState, useEffect } from 'react';
import TopBanner from '../components/common/TopBanner';
import { useAuth } from '../context/AuthContext';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    Banknote,
    GraduationCap,
    UserCog,
    Menu,
    X,
    LogOut,
    Bell,
    MessageSquare,
    Briefcase,
    Calendar,
    UserPlus
} from 'lucide-react';
import clsx from 'clsx';
import { authService } from '../services/auth';

export default function DashboardLayout() {
    const navigate = useNavigate();
    // Initialize sidebar based on screen width (closed on mobile default)
    const [isSidebarOpen, setIsSidebarOpen] = useState(() => window.innerWidth >= 1024);
    // Use context to get user state which is already resolved
    const { user, logout } = useAuth();
    const location = useLocation();

    // If for some reason user is missing (should be caught by RequireAuth), 
    // we can return null or letting the UI render safely with optional chaining.
    // RequireAuth in App.jsx handles the redirect security.

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navigation = [
        {
            name: 'Dashboard',
            href: '/admin/dashboard',
            icon: LayoutDashboard,
            allowed: ['superuser', 'admin']
        },
        {
            name: 'Admissions',
            href: '/admin/admissions',
            icon: UserPlus,
            allowed: ['superuser', 'admin']
        },
        {
            name: 'Students',
            href: '/admin/students',
            icon: Users,
            allowed: ['superuser', 'admin']
        },
        {
            name: 'Fees',
            href: '/admin/fees',
            icon: Banknote,
            allowed: ['superuser', 'admin']
        },
        {
            name: 'Academics',
            href: '/admin/academics',
            icon: GraduationCap,
            allowed: ['superuser', 'admin']
        },
        {
            name: 'Manage Events',
            href: '/admin/events',
            icon: Calendar,
            allowed: ['superuser', 'admin']
        },
        {
            name: 'Staff',
            href: '/admin/staff',
            icon: Briefcase,
            allowed: ['superuser', 'admin']
        },
        {
            name: 'User Management',
            href: '/admin/users',
            icon: UserCog,
            allowed: ['superuser']
        },
        {
            name: 'Enquiries',
            href: '/admin/enquiries',
            icon: MessageSquare,
            allowed: ['superuser', 'office_staff']
        }
    ];

    // Filter navigation based on user role
    const filteredNavigation = navigation.filter(item => item.allowed.includes(user?.role));

    if (!user) return null; // Safety check

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar */}
            <aside
                className={clsx(
                    "fixed inset-y-0 left-0 z-[100] w-64 bg-slate-900 text-white transition-transform duration-300 ease-in-out lg:translate-x-0 flex flex-col h-full",
                    !isSidebarOpen && "-translate-x-full lg:hidden"
                )}
            >
                {/* Sidebar Header */}
                <div className="p-4 border-b border-slate-800 flex items-center justify-between shrink-0 gap-2">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-8 h-8 bg-indigo-500/10 rounded-lg flex items-center justify-center text-indigo-400 shrink-0">
                            <GraduationCap size={20} />
                        </div>
                        <span className="font-bold text-lg leading-tight">
                            STEM Global Public <br />
                            School
                        </span>
                    </div>
                    <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="lg:hidden text-slate-400 hover:text-white hover:bg-slate-800 p-2 rounded-md transition-colors shrink-0"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
                    <div className="space-y-1">
                        {filteredNavigation.map((item) => (
                            <SidebarLink
                                key={item.name}
                                to={item.href}
                                icon={<item.icon size={20} />}
                                text={item.name}
                                onClick={() => {
                                    if (window.innerWidth < 1024) {
                                        setIsSidebarOpen(false);
                                    }
                                }}
                            />
                        ))}
                    </div>
                </nav>

                {/* Sidebar Footer */}
                <div className="p-4 border-t border-slate-800 bg-slate-900 shrink-0">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 text-slate-400 hover:text-white transition-colors w-full px-3 py-2 rounded-lg hover:bg-slate-800"
                    >
                        <LogOut size={20} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 lg:pl-64 transition-all duration-300">
                <TopBanner />
                {/* Topbar */}
                <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="lg:hidden text-slate-500 hover:text-slate-700"
                    >
                        <Menu size={24} />
                    </button>

                    <div className="flex items-center gap-4 ml-auto">
                        <button className="relative text-slate-500 hover:text-slate-700 transition-colors">
                            <Bell size={20} />
                            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
                        </button>
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

                {/* Page Content */}
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

// Helper Component for Sidebar Links
function SidebarLink({ to, icon, text, onClick }) {
    return (
        <NavLink
            to={to}
            onClick={onClick}
            className={({ isActive }) =>
                clsx(
                    "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                    isActive
                        ? "bg-indigo-600 text-white"
                        : "text-slate-400 hover:text-white hover:bg-slate-800"
                )
            }
        >
            {icon}
            <span>{text}</span>
        </NavLink>
    );
}

export { SidebarLink };
