import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Crown, GraduationCap, Users, ArrowRight, BookOpen } from 'lucide-react';
import TopBanner from '../../components/common/TopBanner';

const portals = [
    {
        id: 'student',
        title: 'Student Portal',
        description: 'Access classes, exams & results',
        icon: GraduationCap,
        color: 'from-blue-500 to-indigo-600',
        bgLight: 'bg-blue-50',
        iconColor: 'text-blue-600',
        role: 'student'
    },
    {
        id: 'teacher',
        title: 'Teacher Portal',
        description: 'Manage attendance & academics',
        icon: Users,
        color: 'from-emerald-500 to-teal-600',
        bgLight: 'bg-emerald-50',
        iconColor: 'text-emerald-600',
        role: 'teacher'
    },
    {
        id: 'admin',
        title: 'Admin Portal',
        description: 'Manage school operations',
        icon: Shield,
        color: 'from-purple-500 to-pink-600',
        bgLight: 'bg-purple-50',
        iconColor: 'text-purple-600',
        role: 'admin'
    },
    {
        id: 'board',
        title: 'Board Member',
        description: 'Financial & accounting overview',
        icon: Crown,
        color: 'from-amber-500 to-orange-600',
        bgLight: 'bg-amber-50',
        iconColor: 'text-amber-600',
        role: 'board_member'
    }
];

export default function PortalSelection() {
    const navigate = useNavigate();

    const handleSelect = (role) => {
        navigate('/login', { state: { role } });
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-[40vh] bg-gradient-to-br from-indigo-600 to-violet-700 -z-10 transform origin-top-left -skew-y-6"></div>

            <TopBanner />

            <div className="flex-1 flex flex-col items-center pt-8 px-4 pb-12 w-full max-w-lg mx-auto">
                {/* Logo and Welcome Area */}
                <div className="w-full text-center space-y-4 mb-8">
                    <div className="bg-white p-3 rounded-2xl shadow-xl shadow-indigo-900/10 inline-block mb-2">
                        <img
                            src="/images/logo3.jpeg"
                            alt="Stem Global Logo"
                            className="h-16 w-auto object-contain rounded-xl"
                        />
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Welcome Back</h1>
                    <p className="text-indigo-100 font-medium pb-4">Select your portal to continue</p>
                </div>

                {/* Portals Grid */}
                <div className="w-full mt-4 space-y-4 z-10">
                    {portals.map((portal) => {
                        const Icon = portal.icon;
                        return (
                            <button
                                key={portal.id}
                                onClick={() => handleSelect(portal.role)}
                                className="w-full bg-white rounded-2xl p-4 shadow-lg shadow-indigo-100/50 border border-slate-100/50 flex items-center gap-4 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group text-left relative overflow-hidden"
                            >
                                {/* Decorative gradient hover background */}
                                <div className={`absolute inset-0 bg-gradient-to-r ${portal.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>

                                <div className={`w-14 h-14 rounded-2xl ${portal.bgLight} flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform duration-300`}>
                                    <Icon size={28} className={portal.iconColor} strokeWidth={2.5} />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <h3 className="text-lg font-bold text-slate-900 leading-tight group-hover:text-indigo-700 transition-colors">
                                        {portal.title}
                                    </h3>
                                    <p className="text-sm text-slate-500 mt-0.5 truncate pr-2">
                                        {portal.description}
                                    </p>
                                </div>

                                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors shrink-0">
                                    <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Footer Notes */}
                <div className="mt-auto pt-10 text-center space-y-2 relative z-10 w-full">
                    <div className="flex items-center justify-center gap-2 text-slate-400 text-sm">
                        <BookOpen size={16} />
                        <span>STEM Global Public School</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
