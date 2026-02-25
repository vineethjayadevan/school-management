import { useState, useEffect, useRef } from 'react';
import { Search, X, Loader } from 'lucide-react';
import { storageService } from '../../services/storage';

export default function StudentSearch({ onSelect, excludeIds = [] }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const searchRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowResults(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        const fetchStudents = async () => {
            if (query.trim().length < 2) {
                setResults([]);
                return;
            }

            setLoading(true);
            try {
                // Using the existing getAll with search param
                const data = await storageService.students.getAll(query, { status: 'Active' });

                // Filter out excluded IDs (e.g. self or already selected siblings)
                const filtered = data.filter(s => !excludeIds.includes(s.id));
                setResults(filtered);
                setShowResults(true);
            } catch (error) {
                console.error("Failed to search students", error);
            } finally {
                setLoading(false);
            }
        };

        const timeoutId = setTimeout(fetchStudents, 300); // Debounce
        return () => clearTimeout(timeoutId);
    }, [query, excludeIds]);

    const handleSelect = (student) => {
        onSelect(student);
        setQuery('');
        setResults([]);
        setShowResults(false);
    };

    return (
        <div className="relative w-full" ref={searchRef}>
            <div className="relative">
                <input
                    type="text"
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    placeholder="Search student by name or admission no..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => {
                        if (query.length >= 2) setShowResults(true);
                    }}
                />
                <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                {query && (
                    <button
                        onClick={() => {
                            setQuery('');
                            setResults([]);
                        }}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                        <X size={18} />
                    </button>
                )}
            </div>

            {showResults && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {loading ? (
                        <div className="p-4 text-center text-slate-500 flex items-center justify-center gap-2">
                            <Loader size={16} className="animate-spin" /> Searching...
                        </div>
                    ) : results.length > 0 ? (
                        <ul className="py-1">
                            {results.map((student) => (
                                <li
                                    key={student.id}
                                    onClick={() => handleSelect(student)}
                                    className="px-4 py-2 hover:bg-indigo-50 cursor-pointer flex justify-between items-center"
                                >
                                    <div>
                                        <p className="font-medium text-slate-900">{student.name}</p>
                                        <p className="text-xs text-slate-500">Class: {student.className} - {student.section}</p>
                                    </div>
                                    <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-600">
                                        {student.admissionNo}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="p-4 text-center text-slate-500">
                            No students found.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
