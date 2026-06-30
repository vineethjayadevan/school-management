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
    Printer,
    Users,
    Calendar,
    GraduationCap,
    Clock
} from 'lucide-react';
import { storageService } from '../../services/storage';
import api from '../../services/api';
import { useToast } from '../../components/ui/Toast';

export default function StudentList() {
    const navigate = useNavigate();
    const { addToast } = useToast();

    // Data State
    const [allStudents, setAllStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [academicYears, setAcademicYears] = useState([]);
    const [classes, setClasses] = useState([]);

    // UI/Filter State
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedYear, setSelectedYear] = useState('All');
    const [selectedClass, setSelectedClass] = useState('All');
    const [selectedSection, setSelectedSection] = useState('All');
    const [viewMode, setViewMode] = useState('Active'); // 'Active' or 'Archived'
    const [showFilters, setShowFilters] = useState(false);
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
        setLoading(true);
        try {
            const [studentsData, yearsRes, classesRes] = await Promise.all([
                storageService.students.getAll(),
                api.get('/academic-years').catch(() => ({ data: [] })),
                api.get('/academics/classes').catch(() => ({ data: [] }))
            ]);

            setAllStudents(studentsData);
            setAcademicYears(yearsRes.data || []);
            setClasses(classesRes.data || []);


        } catch (error) {
            console.error("Failed to load directory data:", error);
            addToast("Failed to load directory data", "error");
        } finally {
            setLoading(false);
        }
    };

    const formatClassLabel = (cls) => {
        if (!cls) return '';
        return cls.replace(/^Class\s+/, 'Grade ');
    };

    const matchClassOrder = (cls) => {
        if (cls === 'Mont 1') return -5;
        if (cls === 'Mont 2') return -4;
        if (cls === 'LKG') return -3;
        if (cls === 'UKG') return -2;
        if (cls.startsWith('KG')) return 0;
        if (cls.startsWith('Grade')) return parseInt(cls.split(' ')[1]) || 10;
        return 20;
    };

    const sortedClasses = useMemo(() => {
        return [...classes].sort((a, b) => matchClassOrder(a.name) - matchClassOrder(b.name));
    }, [classes]);

    const availableSections = useMemo(() => {
        if (selectedClass === 'All') return [];
        return classes.find(c => c.name === selectedClass)?.sections || [];
    }, [classes, selectedClass]);

    // Derived State: Filtered Students
    const filteredStudents = useMemo(() => {
        return allStudents.filter(student => {
            // 0. Filter by View Mode
            const isActive = !student.studentStatus || student.studentStatus === 'Active';
            if (viewMode === 'Active' && !isActive) return false;
            if (viewMode === 'Archived' && isActive) return false;

            // 1. Search (Name, Admission No, Roll No)
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch =
                (student.name?.toLowerCase() || '').includes(searchLower) ||
                (student.admissionNo?.toLowerCase() || '').includes(searchLower) ||
                (student.rollNo?.toLowerCase() || '').includes(searchLower);

            // 2, 3 & 4. Year, Class & Section Filters
            let matchesYear = false;
            let matchesClass = false;
            let matchesSection = false;

            if (selectedYear === 'All') {
                matchesYear = true;
                const studentClass = student.className || student.class;
                const studentSection = student.section;
                matchesClass = selectedClass === 'All' || studentClass === selectedClass;
                matchesSection = selectedSection === 'All' || studentSection === selectedSection;
            } else {
                // Normalize: currentAcademicYear can be a plain ID string or a populated object
                const studentYearId =
                    (typeof student.currentAcademicYear === 'object' && student.currentAcademicYear !== null)
                        ? (student.currentAcademicYear._id?.toString() || student.currentAcademicYear.toString())
                        : student.currentAcademicYear?.toString();

                if (studentYearId === selectedYear) {
                    matchesYear = true;
                    const studentClass = student.className || student.class;
                    const studentSection = student.section;
                    matchesClass = selectedClass === 'All' || studentClass === selectedClass;
                    matchesSection = selectedSection === 'All' || studentSection === selectedSection;
                }
                // Check history if not found in current year
                else if (student.academicHistory && student.academicHistory.length > 0) {
                    const historyEntry = student.academicHistory.find(h => {
                        const hId = (typeof h.academicYear === 'object' && h.academicYear !== null)
                            ? (h.academicYear._id?.toString() || h.academicYear.toString())
                            : h.academicYear?.toString();
                        return hId === selectedYear;
                    });
                    if (historyEntry) {
                        matchesYear = true;
                        matchesClass = selectedClass === 'All' || historyEntry.className === selectedClass;
                        matchesSection = selectedSection === 'All' || historyEntry.section === selectedSection;
                    }
                }
            }

            // 4. Advanced Filters
            const matchesGender = filters.gender === 'All' || student.gender === filters.gender;

            return matchesSearch && matchesYear && matchesClass && matchesSection && matchesGender;
        }).sort((a, b) => {
            const classA = a.className || a.class || '';
            const classB = b.className || b.class || '';
            const classOrderDiff = matchClassOrder(classA) - matchClassOrder(classB);
            
            if (classOrderDiff !== 0) {
                return classOrderDiff;
            }
            
            return String(a.name || '').localeCompare(String(b.name || ''));
        });
    }, [allStudents, searchTerm, selectedYear, selectedClass, selectedSection, filters, viewMode]);

    // Base Students for Fixed Stats (only filtered by viewMode)
    const baseStudents = useMemo(() => {
        return allStudents.filter(student => {
            const isActive = !student.studentStatus || student.studentStatus === 'Active';
            if (viewMode === 'Active' && !isActive) return false;
            if (viewMode === 'Archived' && isActive) return false;
            return true;
        });
    }, [allStudents, viewMode]);

    // Fixed Statistics Calculation
    const stats = useMemo(() => {
        const total = baseStudents.length;
        const male = baseStudents.filter(s => s.gender === 'Male').length;
        const female = baseStudents.filter(s => s.gender === 'Female').length;
        return { total, male, female };
    }, [baseStudents]);


    const handleExportCSV = () => {
        if (filteredStudents.length === 0) {
            addToast("No data to export", "warning");
            return;
        }

        const headers = ["Admission No", "Name", "Class", "Section", "Roll No", "Gender", "Parent", "Phone"];
        const rows = filteredStudents.map(s => {
            let displayClass = s.className || s.class;
            let displaySection = s.section;

            // Use historical class/section if viewing a past year
            if (selectedYear !== 'All' && s.currentAcademicYear !== selectedYear && s.academicHistory) {
                const hist = s.academicHistory.find(h =>
                    h.academicYear?._id === selectedYear || h.academicYear === selectedYear
                );
                if (hist) {
                    displayClass = hist.className;
                    displaySection = hist.section;
                }
            }

            return [
                s.admissionNo,
                s.name,
                displayClass,
                displaySection,
                s.rollNo,
                s.gender,
                s.guardian,
                s.primaryPhone || s.contact
            ];
        });

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

                {/* Statistics Bar */}
                <div className="flex items-center gap-3 sm:gap-6">
                    <div className="bg-white border border-slate-200 rounded-xl px-4 py-2 flex items-center gap-3 shadow-sm">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                            <Users size={18} />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total</p>
                            <p className="text-lg font-bold text-slate-900 leading-tight">{stats.total}</p>
                        </div>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl px-4 py-2 flex items-center gap-3 shadow-sm">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <Users size={18} />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Male</p>
                            <p className="text-lg font-bold text-slate-900 leading-tight">{stats.male}</p>
                        </div>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl px-4 py-2 flex items-center gap-3 shadow-sm">
                        <div className="p-2 bg-pink-50 text-pink-600 rounded-lg">
                            <Users size={18} />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Female</p>
                            <p className="text-lg font-bold text-slate-900 leading-tight">{stats.female}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                {/* View Mode Toggle */}
                <div className="p-4 border-b border-slate-200 flex gap-2">
                    <button
                        onClick={() => setViewMode('Active')}
                        className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${viewMode === 'Active' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        Active Students
                    </button>
                    <button
                        onClick={() => setViewMode('Archived')}
                        className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${viewMode === 'Archived' ? 'bg-amber-50 text-amber-700' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        Archived / Transferred
                    </button>
                </div>

                {/* Dynamic Filters Bar */}
                <div className="p-4 border-b border-slate-200 bg-slate-50/30 relative">
                    {/* Dynamic Count (Top Right of Filter Box) */}
                    <div className="absolute top-3 right-4 text-[11px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full shadow-sm">
                        Showing {filteredStudents.length} Students
                    </div>
                    
                    <div className="flex flex-wrap gap-4 items-center mt-2">
                        {/* Class Dropdown */}
                        <div className="flex-1 min-w-[150px]">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 px-1">Class</label>
                            <div className="relative">
                                <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <select
                                    value={selectedClass}
                                    onChange={(e) => {
                                        setSelectedClass(e.target.value);
                                        setSelectedSection('All');
                                    }}
                                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all cursor-pointer hover:border-slate-300 shadow-sm"
                                >
                                    <option value="All">All Classes</option>
                                    {sortedClasses.map(c => (
                                        <option key={c._id} value={c.name}>{formatClassLabel(c.name)}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Section Dropdown */}
                        <div className="flex-1 min-w-[150px]">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 px-1">Section</label>
                            <div className="relative">
                                <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <select
                                    value={selectedSection}
                                    onChange={(e) => setSelectedSection(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all cursor-pointer hover:border-slate-300 shadow-sm"
                                    disabled={selectedClass === 'All'}
                                >
                                    <option value="All">All Sections</option>
                                    {availableSections.map((sec, idx) => (
                                        <option key={idx} value={sec.name}>{sec.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Search */}
                        <div className="flex-[1.5] min-w-[250px]">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 px-1">Search Students</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search by name, admission number..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm"
                                />
                            </div>
                        </div>



                        {/* Quick filter/export */}
                        <div className="flex items-end gap-2 pt-5">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`p-2.5 border rounded-xl transition-all shadow-sm ${showFilters ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                title="Advanced Filters"
                            >
                                <Filter size={20} />
                            </button>
                            <button
                                onClick={handleExportCSV}
                                className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 transition-all shadow-sm"
                                title="Export CSV"
                            >
                                <FileSpreadsheet size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Filter Panel (Collapsible) */}
                    {showFilters && (
                        <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">Gender</label>
                                <select
                                    value={filters.gender}
                                    onChange={(e) => setFilters(prev => ({ ...prev, gender: e.target.value }))}
                                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-indigo-500"
                                >
                                    <option value="All">All Genders</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                </select>
                            </div>
                        </div>
                    )}
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
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-semibold text-slate-900">{student.name}</p>
                                                        {viewMode === 'Archived' && (
                                                            <span className="px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold bg-amber-100 text-amber-700">
                                                                {student.studentStatus}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs font-mono text-slate-500">{student.admissionNo}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                {(() => {
                                                    let displayClass = student.className || student.class;
                                                    let displaySection = student.section;

                                                    if (selectedYear !== 'All' && student.currentAcademicYear !== selectedYear && student.academicHistory) {
                                                        const hist = student.academicHistory.find(h =>
                                                            h.academicYear?._id === selectedYear || h.academicYear === selectedYear
                                                        );
                                                        if (hist) {
                                                            displayClass = hist.className;
                                                            displaySection = hist.section;
                                                        }
                                                    }
                                                    return (
                                                        <>
                                                            <span className="text-sm font-medium text-slate-700">
                                                                {formatClassLabel(displayClass)} - {displaySection}
                                                            </span>
                                                        </>
                                                    );
                                                })()}
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
                                                {student.studentStatus === 'Active' && (
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
            </div >

        </div >
    );
}
