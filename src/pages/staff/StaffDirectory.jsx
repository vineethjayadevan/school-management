import { useState, useEffect } from 'react';
import {
    Search,
    Plus,
    Phone,
    Mail,
    Edit2,
    Trash2,
    X,
    Save,
    Check,
    ChevronDown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../components/ui/Toast';

const StaffAvatar = ({ member }) => {
    const [imgUrl, setImgUrl] = useState(member.photoUrl);
    const [hasError, setHasError] = useState(false);

    const handleError = async () => {
        if (!hasError && member.photoUrl) {
            setHasError(true);
            try {
                // If direct URL fails (e.g. 403), try fetching a signed URL
                const { data } = await api.get('/upload/signed-url', {
                    params: { fileName: member.photoUrl }
                });
                if (data.signedUrl) {
                    setImgUrl(data.signedUrl);
                    setHasError(false); // Reset error state to try loading the signed URL
                }
            } catch (err) {
                console.error("Failed to load fallback signed URL", err);
            }
        }
    };

    if (!imgUrl || (hasError && imgUrl === member.photoUrl)) {
        return (
            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-sm">
                {member.name.charAt(0)}
            </div>
        );
    }

    return (
        <img
            src={imgUrl}
            alt={member.name}
            className="w-10 h-10 rounded-full object-cover border-2 border-indigo-100 shadow-sm"
            onError={handleError}
        />
    );
};

export default function StaffDirectory() {
    const [staff, setStaff] = useState([]);
    const [categories, setCategories] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('');

    const [isLoading, setIsLoading] = useState(true);

    const navigate = useNavigate();
    const { addToast } = useToast();

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setIsLoading(true);
        try {
            const [staffRes, catRes, subRes] = await Promise.all([
                api.get('/staff'),
                api.get('/staff-categories'),
                api.get('/academics/subjects')
            ]);
            setStaff(staffRes.data);
            setCategories(catRes.data);
            setSubjects(subRes.data);

            if (catRes.data.length > 0 && !activeTab) {
                setActiveTab(catRes.data[0].name);
            }
        } catch (error) {
            console.error(error);
            addToast("Failed to load staff data", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const fetchStaff = async () => {
        try {
            const res = await api.get('/staff');
            setStaff(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value.toLowerCase());
    };

    const handleEdit = (member) => {
        navigate(`/admin/staff/edit/${member._id}`);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this staff member?')) {
            try {
                await api.delete(`/staff/${id}`);
                addToast("Staff deleted successfully", "success");
                fetchStaff();
            } catch (error) {
                addToast("Failed to delete staff", "error");
            }
        }
    };

    // Filter Logic
    const filteredStaff = staff.filter(s => {
        const matchesTab = s.category === activeTab;
        const search = searchTerm.toLowerCase();
        const matchesSearch = s.name.toLowerCase().includes(search) ||
            (s.role && s.role.toLowerCase().includes(search)) ||
            (s.email && s.email.toLowerCase().includes(search));
        return matchesTab && matchesSearch;
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex flex-wrap gap-2 bg-slate-100 p-1 rounded-lg">
                    {categories.length === 0 && !isLoading && <div className="px-4 py-2 text-slate-500 text-sm">No categories configured</div>}
                    {categories.map((cat) => (
                        <button
                            key={cat._id}
                            onClick={() => setActiveTab(cat.name)}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === cat.name
                                ? 'bg-white text-indigo-600 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>

                <div className="flex gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-initial">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search staff..."
                            value={searchTerm}
                            onChange={handleSearch}
                            className="w-full sm:w-64 pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <button
                        onClick={() => navigate('/admin/staff/new')}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap"
                    >
                        <Plus size={20} />
                        <span>Add Staff</span>
                    </button>
                </div>
            </div>

            {/* Staff Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[400px]">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full py-20 text-slate-500">Loading...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Staff Member</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Category/Role</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Contact</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Subjects</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700 text-sm">Status</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700 text-sm text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {filteredStaff.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                                            No staff found in this category.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredStaff.map((member) => (
                                        <tr key={member._id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="relative w-10 h-10 flex-shrink-0">
                                                        <StaffAvatar member={member} />
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-slate-900">{member.name}</div>
                                                        <div className="text-xs text-slate-500">Since {new Date(member.joiningDate).toLocaleDateString()}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-slate-900 font-medium">
                                                    {member.category}
                                                    {member.subcategory && (
                                                        <span className="text-slate-500 font-normal ml-1">({member.subcategory})</span>
                                                    )}
                                                </div>
                                                <div className="text-[10px] text-slate-400 uppercase tracking-wider">{member.role}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1 text-sm text-slate-600">
                                                    <div className="flex items-center gap-2">
                                                        <Phone size={14} className="text-slate-400" />
                                                        {member.phone}
                                                    </div>
                                                    {member.email && (
                                                        <div className="flex items-center gap-2">
                                                            <Mail size={14} className="text-slate-400" />
                                                            <span className="truncate max-w-[150px]" title={member.email}>{member.email}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-slate-600 max-w-[200px] flex flex-wrap gap-1">
                                                    {member.subjects && member.subjects.length > 0 ? (
                                                        member.subjects.map((sub, i) => (
                                                            <span key={i} className="inline-block px-2 py-0.5 bg-slate-100 rounded-full text-xs border border-slate-200">
                                                                {sub.name || sub}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="text-slate-400 italic">N/A</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${member.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {member.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button onClick={() => handleEdit(member)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Edit2 size={18} /></button>
                                                    <button onClick={() => handleDelete(member._id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={18} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

        </div>
    );
}


