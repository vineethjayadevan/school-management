import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search,
    Filter,
    Download,
    Plus,
    Eye,
    Edit,
    FileSpreadsheet,
    Printer
} from 'lucide-react';
import { storageService } from '../../services/storage';
import { useToast } from '../../components/ui/Toast';

export default function StudentList() {
    const navigate = useNavigate();
    const { addToast } = useToast();

    // Data State
    const [allStudents, setAllStudents] = useState([]);
    const [loading, setLoading] = useState(true);

    // UI/Filter State
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedClass, setSelectedClass] = useState('Mont 1');
    const [showFilters, setShowFilters] = useState(false);
    const [showInactive, setShowInactive] = useState(false);
    const [filters, setFilters] = useState({
        gender: 'All'  // All, Male, Female
    });

    useEffect(() => {
        loadStudents();
    }, []);

    const handleViewStudent = (id) => {
        navigate(`/admin/students/${id}`, { state: { mode: 'view' } });
    };

    const handleEditStudent = (id) => {
        navigate(`/admin/students/${id}`, { state: { mode: 'edit' } });
    };

    const loadStudents = async () => {
        try {
            const data = await storageService.students.getAll();
            setAllStudents(data);
        } catch (error) {
            addToast("Failed to load students", "error");
        } finally {
            setLoading(false);
        }
    };

    // Derived State: Unique Classes for Tabs
    // Derived State: Unique Classes for Tabs
    const formatClassLabel = (cls) => {
        if (!cls) return '';
        // Normalize: If it's "Class X", make it "Grade X"
        return cls.replace(/^Class\s+/, 'Grade ');
    };

    const matchClassOrder = (cls) => {
        // Custom sort order for classes
        if (cls === 'Mont 1') return -5;
        if (cls === 'Mont 2') return -4;
        if (cls === 'LKG') return -3;
        if (cls === 'UKG') return -2;
        if (cls.startsWith('KG')) return 0;
        if (cls.startsWith('Class')) return parseInt(cls.split(' ')[1]) || 10;
        if (cls.startsWith('Grade')) return parseInt(cls.split(' ')[1]) || 10;
        return 20;
    };

    const uniqueClasses = useMemo(() => {
        // All school classes in order — always shown regardless of enrolment
        const schoolClasses = ['Mont 1', 'Mont 2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5'];

        // Also pick up any classes from student records that aren't in the static list
        const dynamicClasses = allStudents
            .map(s => formatClassLabel(s.className || s.class))
            .filter(c => c && !schoolClasses.includes(c));

        const allClasses = [...new Set([...schoolClasses, ...dynamicClasses])];
        return allClasses.sort((a, b) => matchClassOrder(a) - matchClassOrder(b));
    }, [allStudents]);

    // Derived State: Filtered Students
    const filteredStudents = useMemo(() => {
        return allStudents.filter(student => {
            // 0. Active-only filter (default hides TC-relieved/alumni)
            if (!showInactive && !student.isActive) return false;
            if (showInactive && student.isActive) return false;

            // 1. Search (Name, Admission No, Roll No)
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch =
                (student.name?.toLowerCase() || '').includes(searchLower) ||
                (student.admissionNo?.toLowerCase() || '').includes(searchLower) ||
                (student.rollNo?.toLowerCase() || '').includes(searchLower);

            // 2. Class Tab
            const studentClassNormalized = formatClassLabel(student.className || student.class);
            const matchesClass = studentClassNormalized === selectedClass;

            // 3. Advanced Filters
            const matchesGender = filters.gender === 'All' || student.gender === filters.gender;

            return matchesSearch && matchesClass && matchesGender;
        }).sort((a, b) => {
            return String(a.rollNo || '').localeCompare(String(b.rollNo || ''), undefined, { numeric: true, sensitivity: 'base' });
        });
    }, [allStudents, searchTerm, selectedClass, filters, showInactive]);

    // Count inactive students for badge
    const inactiveCount = useMemo(() => allStudents.filter(s => !s.isActive).length, [allStudents]);

    const handleExportCSV = () => {
        if (filteredStudents.length === 0) {
            addToast("No data to export", "warning");
            return;
        }

        const headers = ["Admission No", "Name", "Class", "Section", "Roll No", "Gender", "Parent", "Phone"];
        const rows = filteredStudents.map(s => [
            s.admissionNo,
            s.name,
            s.className || s.class,
            s.section,
            s.rollNo,
            s.gender,
            s.guardian,
            s.primaryPhone || s.contact
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell || ''}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `students_export_${selectedClass.replace(' ', '_')}_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        addToast("Exported successfully", "success");
    };



    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Students Directory</h1>
                    <p className="text-slate-500">Manage student admissions and records.</p>
                </div>
                {/* Button Removed as per request (moved to Admissions) */}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                {/* Top Toolbar */}
                <div className="p-4 border-b border-slate-200 space-y-4">
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                        {/* Search */}
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search by Name, Admission No..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-mono text-sm"
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 w-full md:w-auto">
                            {/* Active / TC-Issued toggle */}
                            <button
                                onClick={() => setShowInactive(prev => !prev)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${showInactive
                                    ? 'bg-amber-50 border-amber-300 text-amber-700'
                                    : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                                    }`}
                            >
                                {showInactive ? '⬅ Active Students' : (
                                    <span className="flex items-center gap-1.5">
                                        TC / Relieved
                                        {inactiveCount > 0 && (
                                            <span className="inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold bg-amber-500 text-white rounded-full">
                                                {inactiveCount}
                                            </span>
                                        )}
                                    </span>
                                )}
                            </button>
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`flex-1 sm:flex-none items-center justify-center gap-2 px-4 py-2 border rounded-lg transition-colors ${showFilters ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'border-slate-300 text-slate-700 hover:bg-slate-50'}`}
                            >
                                <Filter size={18} />
                                <span>Filter</span>
                            </button>
                            <button
                                onClick={handleExportCSV}
                                className="flex-1 sm:flex-none items-center justify-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-colors"
                            >
                                <FileSpreadsheet size={18} />
                                <span>CSV</span>
                            </button>
                        </div>
                    </div>

                    {/* Filter Panel (Collapsible) */}
                    {showFilters && (
                        <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">Gender</label>
                                <select
                                    value={filters.gender}
                                    onChange={(e) => setFilters(prev => ({ ...prev, gender: e.target.value }))}
                                    className="w-full p-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:border-indigo-500"
                                >
                                    <option value="All">All Genders</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Class Tabs */}
                    <div className="flex items-center gap-1 overflow-x-auto pb-2 scrollbar-hide">
                        {uniqueClasses.map((cls) => (
                            <button
                                key={cls}
                                onClick={() => setSelectedClass(cls)}
                                className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${selectedClass === cls
                                    ? 'bg-slate-900 text-white font-medium shadow-md'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                            >
                                {formatClassLabel(cls)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Data Table */}
                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 text-slate-600 text-xs font-bold uppercase tracking-wider">
                                <th className="px-6 py-4 border-b border-slate-200">Student Identity</th>
                                <th className="px-6 py-4 border-b border-slate-200">Academic Info</th>
                                <th className="px-6 py-4 border-b border-slate-200">Contact</th>
                                <th className="px-6 py-4 border-b border-slate-200 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center text-slate-500">
                                        Loading directory...
                                    </td>
                                </tr>
                            ) : filteredStudents.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center text-slate-500">
                                        No students found matching your criteria.
                                    </td>
                                </tr>
                            ) : (
                                filteredStudents.map((student) => (
                                    <tr key={student._id || student.id} className="hover:bg-indigo-50/30 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="relative">
                                                    {student.photoUrl ? (
                                                        <img
                                                            src={student.photoUrl}
                                                            alt={student.name}
                                                            className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-sm"
                                                            onError={(e) => {
                                                                e.target.onerror = null;
                                                                e.target.src = '';
                                                                e.target.classList.add('hidden');
                                                                e.target.nextSibling.classList.remove('hidden');
                                                            }}
                                                        />
                                                    ) : null}
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${student.gender === 'Female' ? 'bg-pink-100 text-pink-600' : 'bg-blue-100 text-blue-600'} ${student.photoUrl ? 'hidden' : ''}`}>
                                                        {student.name.charAt(0)}
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-900">{student.name}</p>
                                                    <p className="text-xs font-mono text-slate-500">{student.admissionNo}</p>
                                                    {!student.isActive && (
                                                        <span className="inline-block mt-0.5 px-1.5 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-700 rounded">
                                                            TC Issued
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-slate-700">{formatClassLabel(student.className || student.class)} - {student.section}</span>
                                                <span className="text-xs text-slate-500">Roll No: {student.rollNo}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm text-slate-900">{student.guardian}</span>
                                                <span className="text-xs text-slate-500">{student.primaryPhone || student.contact}</span>
                                            </div>
                                        </td>

                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleViewStudent(student._id || student.id)}
                                                    className="p-2 hover:bg-slate-100 rounded-full text-slate-500 hover:text-indigo-600"
                                                    title="View Profile"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                {student.isActive && (
                                                    <button
                                                        onClick={() => handleEditStudent(student._id || student.id)}
                                                        className="p-2 hover:bg-slate-100 rounded-full text-slate-500 hover:text-amber-600"
                                                        title="Edit"
                                                    >
                                                        <Edit size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer / Pagination Placeholder */}
                <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 bg-slate-50/50">
                    <p>Total Records: {filteredStudents.length}</p>
                    <p>Exported {new Date().toLocaleDateString()}</p>
                </div>
            </div>

        </div>
    );
}
