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
    Users
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
        { path: '/board/dashboard', icon: LayoutDashboard, label: 'Overview' },
        { path: '/board/expenses', icon: PieChart, label: 'Expenses' },
        { path: '/board/income', icon: TrendingUp, label: 'Income & Funding' },
        { path: '/board/cashflow', icon: Users, label: 'Cashflow' },
        { path: '/board/accounting', icon: PieChart, label: 'Accounting' },
    ];

    return (
        <div className="min-h-screen bg-slate-50 flex">
            <ChangePasswordModal
                isOpen={isChangePasswordOpen}
                onClose={() => setIsChangePasswordOpen(false)}
            />

            {/* Sidebar */}
            <aside
                className={`
                    fixed inset-y-0 left-0 z-40
                    w-64 bg-slate-900 text-white transition-transform duration-300 ease-in-out
                    ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                `}
            >
                <div className="h-full flex flex-col">
                    <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                                <Wallet className="text-white" size={24} />
                            </div>
                            <div>
                                <h1 className="font-bold text-lg leading-tight">Board Portal</h1>
                                <p className="text-xs text-slate-400">Financial Management</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsSidebarOpen(false)}
                            className="md:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-4">
                        <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl mb-6">
                            <img
                                src={user?.avatar || "https://ui-avatars.com/api/?name=Board+Member"}
                                alt="Profile"
                                className="w-10 h-10 rounded-full border-2 border-indigo-500"
                            />
                            <div className="overflow-hidden">
                                <p className="font-medium truncate">{user?.name}</p>
                                <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                            </div>
                        </div>

                        <nav className="space-y-1">
                            {navItems.map((item) => (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setIsSidebarOpen(false)}
                                    className={({ isActive }) => `
                                        flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors
                                        ${isActive
                                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                                            : 'text-slate-400 hover:text-white hover:bg-slate-800'}
                                    `}
                                >
                                    <item.icon size={20} />
                                    <span className="font-medium">{item.label}</span>
                                </NavLink>
                            ))}
                        </nav>
                    </div>

                    <div className="mt-auto p-4 border-t border-slate-800 space-y-2">
                        <button
                            onClick={() => setIsChangePasswordOpen(true)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg transition-colors"
                        >
                            <Key size={20} />
                            <span className="font-medium">Change Password</span>
                        </button>

                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                            <LogOut size={20} />
                            <span className="font-medium">Sign Out</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            {/* Main Content */}
            <main className="flex-1 min-w-0 overflow-auto md:ml-64 bg-slate-50 min-h-screen">
                {/* Mobile Header */}
                <header className="md:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between sticky top-0 z-30">
                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-slate-600">
                        {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                    <span className="font-bold text-slate-800">Board Portal</span>
                    <div className="w-8" />
                </header>

                <div className="p-4 md:p-8 max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>

            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}
        </div>
    );
}
