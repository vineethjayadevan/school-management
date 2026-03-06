import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    PieChart,
    TrendingUp,
    LogOut,
    Menu,
    X,
    Wallet,
    Key,
    Users,
    ListTree,
    ArrowDownLeft,
    CheckCircle2,
    Calculator,
    Tags
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ChangePasswordModal from '../components/ChangePasswordModal';

export default function BoardLayout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
    const { logout, user } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { path: '/board/ledger', icon: LayoutDashboard, label: 'Cash Ledger' },
        { path: '/board/revenue-expense', icon: TrendingUp, label: 'Revenue & Expenses' },
        { path: '/board/receivables-payables', icon: ArrowDownLeft, label: 'Receivables & Payables' },
        { path: '/board/settlements', icon: CheckCircle2, label: 'Settlements' },
        { path: '/board/accounting', icon: Calculator, label: 'Accounting' },
        { path: '/board/categories', icon: Tags, label: 'Manage Categories' },
    ];

    return (
        <div className="h-[100dvh] bg-slate-50 flex overflow-hidden">
            <ChangePasswordModal
                isOpen={isChangePasswordOpen}
                onClose={() => setIsChangePasswordOpen(false)}
            />

            {/* Sidebar */}
            <aside
                className={`
                    fixed inset-y-0 left-0 z-50
                    w-64 bg-slate-900 text-white transition-transform duration-300 ease-in-out lg:sticky lg:top-0 lg:h-screen lg:translate-x-0
                    ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                `}
            >
                <div className="h-full flex flex-col">
                    <div className="p-6 border-b border-slate-800 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
                                <Wallet className="text-white" size={24} />
                            </div>
                            <div>
                                <h1 className="font-bold text-lg leading-tight tracking-tight">Board Portal</h1>
                                <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Finance</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsSidebarOpen(false)}
                            className="lg:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
                        <div className="flex items-center gap-3 p-3 bg-slate-800/40 rounded-xl border border-white/5">
                            <img
                                src={user?.avatar || "https://ui-avatars.com/api/?name=Board+Member"}
                                alt="Profile"
                                className="w-10 h-10 rounded-full border border-indigo-500/30 object-cover"
                            />
                            <div className="min-w-0">
                                <p className="text-sm font-bold text-white truncate">{user?.name}</p>
                                <p className="text-[10px] text-slate-400 font-medium truncate uppercase tracking-wider">{user?.role?.replace('_', ' ')}</p>
                            </div>
                        </div>

                        <nav className="space-y-1">
                            <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mb-2">Main Menu</p>
                            {navItems.map((item) => (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setIsSidebarOpen(false)}
                                    className={({ isActive }) => `
                                        flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
                                        ${isActive
                                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                                            : 'text-slate-400 hover:text-white hover:bg-white/5'}
                                    `}
                                >
                                    <item.icon size={18} />
                                    <span className="text-sm font-medium">{item.label}</span>
                                </NavLink>
                            ))}
                        </nav>
                    </div>

                    {/* Sidebar Footer */}
                    <div className="p-4 border-t border-slate-800 bg-slate-900/50 backdrop-blur-md shrink-0">
                        <button
                            onClick={() => setIsChangePasswordOpen(true)}
                            className="w-full flex items-center gap-3 px-3 py-2 text-slate-400 hover:bg-white/5 hover:text-white rounded-lg transition-colors text-sm font-medium"
                        >
                            <Key size={18} />
                            <span>Password</span>
                        </button>

                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-3 py-2 mt-1 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors text-sm font-bold"
                        >
                            <LogOut size={18} />
                            <span>Sign Out</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 relative h-full overflow-hidden">
                {/* Global Header */}
                <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-40 shrink-0 h-16 shadow-sm">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="lg:hidden text-slate-500 hover:text-slate-700 p-2 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                            <Menu size={24} />
                        </button>
                        <h2 className="text-lg font-bold text-slate-800 hidden sm:block">
                            Financial Ledger
                        </h2>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Status Label */}
                        <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full">
                            <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
                            <span className="text-[10px] font-bold text-indigo-700 uppercase">Board Analytics Active</span>
                        </div>

                        <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                            <div className="hidden md:block text-right">
                                <p className="text-sm font-bold text-slate-900 leading-tight">{user?.name}</p>
                                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-tight">Board Member</p>
                            </div>
                            <img
                                src={user?.avatar || "https://ui-avatars.com/api/?name=Board+Member"}
                                alt="Admin"
                                className="w-9 h-9 rounded-full border border-slate-200 shadow-sm transition-transform hover:scale-110 cursor-pointer object-cover"
                            />
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 px-3 py-1.5 ml-1 bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-lg transition-all border border-slate-200 hover:border-rose-100 group font-bold text-xs"
                            >
                                <LogOut size={14} className="group-hover:-translate-x-1 transition-transform" />
                                <span>Sign Out</span>
                            </button>
                        </div>
                    </div>
                </header>

                <main className="flex-1 p-6 md:p-8 overflow-y-auto custom-scrollbar bg-slate-50/50">
                    <div className="max-w-[1600px] mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>

            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[45] lg:hidden animate-in fade-in duration-300"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}
        </div>
    );
}
