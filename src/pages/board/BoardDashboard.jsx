import { useState, useEffect } from 'react';
import {
    DollarSign,
    TrendingDown,
    TrendingUp,
    CreditCard,
    AlertCircle
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export default function BoardDashboard() {
    const { user } = useAuth();
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchSummary = async () => {
            try {
                // api interceptor handles token
                const { data } = await api.get('/finance/summary');
                setSummary(data);
            } catch (err) {
                setError('Failed to load financial data');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchSummary();
    }, []);

    if (loading) return <div className="p-8 text-center text-slate-500">Loading financial data...</div>;
    if (error) return <div className="p-8 text-center text-red-500 flex items-center justify-center gap-2"><AlertCircle /> {error}</div>;

    const cards = [
        {
            title: 'Total Income',
            value: `₹${summary?.totalIncome?.toLocaleString() || 0}`,
            subtext: `Fees: ₹${summary?.totalFeeIncome?.toLocaleString()} | Other: ₹${summary?.totalOtherIncome?.toLocaleString()}`,
            icon: TrendingUp,
            color: 'bg-emerald-500',
            textColor: 'text-emerald-500'
        },
        {
            title: 'Total Expenses',
            value: `₹${summary?.totalExpenses?.toLocaleString() || 0}`,
            subtext: 'Operational & Capital',
            icon: TrendingDown,
            color: 'bg-rose-500',
            textColor: 'text-rose-500'
        },
        {
            title: 'Net Balance',
            value: `₹${summary?.netBalance?.toLocaleString() || 0}`,
            subtext: 'Available Funds',
            icon: DollarSign,
            color: 'bg-indigo-500',
            textColor: 'text-indigo-500'
        }
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Financial Overview</h1>
                <p className="text-slate-500">Welcome, {user?.name}. Here's the latest financial summary.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                {cards.map((card, index) => (
                    <div key={index} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-all">
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`p-3 rounded-xl ${card.color} bg-opacity-10 ${card.textColor}`}>
                                    <card.icon size={24} />
                                </div>
                                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${card.color} bg-opacity-10 ${card.textColor}`}>
                                    LIVE
                                </span>
                            </div>
                            <h3 className="text-slate-500 font-medium mb-1">{card.title}</h3>
                            <p className="text-3xl font-bold text-slate-900 mb-2">{card.value}</p>
                            <p className="text-xs text-slate-400">{card.subtext}</p>
                        </div>
                        <div className={`absolute -right-6 -bottom-6 w-32 h-32 rounded-full ${card.color} opacity-5 group-hover:scale-110 transition-transform`} />
                    </div>
                ))}
            </div>

            {/* Placeholder for Recent Transactions or Charts could go here */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 text-center">
                <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <CreditCard className="text-slate-400" size={32} />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">No Recent Transactions</h3>
                <p className="text-slate-500">Expenses and detailed records will appear here.</p>
            </div>
        </div>
    );
}
