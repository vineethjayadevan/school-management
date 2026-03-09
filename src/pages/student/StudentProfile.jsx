import clsx from 'clsx';
import { useState, useEffect } from 'react';
import {
    User,
    Mail,
    Phone,
    MapPin,
    Calendar,
    Hash,
    Users,
    ShieldCheck,
    Fingerprint,
    Info,
    Backpack,
    PhoneCall,
    CheckCircle,
    XCircle,
    Clock,
    Activity,
    Droplet,
    Heart
} from 'lucide-react';
import { storageService } from '../../services/storage';

export default function StudentProfile() {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [attendanceHistory, setAttendanceHistory] = useState(null);
    const [loadingAttendance, setLoadingAttendance] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const data = await storageService.student.getProfile();
                setProfile(data);
            } catch (error) {
                console.error("Failed to fetch student profile", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    useEffect(() => {
        if (activeTab === 'attendance' && !attendanceHistory && !loadingAttendance) {
            const fetchAttendance = async () => {
                setLoadingAttendance(true);
                try {
                    const data = await storageService.student.getAttendance();
                    setAttendanceHistory(data);
                } catch (error) {
                    console.error("Failed to fetch student attendance history", error);
                } finally {
                    setLoadingAttendance(false);
                }
            };
            fetchAttendance();
        }
    }, [activeTab, attendanceHistory, loadingAttendance]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <p className="text-slate-500 font-medium animate-pulse">Retrieving your profile data...</p>
            </div>
        );
    }

    if (!profile) return <div className="p-8 text-center text-rose-500 font-bold">Failed to load profile details.</div>;

    const sections = [
        {
            title: 'Personal Details',
            icon: Info,
            color: 'bg-indigo-50 text-indigo-600',
            fields: [
                { label: 'Date of Birth', value: profile.dob ? new Date(profile.dob).toLocaleDateString() : 'Not Provided', icon: Calendar },
                { label: 'Gender', value: profile.gender || 'Not Provided', icon: User },
                { label: 'Blood Group', value: profile.bloodGroup || 'Not Provided', icon: Droplet },
                { label: 'Identity No', value: profile.aadharNo || 'Not Provided', icon: Fingerprint },
            ]
        },
        {
            title: 'Academic Status',
            icon: Backpack,
            color: 'bg-emerald-50 text-emerald-600',
            fields: [
                { label: 'Application No', value: profile.applicationNo || 'N/A', icon: Hash },
                { label: 'Current Roll No', value: profile.rollNo || 'Pending', icon: ShieldCheck },
                { label: 'Academic Year', value: '2025-2026', icon: Calendar },
            ]
        },
        {
            title: 'Contact Information',
            icon: PhoneCall,
            color: 'bg-violet-50 text-violet-600',
            fields: [
                { label: 'Primary Email', value: profile.email || 'Not Provided', icon: Mail },
                { label: 'Emergency Contact', value: profile.primaryPhone, icon: Phone },
                { label: 'Nationality', value: profile.nationality || 'Indian', icon: Info },
            ]
        }
    ];

    return (
        <div className="max-w-7xl mx-auto pb-12 animate-in fade-in duration-500">

            {/* Header / Brand Area */}
            <div className="relative h-64 rounded-[3rem] overflow-hidden mb-12 shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900"></div>
                {/* Decorative blobs */}
                <div className="absolute -top-12 -left-12 w-64 h-64 bg-indigo-500 opacity-20 blur-[100px]"></div>
                <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-violet-500 opacity-20 blur-[100px]"></div>

                <div className="absolute bottom-0 left-0 w-full p-8 md:p-12 flex flex-col md:flex-row items-end gap-8">
                    <div className="relative group w-32 h-32 md:w-40 md:h-40 rounded-[2.5rem] overflow-hidden border-4 border-white/10 shadow-2xl transition-all duration-300">
                        {profile.photoUrl ? (
                            <img
                                src={profile.photoUrl}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                alt={profile.name}
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = '';
                                    e.target.classList.add('hidden');
                                    e.target.nextSibling.classList.remove('hidden');
                                }}
                            />
                        ) : null}
                        <div className={clsx(
                            "w-full h-full flex items-center justify-center font-black text-4xl md:text-5xl border-2 border-white/10",
                            profile.gender === 'Female' ? 'bg-pink-100 text-pink-600' : 'bg-indigo-100 text-indigo-600',
                            profile.photoUrl ? 'hidden' : ''
                        )}>
                            {profile.name?.charAt(0)}
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-emerald-500 p-2 rounded-xl shadow-lg border-2 border-slate-900 z-10">
                            <ShieldCheck size={20} className="text-white" />
                        </div>
                    </div>
                    <div className="flex-1 pb-2">
                        <div className="flex flex-wrap items-center gap-3 mb-3">
                            <span className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-black font-mono text-indigo-300 uppercase tracking-widest border border-white/10">Active Student</span>
                            <span className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-black font-mono text-emerald-300 uppercase tracking-widest border border-white/10">Adm No: {profile.admissionNo}</span>
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter mb-4">{profile.name}</h1>

                        <div className="flex flex-wrap items-center gap-x-8 gap-y-3 px-1">
                            <div className="flex items-center gap-2">
                                <Users size={16} className="text-indigo-400" />
                                <span className="text-slate-300 font-bold tracking-wide text-sm">{profile.className} {profile.section}</span>
                            </div>
                            {profile.classTeacherName && (
                                <div className="flex items-center gap-2 border-l border-white/20 pl-6">
                                    <User size={16} className="text-violet-400" />
                                    <span className="text-slate-300 font-bold tracking-wide text-sm">Class Teacher: {profile.classTeacherName}</span>
                                </div>
                            )}
                            {profile.classTeacherPhone && (
                                <div className="flex items-center gap-2">
                                    <Phone size={16} className="text-emerald-400" />
                                    <span className="text-slate-300 font-bold tracking-wide text-sm">{profile.classTeacherPhone}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex flex-wrap gap-4 mb-8">
                <button
                    onClick={() => setActiveTab('overview')}
                    className={clsx(
                        "px-6 py-3 rounded-2xl font-bold text-sm transition-all shadow-sm flex items-center gap-2",
                        activeTab === 'overview' ? "bg-indigo-600 text-white shadow-indigo-200" : "bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                    )}
                >
                    <Info size={18} />
                    Overview
                </button>
                <button
                    onClick={() => setActiveTab('attendance')}
                    className={clsx(
                        "px-6 py-3 rounded-2xl font-bold text-sm transition-all shadow-sm flex items-center gap-2",
                        activeTab === 'attendance' ? "bg-indigo-600 text-white shadow-indigo-200" : "bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                    )}
                >
                    <Activity size={18} />
                    Attendance History
                </button>
            </div>

            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

                    {/* Left Column - Detail Sections */}
                    <div className="lg:col-span-2 space-y-8">
                        {sections.map((section, idx) => (
                            <div key={idx} className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/40 border border-slate-200/60 overflow-hidden">
                                <div className="px-8 py-6 border-b border-slate-100 flex items-center gap-4 bg-slate-50/50">
                                    <div className={clsx("p-2.5 rounded-xl shadow-sm", section.color)}>
                                        <section.icon size={20} />
                                    </div>
                                    <h2 className="font-bold text-slate-900 tracking-tight text-lg">{section.title}</h2>
                                </div>
                                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {section.fields.map((field, fIdx) => (
                                        <div key={fIdx} className="flex items-start gap-4 group">
                                            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 group-hover:border-indigo-100 transition-all">
                                                <field.icon size={18} />
                                            </div>
                                            <div className="space-y-0.5">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{field.label}</p>
                                                <p className="text-sm font-bold text-slate-800 tracking-tight">{field.value}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {/* Address Section */}
                        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/40 border border-slate-200/60 overflow-hidden">
                            <div className="px-8 py-6 border-b border-slate-100 flex items-center gap-4 bg-slate-50/50">
                                <div className="p-2.5 rounded-xl shadow-sm bg-orange-50 text-orange-600">
                                    <MapPin size={20} />
                                </div>
                                <h2 className="font-bold text-slate-900 tracking-tight text-lg">Address Details</h2>
                            </div>
                            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-4">
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                        <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                                        Residential
                                    </p>
                                    <div className="p-5 rounded-2xl bg-orange-50/30 border border-orange-100 text-sm font-bold text-slate-700 leading-relaxed min-h-[100px]">
                                        {profile.residentialAddress ? (
                                            <>
                                                {profile.residentialAddress.houseNo}, {profile.residentialAddress.street}<br />
                                                {profile.residentialAddress.locality}<br />
                                                {profile.residentialAddress.city}, {profile.residentialAddress.state}<br />
                                                PIN: {profile.residentialAddress.pinCode}
                                            </>
                                        ) : (
                                            profile.address || 'Address information not available.'
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                        <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                                        Permanent
                                    </p>
                                    <div className="p-5 rounded-2xl bg-indigo-50/30 border border-indigo-100 text-sm font-bold text-slate-700 leading-relaxed min-h-[100px]">
                                        {profile.permanentAddress ? (
                                            <>
                                                {profile.permanentAddress.houseNo}, {profile.permanentAddress.street}<br />
                                                {profile.permanentAddress.locality}<br />
                                                {profile.permanentAddress.city}, {profile.permanentAddress.state}<br />
                                                PIN: {profile.permanentAddress.pinCode}
                                            </>
                                        ) : (
                                            profile.address || 'Address information not available.'
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Secondary Info */}
                    <div className="space-y-8">
                        {/* Family Card */}
                        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/40 border border-slate-200/60 overflow-hidden">
                            <div className="p-8 bg-gradient-to-br from-indigo-600 to-indigo-800 text-white">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                                        <Users size={24} />
                                    </div>
                                    <h3 className="font-black tracking-tight text-xl">Family Relation</h3>
                                </div>
                                <div className="space-y-6">
                                    <div className="p-4 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-md">
                                        <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-1">Father's Details</p>
                                        <p className="font-bold text-white tracking-tight">{profile.fatherName || 'Not Provided'}</p>
                                        {(profile.fatherMobile || profile.fatherEmail) && (
                                            <div className="mt-2 pt-2 border-t border-white/5 space-y-1">
                                                {profile.fatherMobile && <p className="text-[10px] text-white/60 flex items-center gap-1"><Phone size={10} /> {profile.fatherMobile}</p>}
                                                {profile.fatherEmail && <p className="text-[10px] text-white/60 flex items-center gap-1"><Mail size={10} /> {profile.fatherEmail}</p>}
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-4 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-md">
                                        <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-1">Mother's Details</p>
                                        <p className="font-bold text-white tracking-tight">{profile.motherName || 'Not Provided'}</p>
                                        {(profile.motherMobile || profile.motherEmail) && (
                                            <div className="mt-2 pt-2 border-t border-white/5 space-y-1">
                                                {profile.motherMobile && <p className="text-[10px] text-white/60 flex items-center gap-1"><Phone size={10} /> {profile.motherMobile}</p>}
                                                {profile.motherEmail && <p className="text-[10px] text-white/60 flex items-center gap-1"><Mail size={10} /> {profile.motherEmail}</p>}
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-4 rounded-2xl bg-white/10 border border-white/10 backdrop-blur-md">
                                        <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-1">Guardian Details</p>
                                        <p className="font-bold text-white tracking-tight">{profile.guardianName || profile.guardian || 'Not Provided'}</p>
                                        {(profile.guardianPhone || profile.emergencyContact?.phone) && (
                                            <div className="mt-2 pt-2 border-t border-white/5 space-y-1">
                                                {(profile.guardianPhone || profile.emergencyContact?.phone) && <p className="text-[10px] text-white/60 flex items-center gap-1"><Phone size={10} /> {profile.guardianPhone || profile.emergencyContact?.phone}</p>}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Health Card */}
                        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/40 border border-slate-200/60 p-8 space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center shadow-sm">
                                    <Heart size={24} />
                                </div>
                                <h3 className="font-black tracking-tight text-xl text-slate-900">Health Info</h3>
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center py-3 border-b border-slate-50">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Medical Condition</span>
                                    <span className={clsx("text-xs font-bold px-3 py-1 rounded-full", profile.hasMedicalCondition ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600')}>
                                        {profile.hasMedicalCondition ? 'Reported' : 'None Reported'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-3 border-b border-slate-50">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Learning Support</span>
                                    <span className={clsx("text-xs font-bold px-3 py-1 rounded-full", profile.hasLearningDisability ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600')}>
                                        {profile.hasLearningDisability ? 'Active' : 'Not Required'}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-3">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Allergies</span>
                                    <span className={clsx("text-xs font-bold px-3 py-1 rounded-full", profile.hasAllergy ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600')}>
                                        {profile.hasAllergy ? 'Reported' : 'None Reported'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'attendance' && (
                <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/40 border border-slate-200/60 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 rounded-xl shadow-sm bg-indigo-50 text-indigo-600">
                                <Calendar size={20} />
                            </div>
                            <div>
                                <h2 className="font-bold text-slate-900 tracking-tight text-lg">Attendance Log</h2>
                                <p className="text-xs font-medium text-slate-500">View your daily presence record</p>
                            </div>
                        </div>
                        {attendanceHistory?.stats && (
                            <div className="flex gap-4">
                                <div className="text-center px-4 py-1.5 bg-emerald-50 rounded-xl border border-emerald-100">
                                    <p className="text-[10px] font-bold text-emerald-600 uppercase">Present</p>
                                    <p className="font-black text-emerald-700 text-lg leading-none">{attendanceHistory.stats.present}</p>
                                </div>
                                <div className="text-center px-4 py-1.5 bg-rose-50 rounded-xl border border-rose-100">
                                    <p className="text-[10px] font-bold text-rose-600 uppercase">Absent</p>
                                    <p className="font-black text-rose-700 text-lg leading-none">{attendanceHistory.stats.absent}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-8">
                        {loadingAttendance ? (
                            <div className="flex items-center justify-center h-48">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                            </div>
                        ) : !attendanceHistory || !attendanceHistory.attendance || attendanceHistory.attendance.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
                                    <Calendar size={32} />
                                </div>
                                <h3 className="text-lg font-bold text-slate-800">No Records Found</h3>
                                <p className="text-slate-500 font-medium">There is no attendance data recorded yet.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-100">
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">Date</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">Status</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">Remarks</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {attendanceHistory.attendance.map((record) => (
                                            <tr key={record._id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <span className="text-sm font-bold text-slate-700 whitespace-nowrap">
                                                        {new Date(record.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2 whitespace-nowrap">
                                                        {record.status === 'Present' && <CheckCircle size={16} className="text-emerald-500" />}
                                                        {record.status === 'Absent' && <XCircle size={16} className="text-rose-500" />}
                                                        {record.status === 'Late' && <Clock size={16} className="text-amber-500" />}
                                                        {record.status === 'Half Day' && <Activity size={16} className="text-blue-500" />}

                                                        <span className={clsx(
                                                            "text-xs font-bold px-2.5 py-1 rounded-lg",
                                                            record.status === 'Present' && "bg-emerald-50 text-emerald-600 border border-emerald-100",
                                                            record.status === 'Absent' && "bg-rose-50 text-rose-600 border border-rose-100",
                                                            record.status === 'Late' && "bg-amber-50 text-amber-600 border border-amber-100",
                                                            record.status === 'Half Day' && "bg-blue-50 text-blue-600 border border-blue-100"
                                                        )}>
                                                            {record.status}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-slate-500 font-medium">
                                                        {record.remarks || '-'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
