import { useState, useEffect } from 'react';
import { storageService } from '../../services/storage';
import { ArrowLeft, Search, Eye, Users } from 'lucide-react';
import StudentModal from '../../components/students/StudentModal';
import { useParams as useParamsRouter, useNavigate as useNavigateRouter } from 'react-router-dom';

export default function ClassDetails() {
    const navigate = useNavigateRouter();
    const { className, sectionName } = useParamsRouter();

    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStudentId, setSelectedStudentId] = useState(null);

    useEffect(() => {
        fetchStudents();
    }, [className, sectionName]);

    const fetchStudents = async () => {
        try {
            const data = await storageService.teacher.getClassStudents(className, sectionName);
            setStudents(data);
        } catch (error) {
            console.error("Failed to fetch students", error);
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
                        <p className="text-slate-500 text-sm">Full student directory and fee status</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-sm font-bold text-slate-400 bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm">
                    <Users size={16} />
                    <span>Total Students: {students.length}</span>
                </div>
            </div>

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
                                <th className="px-6 py-4 border-b border-slate-100">Fee Status</th>
                                <th className="px-6 py-4 border-b border-slate-100">Conveyance</th>
                                <th className="px-6 py-4 border-b border-slate-100 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-slate-400">
                                        <div className="flex flex-col items-center">
                                            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                                            <p className="text-sm">Fetching student records...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredStudents.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-slate-400 italic">
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

                                        {/* Fee Status */}
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border
                                                ${student.feesStatus === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : ''}
                                                ${student.feesStatus === 'Partially Paid' ? 'bg-amber-50 text-amber-700 border-amber-200' : ''}
                                                ${student.feesStatus?.toLowerCase() === 'overdue' ? 'bg-rose-50 text-rose-700 border-rose-200' : ''}
                                                ${!student.feesStatus || student.feesStatus === 'Pending' ? 'bg-slate-50 text-slate-500 border-slate-200' : ''}
                                            `}>
                                                {student.feesStatus || 'Pending'}
                                            </span>
                                        </td>

                                        {/* Conveyance */}
                                        <td className="px-6 py-4">
                                            {(() => {
                                                const slab = student.conveyanceSlab ? parseInt(student.conveyanceSlab) : 0;
                                                if (slab === 0) return <span className="text-slate-300 text-[10px] font-bold">N/A</span>;

                                                const lastPayment = student.lastConveyancePayment ? new Date(student.lastConveyancePayment) : null;
                                                const now = new Date();
                                                const isPaidCurrentMonth = lastPayment &&
                                                    lastPayment.getMonth() === now.getMonth() &&
                                                    lastPayment.getFullYear() === now.getFullYear();

                                                return (
                                                    <div className="flex flex-col">
                                                        <span className={`text-[10px] font-black uppercase ${isPaidCurrentMonth ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                            {isPaidCurrentMonth ? 'Paid' : 'Unpaid'}
                                                        </span>
                                                        <span className="text-[9px] font-black text-slate-400">Slab {slab}</span>
                                                    </div>
                                                );
                                            })()}
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
