import { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../ui/Toast';

export default function StaffCategorySettings() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const { addToast } = useToast();

    const [newCatName, setNewCatName] = useState('');
    const [isTeaching, setIsTeaching] = useState(false);
    const [subcats, setSubcats] = useState('');

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
            addToast("Failed to add category", "error");
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Delete category?")) return;
        try {
            await api.delete(`/staff-categories/${id}`);
            addToast("Category deleted", "success");
            fetchCats();
        } catch (error) {
            addToast("Failed to delete", "error");
        }
    };

    return (
        <div className="p-6 space-y-8">
            {/* Add New Category Form */}
            <div className="bg-slate-50 p-5 rounded-lg border border-slate-200">
                <h3 className="font-semibold text-slate-800 mb-4">Add New Category</h3>
                <form onSubmit={handleAdd} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Category Name</label>
                            <input
                                value={newCatName}
                                onChange={e => setNewCatName(e.target.value)}
                                placeholder="e.g. Lab Assistant"
                                required
                                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-indigo-500 text-sm"
                            />
                        </div>
                        <div className="flex items-center pt-5">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isTeaching}
                                    onChange={e => setIsTeaching(e.target.checked)}
                                    className="rounded text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="text-sm font-medium text-slate-700">Is Teaching Staff?</span>
                            </label>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Subcategories (comma separated)</label>
                        <input
                            value={subcats}
                            onChange={e => setSubcats(e.target.value)}
                            placeholder="e.g. Junior, Senior, Head"
                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-indigo-500 text-sm"
                        />
                        <p className="text-xs text-slate-400 mt-1">These will appear in the subcategory dropdown when adding staff</p>
                    </div>
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            className="bg-indigo-600 text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors"
                        >
                            Add Category
                        </button>
                    </div>
                </form>
            </div>

            {/* Existing Categories */}
            <div>
                <h3 className="font-semibold text-slate-800 mb-3">Existing Categories</h3>
                {loading ? (
                    <p className="text-sm text-slate-500">Loading...</p>
                ) : categories.length === 0 ? (
                    <p className="text-sm text-slate-400 italic">No categories configured yet.</p>
                ) : (
                    <div className="space-y-3">
                        {categories.map(cat => (
                            <div key={cat._id} className="flex items-start justify-between p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-medium text-slate-900">{cat.name}</h4>
                                        {cat.isTeaching && (
                                            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full">Teaching</span>
                                        )}
                                    </div>
                                    <p className="text-sm text-slate-500 mt-1">
                                        Subcategories: {cat.subcategories?.join(', ') || 'None'}
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleDelete(cat._id)}
                                    className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
