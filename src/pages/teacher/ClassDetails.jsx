import { useState, useEffect } from 'react';

import { storageService } from '../../services/storage';
import { ArrowLeft, Search, Eye } from 'lucide-react';
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
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (student.rollNo && student.rollNo.toString().includes(searchTerm))
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
                >
                    <ArrowLeft size={24} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Class {className} - {sectionName}</h1>
                    <p className="text-slate-500">Student List & Fee Status</p>
                </div>
            </div>

            {/* Controls */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search student by name or roll no..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
                <div className="text-sm text-slate-500">
                    Total: <span className="font-bold text-slate-800">{filteredStudents.length}</span>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 text-slate-500 text-sm uppercase">
                            <tr>
                                <th className="p-4 font-semibold border-b border-slate-100">Roll No</th>
                                <th className="p-4 font-semibold border-b border-slate-100">Name</th>
                                <th className="p-4 font-semibold border-b border-slate-100">Gender</th>
                                <th className="p-4 font-semibold border-b border-slate-100">Check Parent Contact</th>
                                <th className="p-4 font-semibold border-b border-slate-100">Fee Status</th>
                                <th className="p-4 font-semibold border-b border-slate-100 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-slate-500">Loading students...</td>
                                </tr>
                            ) : filteredStudents.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-slate-500">No students found.</td>
                                </tr>
                            ) : (
                                filteredStudents.map((student) => (
                                    <tr key={student._id} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-4 text-slate-600 font-mono">{student.rollNo || '-'}</td>
                                        <td className="p-4 font-medium text-slate-900">{student.name}</td>
                                        <td className="p-4 text-slate-600">{student.gender}</td>
                                        <td className="p-4 text-slate-600 font-mono">{student.primaryPhone || 'N/A'}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${student.feesStatus === 'Paid'
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : 'bg-rose-100 text-rose-700'
                                                }`}>
                                                {student.feesStatus || 'Pending'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <button
                                                onClick={() => setSelectedStudentId(student._id)}
                                                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                title="View Details"
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
            <StudentModal
                isOpen={!!selectedStudentId}
                onClose={() => setSelectedStudentId(null)}
                studentId={selectedStudentId}
                initialMode="view"
            />
        </div>
    );
}
