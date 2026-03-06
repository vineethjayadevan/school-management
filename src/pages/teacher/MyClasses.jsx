import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { storageService } from '../../services/storage';
import { BookOpen } from 'lucide-react';

export default function MyClasses() {
    const navigate = useNavigate();
    const [myClasses, setMyClasses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchClasses = async () => {
            try {
                const classesData = await storageService.teacher.getClasses();
                setMyClasses(classesData);
            } catch (error) {
                console.error("Failed to fetch classes", error);
            } finally {
                setLoading(false);
            }
        };

        fetchClasses();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-slate-800">My Classes</h1>
            <p className="text-slate-500">View and manage your assigned classes.</p>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                    <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                        <BookOpen size={20} className="text-indigo-500" />
                        Assigned Classes
                    </h2>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {myClasses.length === 0 ? (
                        <div className="col-span-full text-center py-8 text-slate-400">No classes assigned.</div>
                    ) : (
                        myClasses.map((cls) => (
                            <div
                                key={`${cls.name}-${cls.section}`}
                                onClick={() => navigate(`/teacher/classes/${cls.name}/${cls.section}`, { state: { role: cls.role } })}
                                className="p-4 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 cursor-pointer transition-all group"
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-slate-800 text-lg group-hover:text-indigo-700">Class {cls.name}</h3>
                                        <p className="text-slate-500">Section {cls.section}</p>
                                    </div>
                                    <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded-full">
                                        {cls.role}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
