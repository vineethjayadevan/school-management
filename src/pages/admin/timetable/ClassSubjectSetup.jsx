import React, { useState, useEffect } from 'react';
import { Save, CheckCircle, BookOpen } from 'lucide-react';
import api from '../../../services/api';

export default function ClassSubjectSetup() {
    const [academicYears, setAcademicYears] = useState([]);
    const [selectedYear, setSelectedYear] = useState('');
    const [classes, setClasses] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSubjects, setSelectedSubjects] = useState([]);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [loading, setLoading] = useState(false);
    const [matrixMap, setMatrixMap] = useState({}); // className -> [subjectIds]

    useEffect(() => {
        Promise.all([
            api.get('/academic-years'),
            api.get('/academics/classes'),
            api.get('/academics/subjects'),
        ]).then(([yearsRes, classesRes, subjectsRes]) => {
            setAcademicYears(yearsRes.data || []);
            setClasses(classesRes.data || []);
            setSubjects(subjectsRes.data || []);
            const active = yearsRes.data?.find(y => y.isActive);
            if (active) setSelectedYear(active._id);
        });
    }, []);

    // Load matrix for current year whenever year changes
    useEffect(() => {
        if (!selectedYear) return;
        setLoading(true);
        api.get(`/class-subject-matrix?academicYear=${selectedYear}`)
            .then(r => {
                const map = {};
                (r.data || []).forEach(entry => {
                    map[entry.className] = entry.subjects.map(s => s._id || s);
                });
                setMatrixMap(map);
                // Re-derive selected subjects for current class
                if (selectedClass) {
                    setSelectedSubjects(map[selectedClass] || []);
                }
            })
            .finally(() => setLoading(false));
    }, [selectedYear]);

    // When class tab changes, load its subjects
    const handleClassChange = (cls) => {
        setSelectedClass(cls);
        setSelectedSubjects(matrixMap[cls] || []);
        setSaved(false);
    };

    const toggleSubject = (subjectId) => {
        setSelectedSubjects(prev =>
            prev.includes(subjectId)
                ? prev.filter(id => id !== subjectId)
                : [...prev, subjectId]
        );
    };

    const handleSave = async () => {
        if (!selectedYear || !selectedClass) return;
        setSaving(true);
        try {
            await api.post('/class-subject-matrix', {
                academicYear: selectedYear,
                className: selectedClass,
                subjects: selectedSubjects
            });
            setMatrixMap(prev => ({ ...prev, [selectedClass]: selectedSubjects }));
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const groupByType = (subjectList) => {
        const groups = {};
        subjectList.forEach(s => {
            const type = s.type || 'Other';
            if (!groups[type]) groups[type] = [];
            groups[type].push(s);
        });
        return groups;
    };

    const typeColors = {
        'Core': 'text-indigo-700 bg-indigo-50 border-indigo-200',
        'Elective': 'text-emerald-700 bg-emerald-50 border-emerald-200',
        'Co-Curricular': 'text-violet-700 bg-violet-50 border-violet-200',
        'Other': 'text-slate-700 bg-slate-50 border-slate-200',
    };

    const grouped = groupByType(subjects);

    return (
        <div className="space-y-6">
            {/* Year Selector */}
            <div className="flex items-center gap-4">
                <div className="w-56">
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Academic Year</label>
                    <select
                        value={selectedYear}
                        onChange={e => { setSelectedYear(e.target.value); setSelectedClass(''); setSelectedSubjects([]); }}
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="">Select year...</option>
                        {academicYears.map(y => (
                            <option key={y._id} value={y._id}>{y.name}{y.isActive ? ' (Active)' : ''}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="flex gap-6 items-start">
                {/* Class list */}
                <div className="w-52 flex-shrink-0">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Classes</p>
                    <div className="space-y-1">
                        {classes.map(cls => {
                            const count = (matrixMap[cls.name] || []).length;
                            return (
                                <button
                                    key={cls._id}
                                    onClick={() => handleClassChange(cls.name)}
                                    className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium flex items-center justify-between transition-all
                                        ${selectedClass === cls.name
                                            ? 'bg-indigo-600 text-white shadow-sm'
                                            : 'text-slate-600 hover:bg-slate-100'
                                        }`}
                                >
                                    <span>{cls.name}</span>
                                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${selectedClass === cls.name ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                        {count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Subject checklist */}
                <div className="flex-1">
                    {!selectedClass ? (
                        <div className="text-center py-16 text-slate-400">
                            <BookOpen size={36} className="mx-auto mb-3 text-slate-300" />
                            <p className="font-medium">Select a class to assign subjects</p>
                        </div>
                    ) : (
                        <div className="space-y-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold text-slate-800">{selectedClass}</h3>
                                    <p className="text-xs text-slate-500">{selectedSubjects.length} subject(s) selected</p>
                                </div>
                                <button
                                    onClick={handleSave}
                                    disabled={saving || !selectedYear}
                                    className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm shadow-sm disabled:opacity-50 transition-colors"
                                >
                                    {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : saved ? <CheckCircle size={15} /> : <Save size={15} />}
                                    {saving ? 'Saving...' : saved ? 'Saved!' : 'Save'}
                                </button>
                            </div>

                            {Object.entries(grouped).map(([type, subjectList]) => (
                                <div key={type}>
                                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">{type}</p>
                                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                                        {subjectList.map(subject => {
                                            const isSelected = selectedSubjects.includes(subject._id);
                                            return (
                                                <button
                                                    key={subject._id}
                                                    onClick={() => toggleSubject(subject._id)}
                                                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-medium text-left transition-all
                                                        ${isSelected
                                                            ? `${typeColors[type] || typeColors['Other']} border-current`
                                                            : 'border-slate-200 text-slate-500 hover:border-slate-300 bg-white'
                                                        }`}
                                                >
                                                    <div className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center text-white text-[10px]
                                                        ${isSelected ? 'bg-current border-current' : 'border-slate-300'}`}>
                                                        {isSelected && '✓'}
                                                    </div>
                                                    <div>
                                                        <p className="leading-tight">{subject.name}</p>
                                                        <p className="text-[10px] opacity-60">{subject.code}</p>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
