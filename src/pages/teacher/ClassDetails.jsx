import { useState, useEffect } from 'react';
import { storageService } from '../../services/storage';
import { ArrowLeft, Search, Eye, Users, FileText, ClipboardList } from 'lucide-react';
import StudentModal from '../../components/students/StudentModal';
import { useParams as useParamsRouter, useNavigate as useNavigateRouter, useLocation } from 'react-router-dom';

export default function ClassDetails() {
    const navigate = useNavigateRouter();
    const location = useLocation();
    const { className, sectionName } = useParamsRouter();
    const isClassTeacher = location.state?.role === 'Class Teacher';

    const [activeTab, setActiveTab] = useState('students');
    const [students, setStudents] = useState([]);
    const [marksData, setMarksData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStudentId, setSelectedStudentId] = useState(null);

    useEffect(() => {
        if (activeTab === 'students') {
            fetchStudents();
        } else if (activeTab === 'marks') {
            fetchMarks();
        }
    }, [className, sectionName, activeTab]);

    const fetchStudents = async () => {
        setLoading(true);
        try {
            const data = await storageService.teacher.getClassStudents(className, sectionName);
            setStudents(data);
        } catch (error) {
            console.error("Failed to fetch students", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMarks = async () => {
        setLoading(true);
        try {
            const data = await storageService.teacher.getClassMarks(className, sectionName);
            setMarksData(data);
        } catch (error) {
            console.error("Failed to fetch marks", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredStudents = students.filter(student =>
        (student.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (student.rollNo && student.rollNo.toString().includes(searchTerm)) ||
        (student.admissionNo && student.admissionNo.toLowerCase().includes(searchTerm.toLowerCase()))
    ).sort((a, b) => {
        return String(a.rollNo || '').localeCompare(String(b.rollNo || ''), undefined, { numeric: true, sensitivity: 'base' });
    });

    return (
        <div className="space-y-6 pb-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Class {className} - {sectionName}</h1>
                        <p className="text-slate-500 text-sm">
                            {activeTab === 'students' ? 'Full student directory and fee status' : 'Consolidated exam marks report'}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-sm font-bold text-slate-400 bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm">
                    <Users size={16} />
                    <span>Total Students: {students.length || marksData?.students?.length || 0}</span>
                </div>
            </div>

            {/* Tabs */}
            {isClassTeacher && (
                <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl w-fit">
                    <button
                        onClick={() => setActiveTab('students')}
                        className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'students' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        <Users size={18} />
                        Students
                    </button>
                    <button
                        onClick={() => setActiveTab('marks')}
                        className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'marks' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        <ClipboardList size={18} />
                        Marks Report
                    </button>
                </div>
            )}

            {activeTab === 'students' ? (
                <>
                    {/* Controls */}
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row items-center gap-4">
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search by name, roll no or admission no..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                            />
                        </div>
                    </div>

                    {/* Table Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 text-slate-600 text-[10px] font-black uppercase tracking-widest">
                                        <th className="px-6 py-4 border-b border-slate-100">Student Identity</th>
                                        <th className="px-6 py-4 border-b border-slate-100">Academic Info</th>
                                        <th className="px-6 py-4 border-b border-slate-100">Contact Details</th>
                                        <th className="px-6 py-4 border-b border-slate-100 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loading ? (
                                        <tr>
                                            <td colSpan="4" className="px-6 py-12 text-center text-slate-400">
                                                <div className="flex flex-col items-center">
                                                    <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                                                    <p className="text-sm">Fetching student records...</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : filteredStudents.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" className="px-6 py-12 text-center text-slate-400 italic">
                                                No students found.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredStudents.map((student) => (
                                            <tr key={student._id} className="hover:bg-slate-50/50 transition-colors group">
                                                {/* Identity */}
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="relative">
                                                            {student.photoUrl ? (
                                                                <img
                                                                    src={student.photoUrl}
                                                                    alt={student.name}
                                                                    className="w-10 h-10 rounded-xl object-cover border border-slate-200 shadow-sm"
                                                                    onError={(e) => {
                                                                        e.target.style.display = 'none';
                                                                        e.target.nextSibling.style.display = 'flex';
                                                                    }}
                                                                />
                                                            ) : null}
                                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${student.gender === 'Female' ? 'bg-pink-100 text-pink-600' : 'bg-blue-100 text-blue-600'} ${student.photoUrl ? 'hidden' : ''}`}>
                                                                {student.name.charAt(0)}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-slate-900 text-sm">{student.name}</p>
                                                            <p className="text-[10px] font-black text-slate-400 font-mono uppercase">{student.admissionNo}</p>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Academic */}
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-slate-700">{className} - {sectionName}</span>
                                                        <span className="text-[10px] font-black text-indigo-500">Roll No: {student.rollNo || '-'}</span>
                                                    </div>
                                                </td>

                                                {/* Contact */}
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-slate-800">{student.guardian}</span>
                                                        <span className="text-[10px] font-medium text-slate-400 font-mono">{student.primaryPhone || 'N/A'}</span>
                                                    </div>
                                                </td>

                                                {/* Action */}
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => setSelectedStudentId(student._id)}
                                                        className="p-2 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-xl transition-all"
                                                        title="View Profile"
                                                    >
                                                        <Eye size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            ) : (
                <div className="space-y-6 animate-in fade-in duration-300">
                    {loading ? (
                        <div className="bg-white rounded-2xl p-12 shadow-sm border border-slate-100 text-center text-slate-400">
                            <div className="flex flex-col items-center">
                                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                                <p className="text-sm">Fetching consolidated marks...</p>
                            </div>
                        </div>
                    ) : !marksData || marksData.categories.length === 0 ? (
                        <div className="bg-white rounded-2xl p-12 shadow-sm border border-slate-100 text-center">
                            <FileText size={48} className="mx-auto text-slate-200 mb-4" />
                            <p className="text-slate-500 font-medium">No exam results found for this class.</p>
                            <p className="text-slate-400 text-sm mt-1">Results will appear here once exams are graded.</p>
                        </div>
                    ) : (
                        marksData.categories.map((category) => (
                            <div key={category._id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                                <div className="p-4 bg-slate-50 border-b border-slate-100">
                                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                        <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                                        {category.name}
                                    </h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50/50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                <th className="px-6 py-4 border-b border-slate-100 w-16 text-center">Roll</th>
                                                <th className="px-6 py-4 border-b border-slate-100">Student Name</th>
                                                {category.subjects.map(sub => (
                                                    <th key={sub.scheduleId} className="px-4 py-4 border-b border-slate-100 border-l border-slate-100 text-center min-w-[100px]">
                                                        <div className="truncate" title={sub.subjectName}>{sub.subjectName}</div>
                                                        <div className="text-[8px] text-slate-300 font-mono mt-0.5">Max: {sub.maxMarks}</div>
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {marksData.students.map((student) => (
                                                <tr key={student._id} className="hover:bg-slate-50/30 transition-colors">
                                                    <td className="px-6 py-4 text-center text-xs font-bold text-slate-400">{student.rollNo || '-'}</td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm font-bold text-slate-800">{student.name}</div>
                                                        <div className="text-[10px] text-slate-400 font-mono">{student.admissionNo}</div>
                                                    </td>
                                                    {category.subjects.map(sub => {
                                                        const m = sub.marks[student._id];
                                                        const isFail = m && m.marksObtained < sub.passingMarks;
                                                        return (
                                                            <td key={sub.scheduleId} className="px-4 py-4 border-l border-slate-100 text-center">
                                                                {m ? (
                                                                    <div className="flex flex-col items-center">
                                                                        <span className={`text-sm font-black ${isFail ? 'text-red-500' : 'text-slate-800'}`}>
                                                                            {m.status === 'Absent' ? 'AB' : m.marksObtained}
                                                                        </span>
                                                                        <span className={`text-[10px] font-bold ${isFail ? 'text-red-300' : 'text-indigo-400'}`}>
                                                                            {m.grade || '-'}
                                                                        </span>
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-slate-200">-</span>
                                                                )}
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Student Modal */}
            {selectedStudentId && (
                <StudentModal
                    isOpen={!!selectedStudentId}
                    onClose={() => setSelectedStudentId(null)}
                    studentId={selectedStudentId}
                    initialMode="view"
                    readOnly={true}
                />
            )}
        </div>
    );
}
