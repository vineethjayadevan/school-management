import { useState, useEffect } from 'react';
import { storageService } from '../../services/storage';
import { User, Mail, Phone, Calendar, Briefcase, DollarSign, Clock } from 'lucide-react';

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
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                        <div className="flex flex-col items-center">
                            <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-3xl mb-4">
                                {profile.name.charAt(0)}
                            </div>
                            <h2 className="text-xl font-bold text-slate-900">{profile.name}</h2>
                            <p className="text-slate-500">{profile.role}</p>
                            <span className="mt-2 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                                Active
                            </span>
                        </div>

                        <div className="mt-8 space-y-4">
                            <div className="flex items-center gap-3 text-slate-600">
                                <Mail size={18} className="text-slate-400" />
                                <span className="text-sm">{profile.email}</span>
                            </div>
                            <div className="flex items-center gap-3 text-slate-600">
                                <Phone size={18} className="text-slate-400" />
                                <span className="text-sm">{profile.phone}</span>
                            </div>
                            <div className="flex items-center gap-3 text-slate-600">
                                <Briefcase size={18} className="text-slate-400" />
                                <span className="text-sm">{profile.qualification || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-3 text-slate-600">
                                <Calendar size={18} className="text-slate-400" />
                                <span className="text-sm">Joined: {new Date(profile.joiningDate).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                            <DollarSign size={18} className="text-emerald-600" />
                            Current Salary
                        </h3>
                        <div className="text-3xl font-bold text-slate-900">₹{profile.salary?.toLocaleString()}</div>
                        <p className="text-xs text-slate-500 mt-1">Base Monthly Salary</p>
                    </div>
                </div>

                {/* Salary History */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-6 border-b border-slate-100">
                            <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                                <Clock size={20} className="text-indigo-500" />
                                Salary Transaction History
                            </h2>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-slate-500 text-sm">
                                    <tr>
                                        <th className="px-6 py-3 font-medium">Month</th>
                                        <th className="px-6 py-3 font-medium">Payment Date</th>
                                        <th className="px-6 py-3 font-medium">Mode</th>
                                        <th className="px-6 py-3 font-medium">Status</th>
                                        <th className="px-6 py-3 font-medium text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {salaryHistory.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-8 text-center text-slate-500">
                                                No salary records found.
                                            </td>
                                        </tr>
                                    ) : (
                                        salaryHistory.map((record) => (
                                            <tr key={record._id} className="hover:bg-slate-50">
                                                <td className="px-6 py-4 font-mono text-slate-600 text-sm">
                                                    {record.month}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-600">
                                                    {record.paymentDate ? new Date(record.paymentDate).toLocaleDateString() : '-'}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-600">
                                                    {record.paymentMode || '-'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${record.status === 'Paid'
                                                            ? 'bg-emerald-100 text-emerald-700'
                                                            : 'bg-yellow-100 text-yellow-700'
                                                        }`}>
                                                        {record.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right font-medium text-slate-900">
                                                    ₹{record.amount.toLocaleString()}
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
