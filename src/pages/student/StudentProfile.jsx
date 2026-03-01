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
    Droplet,
    Heart,
    Backpack,
    PhoneCall
} from 'lucide-react';
import { storageService } from '../../services/storage';

export default function StudentProfile() {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

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
                { label: 'Admission No', value: profile.admissionNo, icon: Hash },
                { label: 'Class & Section', value: `${profile.className} - ${profile.section}`, icon: Users },
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
                        <div className="flex flex-wrap items-center gap-3 mb-2">
                            <span className="px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[10px] font-black font-mono text-indigo-300 uppercase tracking-widest border border-white/10">Active Student</span>
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter mb-2">{profile.name}</h1>
                        <p className="text-slate-400 font-bold tracking-wide uppercase text-xs">Student of {profile.className} • Section {profile.section}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

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
        </div>
    );
}
