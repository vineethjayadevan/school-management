import { GraduationCap } from 'lucide-react';

export default function TopBanner() {
    return (
        <div className="bg-slate-900 text-white px-6 py-2 flex items-center gap-3 border-b border-slate-800 shadow-sm z-50 relative">
            <div className="bg-white/10 p-1.5 rounded-lg text-indigo-400">
                <GraduationCap size={20} />
            </div>
            <span className="font-bold text-lg tracking-wide bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                STEM Global Public School
            </span>
        </div>
    );
}
