import { useState, useEffect } from 'react';
import { Trash2, Edit2, Check, X } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../ui/Toast';

export default function StaffCategorySettings() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const { addToast } = useToast();

    // Addition Form State
    const [newCatName, setNewCatName] = useState('');
    const [isTeaching, setIsTeaching] = useState(false);
    const [subcats, setSubcats] = useState('');

    // Editing State
    const [editingId, setEditingId] = useState(null);
    const [editData, setEditData] = useState({ name: '', isTeaching: false, subcategories: '' });

    useEffect(() => {
        fetchCats();
    }, []);

    const fetchCats = async () => {
        setLoading(true);
        try {
            const res = await api.get('/staff-categories');
            setCategories(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        try {
            await api.post('/staff-categories', {
                name: newCatName,
                isTeaching,
                subcategories: subcats.split(',').map(s => s.trim()).filter(Boolean)
            });
            addToast("Category added", "success");
            setNewCatName('');
            setSubcats('');
            setIsTeaching(false);
            fetchCats();
        } catch (error) {
            addToast(error.response?.data?.message || "Failed to add category", "error");
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Delete category? This might affect staff assigned to this category.")) return;
        try {
            await api.delete(`/staff-categories/${id}`);
            addToast("Category deleted", "success");
            fetchCats();
        } catch (error) {
            addToast("Failed to delete", "error");
        }
    };

    const handleEditStart = (cat) => {
        setEditingId(cat._id);
        setEditData({
            name: cat.name,
            isTeaching: cat.isTeaching,
            subcategories: cat.subcategories?.join(', ') || ''
        });
    };

    const handleUpdate = async (id) => {
        try {
            await api.put(`/staff-categories/${id}`, {
                name: editData.name,
                isTeaching: editData.isTeaching,
                subcategories: editData.subcategories.split(',').map(s => s.trim()).filter(Boolean)
            });
            addToast("Category updated", "success");
            setEditingId(null);
            fetchCats();
        } catch (error) {
            addToast(error.response?.data?.message || "Failed to update category", "error");
        }
    };

    return (
        <div className="p-6 space-y-8">
            {/* Add New Category Form */}
            <div className="bg-slate-50 p-5 rounded-lg border border-slate-200 shadow-sm transition-all">
                <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <div className="w-1.5 h-6 bg-indigo-600 rounded-full"></div>
                    Add New Category
                </h3>
                <form onSubmit={handleAdd} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Category Name</label>
                            <input
                                value={newCatName}
                                onChange={e => setNewCatName(e.target.value)}
                                placeholder="e.g. Lab Assistant"
                                required
                                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm transition-all"
                            />
                        </div>
                        <div className="flex items-center pt-5">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={isTeaching}
                                    onChange={e => setIsTeaching(e.target.checked)}
                                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                                />
                                <span className="text-sm font-medium text-slate-700 group-hover:text-indigo-600 transition-colors">Is Teaching Staff?</span>
                            </label>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Subcategories (comma separated)</label>
                        <input
                            value={subcats}
                            onChange={e => setSubcats(e.target.value)}
                            placeholder="e.g. Junior, Senior, Head"
                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm transition-all"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">These will appear in the subcategory dropdown when adding staff</p>
                    </div>
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            className="bg-indigo-600 text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-all active:scale-95 shadow-sm"
                        >
                            Add Category
                        </button>
                    </div>
                </form>
            </div>

            {/* Existing Categories */}
            <div className="space-y-4">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                    <div className="w-1.5 h-6 bg-slate-300 rounded-full"></div>
                    Existing Categories
                </h3>
                {loading ? (
                    <div className="flex justify-center py-10">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                ) : categories.length === 0 ? (
                    <div className="text-center py-10 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                        <p className="text-sm text-slate-400 italic">No categories configured yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-3">
                        {categories.map(cat => (
                            <div key={cat._id} className={`group transition-all ${editingId === cat._id ? 'border-indigo-200 ring-2 ring-indigo-500/10 shadow-md' : 'border-slate-200 shadow-sm'} p-4 bg-white border rounded-xl`}>
                                {editingId === cat._id ? (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-top-1">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Category Name</label>
                                                <input
                                                    value={editData.name}
                                                    onChange={e => setEditData({ ...editData, name: e.target.value })}
                                                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm"
                                                    autoFocus
                                                />
                                            </div>
                                            <div className="flex items-center pt-5">
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={editData.isTeaching}
                                                        onChange={e => setEditData({ ...editData, isTeaching: e.target.checked })}
                                                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                                                    />
                                                    <span className="text-sm font-medium text-slate-700">Teaching Staff</span>
                                                </label>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Subcategories</label>
                                            <input
                                                value={editData.subcategories}
                                                onChange={e => setEditData({ ...editData, subcategories: e.target.value })}
                                                className="w-full px-3 py-1.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm"
                                            />
                                        </div>
                                        <div className="flex justify-end gap-2 pt-2">
                                            <button
                                                onClick={() => setEditingId(null)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-md text-xs font-medium transition-colors"
                                            >
                                                <X size={14} /> Cancel
                                            </button>
                                            <button
                                                onClick={() => handleUpdate(cat._id)}
                                                className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-md text-xs font-medium transition-colors shadow-sm"
                                            >
                                                <Check size={14} /> Save Changes
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-bold text-slate-900">{cat.name}</h4>
                                                {cat.isTeaching && (
                                                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase rounded-full border border-indigo-100">
                                                        Teaching
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Subcategories:</span>
                                                <p className="text-sm text-slate-600">
                                                    {cat.subcategories && cat.subcategories.length > 0
                                                        ? cat.subcategories.join(', ')
                                                        : <span className="text-slate-300 italic">None configured</span>}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleEditStart(cat)}
                                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                                title="Edit Category"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(cat._id)}
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                title="Delete Category"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs text-amber-900 leading-relaxed font-medium">
                    <span className="font-bold">Note:</span> Renaming a category or changing teaching status will not automatically update existing staff records assigned to this category. Staff records are updated only when they are edited individually.
                </p>
            </div>
        </div>
    );
}
