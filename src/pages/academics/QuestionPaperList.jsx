import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, FileText, Plus, Search, RefreshCw, Eye, Edit2, Trash2 } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

export default function QuestionPaperList() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [papers, setPapers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchPapers = async () => {
        setLoading(true);
        try {
            const res = await api.get('/question-papers');
            setPapers(res.data);
        } catch (error) {
            console.error('Error fetching question papers:', error);
            toast.error('Failed to load question papers');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPapers();
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this question paper?')) return;
        try {
            await api.delete(`/question-papers/${id}`);
            toast.success('Question paper deleted');
            fetchPapers();
        } catch (error) {
            console.error('Delete error:', error);
            toast.error(error.response?.data?.message || 'Failed to delete');
        }
    };

    const filteredPapers = papers.filter(p =>
        p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.className?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Question Papers</h1>
                    <p className="text-sm text-slate-500">Manage your question papers and view ones for your class</p>
                </div>
                <button
                    onClick={() => navigate('/teacher/question-papers/build')}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                >
                    <Plus size={18} />
                    <span>Create New Paper</span>
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200 flex sm:flex-row flex-col gap-4 justify-between items-center bg-slate-50">
                    <div className="relative w-full sm:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search by title, subject, or class..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                    <button
                        onClick={fetchPapers}
                        className="flex items-center gap-2 px-3 py-2 text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                    >
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 text-slate-600 text-sm border-b border-slate-200">
                                <th className="p-4 font-semibold w-1/3">Title & Subject</th>
                                <th className="p-4 font-semibold">Class</th>
                                <th className="p-4 font-semibold">Exam Type</th>
                                <th className="p-4 font-semibold">Creator</th>
                                <th className="p-4 font-semibold">Status</th>
                                <th className="p-4 font-semibold">Marks</th>
                                <th className="p-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="p-8 text-center text-slate-500">Loading...</td>
                                </tr>
                            ) : filteredPapers.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="p-8 text-center text-slate-500">
                                        <div className="flex flex-col items-center gap-2">
                                            <FileText size={32} className="text-slate-300" />
                                            <p>No question papers found.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredPapers.map(paper => (
                                    <tr key={paper._id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="p-4">
                                            <div className="font-medium text-slate-800">{paper.title}</div>
                                            <div className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                                                <BookOpen size={14} /> {paper.subject}
                                            </div>
                                        </td>
                                        <td className="p-4 text-slate-600 font-medium">
                                            {paper.className || 'Unknown'} {paper.section ? ` - ${paper.section}` : ''}
                                        </td>
                                        <td className="p-4 text-slate-600 font-medium">
                                            {paper.examType || 'N/A'}
                                        </td>
                                        <td className="p-4">
                                            <span className="text-sm text-slate-600 bg-slate-100 px-2 py-1 rounded">
                                                {paper.teacher?._id === user?.profileId ? 'Me' : paper.teacher?.name || 'Unknown'}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${paper.status === 'Published'
                                                ? 'bg-green-50 text-green-700 border-green-200'
                                                : 'bg-amber-50 text-amber-700 border-amber-200'
                                                }`}>
                                                {paper.status}
                                            </span>
                                        </td>
                                        <td className="p-4 font-semibold text-indigo-600">
                                            {paper.totalMarks}
                                        </td>
                                        <td className="p-4 text-right space-x-2 whitespace-nowrap">
                                            <button
                                                onClick={() => navigate(`/teacher/question-papers/${paper._id}`)}
                                                className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded transition-colors tooltip"
                                                title="View"
                                            >
                                                <Eye size={18} />
                                            </button>

                                            {/* Only creator can edit/delete */}
                                            {paper.teacher?._id === user?.profileId && (
                                                <>
                                                    <button
                                                        onClick={() => navigate(`/teacher/question-papers/edit/${paper._id}`)}
                                                        className="p-1.5 text-slate-600 hover:bg-slate-100 rounded transition-colors tooltip"
                                                        title="Edit"
                                                    >
                                                        <Edit2 size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(paper._id)}
                                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors tooltip"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
