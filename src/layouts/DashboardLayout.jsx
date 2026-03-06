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
    Briefcase,
    UserPlus,
    DollarSign,
    Settings,
    ArrowUpRight,
    ChevronDown,
    BookOpen,
    CalendarCheck,
    FileText,
    ClipboardList,
    FlaskConical,
    Clock,
    FileX
} from 'lucide-react';
import clsx from 'clsx';
import { authService } from '../services/auth';

// ─── Navigation Config ────────────────────────────────────────────────────────
const NAV_GROUPS = [
    {
        type: 'link',
        name: 'Dashboard',
        href: '/admin/dashboard',
        icon: LayoutDashboard,
        allowed: ['superuser', 'admin'],
    },
    {
        type: 'group',
        name: 'Student Management',
        icon: Users,
        allowed: ['superuser', 'admin'],
        children: [
            { name: 'Admissions', href: '/admin/admissions', icon: UserPlus, allowed: ['superuser', 'admin'] },
            { name: 'Students', href: '/admin/students', icon: Users, allowed: ['superuser', 'admin'] },
            { name: 'Attendance Report', href: '/admin/student-attendance-report', icon: ClipboardList, allowed: ['superuser', 'admin'] },
            { name: 'Promote Students', href: '/admin/promotion', icon: ArrowUpRight, allowed: ['superuser', 'admin'] },
            { name: 'Transfer Certificates', href: '/admin/transfer-certificates', icon: FileX, allowed: ['superuser', 'admin'] },
        ],
    },
    {
        type: 'group',
        name: 'Finance',
        icon: Banknote,
        allowed: ['superuser', 'admin'],
        children: [
            { name: 'Fees', href: '/admin/fees', icon: Banknote, allowed: ['superuser', 'admin'] },
            { name: 'Salaries', href: '/admin/salaries', icon: DollarSign, allowed: ['superuser', 'admin'] },
            { name: 'Reports', href: null, icon: FileText, allowed: ['superuser', 'admin'], comingSoon: true },
        ],
    },
    {
        type: 'group',
        name: 'Human Resources',
        icon: Briefcase,
        allowed: ['superuser', 'admin'],
        children: [
            { name: 'Staff', href: '/admin/staff', icon: Briefcase, allowed: ['superuser', 'admin'] },
            { name: 'Salary Structure', href: '/admin/salary-structure', icon: DollarSign, allowed: ['superuser', 'admin'] },
            { name: 'Staff Attendance', href: '/admin/staff-attendance', icon: CalendarCheck, allowed: ['superuser', 'admin'] },
            { name: 'Attendance Report', href: '/admin/staff-attendance-report', icon: ClipboardList, allowed: ['superuser', 'admin'] },
        ],
    },
    {
        type: 'group',
        name: 'Academics',
        icon: GraduationCap,
        allowed: ['superuser', 'admin'],
        children: [
            { name: 'Classes & Subjects', href: '/admin/academics', icon: BookOpen, allowed: ['superuser', 'admin'] },
            { name: 'Timetable', href: '/admin/timetable', icon: Clock, allowed: ['superuser', 'admin'] },
            { name: 'Student Attendance', href: '/admin/attendance', icon: ClipboardList, allowed: ['superuser', 'admin'] },
        ],
    },
    {
        type: 'group',
        name: 'System',
        icon: Settings,
        allowed: ['superuser', 'admin'],
        children: [
            { name: 'Academic Year', href: '/admin/academic-years', icon: CalendarCheck, allowed: ['superuser', 'admin'] },
            { name: 'User Management', href: '/admin/users', icon: UserCog, allowed: ['superuser'] },
            { name: 'Settings', href: '/admin/system-settings', icon: Settings, allowed: ['superuser', 'admin'] },
        ],
    },
];

// ─── Main Layout ──────────────────────────────────────────────────────────────
export default function DashboardLayout() {
    const navigate = useNavigate();
    const [isSidebarOpen, setIsSidebarOpen] = useState(() => window.innerWidth >= 1024);
    const { user, logout } = useAuth();
    const location = useLocation();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    // Determine which groups should start open (those with an active child)
    const getInitialOpenGroups = () => {
        const open = {};
        NAV_GROUPS.forEach((group) => {
            if (group.type === 'group') {
                const hasActive = group.children.some(
                    (c) => c.href && location.pathname.startsWith(c.href)
                );
                if (hasActive) open[group.name] = true;
            }
        });
        return open;
    };

    const [openGroups, setOpenGroups] = useState(getInitialOpenGroups);

    // Auto-open only the active group when navigating (close others)
    useEffect(() => {
        NAV_GROUPS.forEach((group) => {
            if (group.type === 'group') {
                const hasActive = group.children.some(
                    (c) => c.href && location.pathname.startsWith(c.href)
                );
                if (hasActive) {
                    setOpenGroups({ [group.name]: true }); // accordion: close all others
                }
            }
        });
    }, [location.pathname]);

    // Accordion: opening one group closes all others
    const toggleGroup = (name) => {
        setOpenGroups((prev) => {
            const isOpen = !!prev[name];
            return isOpen ? {} : { [name]: true };
        });
    };

    if (!user) return null;

    // Filter based on role
    const visibleGroups = NAV_GROUPS.filter((g) => g.allowed.includes(user?.role));

    return (
        <div className="h-[100dvh] bg-slate-50 flex overflow-hidden">
            {/* ── Sidebar ── */}
            <aside
                className={clsx(
                    'fixed inset-y-0 left-0 z-[100] w-64 bg-slate-900 text-white transition-transform duration-300 ease-in-out lg:translate-x-0 flex flex-col h-full shadow-2xl border-r border-white/5',
                    !isSidebarOpen && '-translate-x-full lg:hidden'
                )}
            >
                {/* Header */}
                <div className="p-4 border-b border-white/5 flex items-center justify-between shrink-0 gap-2 h-16 bg-slate-900">
                    <div className="flex items-center gap-3 min-w-0 flex-1 overflow-hidden">
                        <div className="w-8 h-8 bg-indigo-500/10 rounded-lg flex items-center justify-center text-indigo-400 shrink-0 shadow-lg shadow-indigo-500/5">
                            <GraduationCap size={20} />
                        </div>
                        <span className="font-bold text-lg leading-tight truncate tracking-tight">
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

                {/* Navigation - Scrollable Area */}
                <nav className="flex-1 overflow-y-auto py-4 custom-scrollbar scroll-smooth">
                    <div className="space-y-0.5 px-3">
                        {visibleGroups.map((item) => {
                            if (item.type === 'link') {
                                // ── Top-level single link ──
                                return (
                                    <NavLink
                                        key={item.name}
                                        to={item.href}
                                        onClick={() => { if (window.innerWidth < 1024) setIsSidebarOpen(false); }}
                                        className={({ isActive }) =>
                                            clsx(
                                                'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 text-[15px] font-medium',
                                                isActive
                                                    ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-950/40 translate-x-1'
                                                    : 'text-slate-400 hover:text-white hover:bg-slate-800 hover:translate-x-1'
                                            )
                                        }
                                    >
                                        <item.icon size={18} className="shrink-0" />
                                        <span className="truncate">{item.name}</span>
                                    </NavLink>
                                );
                            }

                            // ── Group ──
                            const isGroupOpen = !!openGroups[item.name];
                            const visibleChildren = item.children.filter(
                                (c) => c.allowed.includes(user?.role)
                            );
                            if (visibleChildren.length === 0) return null;

                            const isGroupActive = visibleChildren.some(
                                (c) => c.href && location.pathname.startsWith(c.href)
                            );

                            return (
                                <div key={item.name} className="mt-1">
                                    {/* Group Header */}
                                    <button
                                        onClick={() => toggleGroup(item.name)}
                                        className={clsx(
                                            'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 text-[15px] font-semibold',
                                            isGroupActive
                                                ? 'text-indigo-300'
                                                : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                        )}
                                    >
                                        <item.icon size={18} className="shrink-0" />
                                        <span className="flex-1 text-left truncate">{item.name}</span>
                                        <ChevronDown
                                            size={15}
                                            className={clsx(
                                                'transition-transform duration-200 shrink-0',
                                                isGroupOpen && 'rotate-180'
                                            )}
                                        />
                                    </button>

                                    {/* Children */}
                                    {isGroupOpen && (
                                        <div className="mt-0.5 ml-4 pl-3 border-l border-slate-800 space-y-0.5">
                                            {visibleChildren.map((child) => {
                                                if (child.comingSoon) {
                                                    return (
                                                        <div
                                                            key={child.name}
                                                            className="flex items-center gap-3 px-3 py-2 rounded-lg text-[14px] text-slate-600 cursor-not-allowed group"
                                                            title="Coming Soon"
                                                        >
                                                            <child.icon size={16} className="shrink-0" />
                                                            <span className="flex-1 truncate">{child.name}</span>
                                                            <span className="text-[10px] bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded-full">Soon</span>
                                                        </div>
                                                    );
                                                }
                                                return (
                                                    <NavLink
                                                        key={child.name}
                                                        to={child.href}
                                                        onClick={() => { if (window.innerWidth < 1024) setIsSidebarOpen(false); }}
                                                        className={({ isActive }) =>
                                                            clsx(
                                                                'flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-300 text-[14px]',
                                                                isActive
                                                                    ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-950/40 translate-x-1'
                                                                    : 'text-slate-400 hover:text-white hover:bg-slate-800 hover:translate-x-1'
                                                            )
                                                        }
                                                    >
                                                        <child.icon size={16} className="shrink-0" />
                                                        <span className="truncate">{child.name}</span>
                                                    </NavLink>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </nav>

                {/* Footer */}
                <div className="p-4 border-t border-white/5 bg-slate-900/40 backdrop-blur-md shrink-0">
                    <div className="flex items-center justify-between gap-3 px-2">
                        <div className="flex items-center gap-3 min-w-0">
                            <img
                                src={user.avatar}
                                alt={user.name}
                                className="w-9 h-9 rounded-full border border-slate-700/50 shrink-0 object-cover shadow-sm"
                            />
                            <div className="min-w-0">
                                <p className="text-sm font-bold text-white truncate leading-tight">{user.name}</p>
                                <p className="text-[10px] font-medium text-slate-400 capitalize truncate uppercase tracking-wider">
                                    {user.role}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            title="Sign Out"
                            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors shrink-0"
                        >
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* ── Main Content ── */}
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
                            {/* Desktop hamburger to toggle sidebar */}
                            <button
                                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                className="hidden lg:flex text-slate-400 hover:text-slate-600 transition-colors p-2 -ml-2 rounded-lg hover:bg-slate-50"
                            >
                                <Menu size={22} />
                            </button>
                            <h2 className="text-lg font-bold text-slate-800 hidden sm:block truncate">
                                Admin Dashboard
                            </h2>
                        </div>

                        <div className="flex items-center gap-4 ml-auto">
                            <button className="relative text-slate-500 hover:text-slate-700 transition-all p-2 rounded-lg hover:bg-slate-100">
                                <Bell size={20} />
                                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                            </button>
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

                    {/* Page Content */}
                    <main className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-slate-50/50">
                        <div className="max-w-[1600px] mx-auto">
                            <Outlet />
                        </div>
                    </main>
                </div>

                {/* Mobile Overlay */}
                {isSidebarOpen && (
                    <div
                        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[90] lg:hidden animate-in fade-in duration-300"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}
            </div>
        </div>
    );
}

export { };
