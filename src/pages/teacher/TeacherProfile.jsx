import { useState, useEffect } from 'react';
import { storageService } from '../../services/storage';
import {
    User, Mail, Phone, Calendar, Briefcase, DollarSign, Clock, Download,
    Award, Shield, MapPin, BookOpen, Users, Star, CreditCard, Heart, CheckCircle
} from 'lucide-react';
import { generateSalaryReceipt } from '../../utils/salaryReceiptGenerator';

function InfoRow({ icon: Icon, label, value, iconColor = 'text-slate-400' }) {
    if (!value) return null;
    return (
        <div className="flex items-start gap-3 text-slate-600">
            <div className="p-2 bg-slate-50 rounded-lg mt-0.5 flex-shrink-0">
                <Icon size={15} className={iconColor} />
            </div>
            <div className="flex flex-col min-w-0">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{label}</span>
                <span className="text-sm font-medium text-slate-800 break-words">{value}</span>
            </div>
        </div>
    );
}

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
                console.error('Failed to fetch profile data', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!profile) return <div className="text-center p-8 text-slate-500">Profile not linked. Please contact admin.</div>;

    const initials = profile.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
                <p className="text-slate-500 text-sm mt-0.5">Your complete staff profile and employment details</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* LEFT COLUMN */}
                <div className="lg:col-span-1 space-y-5">
                    {/* Hero Card */}
                    <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 rounded-2xl p-6 text-white relative overflow-hidden shadow-lg shadow-indigo-100">
                        <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/5 rounded-full" />
                        <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/5 rounded-full" />
                        <div className="relative flex flex-col items-center text-center">
                            {profile.photoUrl ? (
                                <img
                                    src={profile.photoUrl}
                                    alt={profile.name}
                                    className="w-24 h-24 rounded-2xl object-cover border-3 border-white/30 shadow-lg mb-4"
                                />
                            ) : (
                                <div className="w-24 h-24 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-3xl font-bold mb-4 border border-white/20">
                                    {initials}
                                </div>
                            )}
                            <h2 className="text-xl font-bold">{profile.name}</h2>
                            <p className="text-indigo-200 text-sm font-medium mt-0.5">{profile.subcategory || profile.role}</p>
                            <p className="text-indigo-300 text-xs font-mono mt-1">{profile.employeeId}</p>
                            <span className={`mt-3 px-3 py-1 rounded-full text-xs font-semibold ${profile.status === 'Active' ? 'bg-emerald-400/20 text-emerald-200 border border-emerald-400/30' : 'bg-red-400/20 text-red-200'}`}>
                                ● {profile.status || 'Active'}
                            </span>
                        </div>
                    </div>

                    {/* Contact & Credentials */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-50 pb-2">Contact & Credentials</h3>
                        <InfoRow icon={Shield} label="Portal Username" value={profile.username} iconColor="text-indigo-500" />
                        <InfoRow icon={Mail} label="Email" value={profile.email || 'Not set'} iconColor="text-blue-400" />
                        <InfoRow icon={Phone} label="Phone" value={profile.phone} iconColor="text-emerald-400" />
                        <InfoRow icon={MapPin} label="Address" value={profile.address} iconColor="text-rose-400" />
                    </div>

                    {/* Employment */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-50 pb-2">Employment</h3>
                        <InfoRow icon={Briefcase} label="Category" value={profile.category} iconColor="text-amber-500" />
                        <InfoRow icon={Award} label="Designation / Role" value={profile.subcategory || profile.role} iconColor="text-purple-500" />
                        <InfoRow icon={Award} label="Qualification" value={profile.qualification} iconColor="text-sky-400" />
                        <InfoRow icon={Calendar} label="Joining Date" value={profile.joiningDate ? new Date(profile.joiningDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : null} iconColor="text-slate-400" />
                        <InfoRow icon={CreditCard} label="Payment Mode" value={profile.paymentMode} iconColor="text-emerald-500" />
                        {profile.isMarried && <InfoRow icon={Heart} label="Spouse" value={profile.spouseName} iconColor="text-pink-400" />}
                    </div>
                </div>

                {/* RIGHT COLUMN */}
                <div className="lg:col-span-2 space-y-5">
                    {/* Class Incharge */}
                    {profile.classIncharge && profile.classIncharge.length > 0 && (
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="px-5 py-4 border-b border-slate-50 flex items-center gap-2">
                                <div className="p-1.5 bg-amber-50 rounded-lg"><Star size={16} className="text-amber-500" /></div>
                                <h2 className="font-semibold text-slate-800">Class Incharge</h2>
                                <span className="ml-auto text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">{profile.classIncharge.length} Class{profile.classIncharge.length > 1 ? 'es' : ''}</span>
                            </div>
                            <div className="p-5 flex flex-wrap gap-3">
                                {profile.classIncharge.map((c, i) => (
                                    <div key={i} className="px-4 py-2.5 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl flex items-center gap-2">
                                        <Users size={14} className="text-amber-600" />
                                        <span className="text-sm font-semibold text-amber-800">Class {c.className} – {c.section}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Subjects Assigned (from staff profile) */}
                    {profile.subjects && profile.subjects.length > 0 && (
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="px-5 py-4 border-b border-slate-50 flex items-center gap-2">
                                <div className="p-1.5 bg-indigo-50 rounded-lg"><BookOpen size={16} className="text-indigo-500" /></div>
                                <h2 className="font-semibold text-slate-800">Subjects Assigned</h2>
                                <span className="ml-auto text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">{profile.subjects.length} Subject{profile.subjects.length > 1 ? 's' : ''}</span>
                            </div>
                            <div className="p-5 flex flex-wrap gap-2">
                                {profile.subjects.map((sub, i) => (
                                    <span key={i} className="px-3 py-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm font-medium rounded-lg flex items-center gap-1.5">
                                        <CheckCircle size={12} className="text-indigo-400" />
                                        {sub.name || sub}
                                        {sub.code && <span className="text-indigo-400 text-xs">({sub.code})</span>}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Salary History */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-50 flex items-center gap-2">
                            <div className="p-1.5 bg-emerald-50 rounded-lg"><Clock size={16} className="text-emerald-500" /></div>
                            <h2 className="font-semibold text-slate-800">Salary History</h2>
                        </div>

                        {salaryHistory.length === 0 ? (
                            <div className="p-8 text-center">
                                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <DollarSign size={20} className="text-slate-300" />
                                </div>
                                <p className="text-slate-400 text-sm">No salary transactions yet.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider font-bold">
                                        <tr>
                                            <th className="px-5 py-3 border-b border-slate-100">Month</th>
                                            <th className="px-5 py-3 border-b border-slate-100">Date</th>
                                            <th className="px-5 py-3 border-b border-slate-100">Mode</th>
                                            <th className="px-5 py-3 border-b border-slate-100">Status</th>
                                            <th className="px-5 py-3 border-b border-slate-100">Amount</th>
                                            <th className="px-5 py-3 border-b border-slate-100 text-right">Receipt</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {salaryHistory.map((record) => (
                                            <tr key={record._id} className="hover:bg-slate-50/70 transition-colors">
                                                <td className="px-5 py-3.5 font-semibold text-slate-700 text-sm">{record.month}</td>
                                                <td className="px-5 py-3.5 text-sm text-slate-500">{record.paymentDate ? new Date(record.paymentDate).toLocaleDateString() : '—'}</td>
                                                <td className="px-5 py-3.5 text-sm text-slate-500">{record.paymentMode || '—'}</td>
                                                <td className="px-5 py-3.5">
                                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${record.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                                                        {record.status}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5 font-bold text-slate-900">₹{record.amount?.toLocaleString('en-IN')}</td>
                                                <td className="px-5 py-3.5 text-right">
                                                    {record.status === 'Paid' ? (
                                                        <button
                                                            onClick={() => generateSalaryReceipt(profile, record)}
                                                            className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 font-bold text-xs bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg transition-colors"
                                                        >
                                                            <Download size={13} /> Receipt
                                                        </button>
                                                    ) : <span className="text-slate-300">—</span>}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
