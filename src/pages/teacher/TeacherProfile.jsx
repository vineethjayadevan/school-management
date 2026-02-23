import { useState, useEffect } from 'react';
import { storageService } from '../../services/storage';
import { User, Mail, Phone, Calendar, Briefcase, DollarSign, Clock, Download, Award, Shield } from 'lucide-react';
import { generateSalaryReceipt } from '../../utils/salaryReceiptGenerator';

export default function TeacherProfile() {
    const [profile, setProfile] = useState(null);
    const [salaryHistory, setSalaryHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [profileData, salaryData] = await Promise.all([
                    storageService.teacher.getProfile(),
                    storageService.teacher.getSalaryHistory()
                ]);
                setProfile(profileData);
                setSalaryHistory(salaryData);
            } catch (error) {
                console.error("Failed to fetch profile data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!profile) return <div className="text-center p-8 text-slate-500">Profile not found.</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-800">My Profile</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Personal Information */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 -mr-12 -mt-12 rounded-full"></div>
                        <div className="flex flex-col items-center relative">
                            <div className="w-24 h-24 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-3xl mb-4 shadow-lg shadow-indigo-100 rotate-3">
                                <span className="-rotate-3">{profile.name.charAt(0)}</span>
                            </div>
                            <h2 className="text-xl font-bold text-slate-900">{profile.name}</h2>
                            <p className="text-indigo-600 font-bold text-sm mb-2">{profile.employeeId || 'ID-PENDING'}</p>
                            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium border border-emerald-200">
                                {profile.status || 'Active'}
                            </span>
                        </div>

                        <div className="mt-8 space-y-4 pt-6 border-t border-slate-50">
                            {/* NEW: Username Row */}
                            <div className="flex items-center gap-3 text-slate-600">
                                <div className="p-2 bg-slate-50 rounded-lg"><Shield size={16} className="text-indigo-500" /></div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Username / Portal Login</span>
                                    <span className="text-sm font-bold text-indigo-700">{profile.username || 'Not Found'}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 text-slate-600">
                                <div className="p-2 bg-slate-50 rounded-lg"><Mail size={16} className="text-slate-400" /></div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Email Address</span>
                                    <span className="text-sm font-medium">{profile.email}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 text-slate-600">
                                <div className="p-2 bg-slate-50 rounded-lg"><Phone size={16} className="text-slate-400" /></div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Phone Number</span>
                                    <span className="text-sm font-medium">{profile.phone}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 text-slate-600">
                                <div className="p-2 bg-slate-50 rounded-lg"><Award size={16} className="text-slate-400" /></div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Qualification</span>
                                    <span className="text-sm font-medium">{profile.qualification || 'N/A'}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 text-slate-600">
                                <div className="p-2 bg-slate-50 rounded-lg"><Briefcase size={16} className="text-slate-400" /></div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Role & Category</span>
                                    <span className="text-sm font-medium">{profile.role} • {profile.category}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 text-slate-600">
                                <div className="p-2 bg-slate-50 rounded-lg"><Calendar size={16} className="text-slate-400" /></div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Join Date</span>
                                    <span className="text-sm font-medium">{new Date(profile.joiningDate).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Salary History */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                            <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                                <Clock size={20} className="text-indigo-500" />
                                Salary Transaction History
                            </h2>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-white text-slate-500 text-[10px] uppercase tracking-wider font-bold">
                                    <tr>
                                        <th className="px-6 py-4 border-b border-slate-100">Month</th>
                                        <th className="px-6 py-4 border-b border-slate-100">Payment Date</th>
                                        <th className="px-6 py-4 border-b border-slate-100">Mode</th>
                                        <th className="px-6 py-4 border-b border-slate-100">Status</th>
                                        <th className="px-6 py-4 border-b border-slate-100">Amount</th>
                                        <th className="px-6 py-4 border-b border-slate-100 text-right">Receipt</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {salaryHistory.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-12 text-center">
                                                <div className="flex flex-col items-center">
                                                    <div className="p-3 bg-slate-50 rounded-full mb-2">
                                                        <Clock size={24} className="text-slate-300" />
                                                    </div>
                                                    <p className="text-slate-400 text-sm">No transactions available yet.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        salaryHistory.map((record) => (
                                            <tr key={record._id} className="hover:bg-slate-50 group transition-colors">
                                                <td className="px-6 py-4 font-semibold text-slate-700 text-sm">
                                                    {record.month}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-500">
                                                    {record.paymentDate ? new Date(record.paymentDate).toLocaleDateString() : '-'}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-500 italic">
                                                    {record.paymentMode || '-'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight border ${record.status === 'Paid'
                                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                            : 'bg-amber-50 text-amber-700 border-amber-100'
                                                        }`}>
                                                        {record.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 font-bold text-slate-900">
                                                    ₹{record.amount.toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {record.status === 'Paid' ? (
                                                        <button
                                                            onClick={() => generateSalaryReceipt(profile, record)}
                                                            className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 font-bold text-xs bg-indigo-50 px-2 py-1 rounded-lg transition-colors"
                                                            title="Download Salary Receipt"
                                                        >
                                                            <Download size={14} />
                                                            <span>Receipt</span>
                                                        </button>
                                                    ) : (
                                                        <span className="text-slate-300">-</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
