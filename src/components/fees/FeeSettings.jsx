import { useState, useEffect } from 'react';
import { Settings, Plus, X, Save, Trash2, Edit2, AlertCircle, Info } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../components/ui/Toast';

export default function FeeSettings({ onClose, isInline = false }) {
    const { addToast } = useToast();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    // Form State
    const [isEditing, setIsEditing] = useState(false);
    const [currentId, setCurrentId] = useState(null);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [hasSlabs, setHasSlabs] = useState(false);
    const [baseAmount, setBaseAmount] = useState(0);
    const [slabMultiplier, setSlabMultiplier] = useState(0);
    const [months, setMonths] = useState(10);

    // Class-specific amounts
    const availableClasses = ['Mont 1', 'Mont 2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5'];
    const [amounts, setAmounts] = useState(
        availableClasses.map(cls => ({ className: cls, amount: 0 }))
    );

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const response = await api.get('/fee-categories');
            setCategories(response.data);
        } catch (error) {
            console.error('Failed to fetch fee categories:', error);
            addToast('Failed to load fee categories', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleAmountChange = (className, value) => {
        setAmounts(prev => prev.map(a =>
            a.className === className ? { ...a, amount: Number(value) } : a
        ));
    };

    const resetForm = () => {
        setIsEditing(false);
        setCurrentId(null);
        setName('');
        setDescription('');
        setIsActive(true);
        setHasSlabs(false);
        setBaseAmount(0);
        setSlabMultiplier(0);
        setMonths(10);
        setAmounts(availableClasses.map(cls => ({ className: cls, amount: 0 })));
    };

    const handleEdit = (category) => {
        setIsEditing(true);
        setCurrentId(category._id);
        setName(category.name);
        setDescription(category.description || '');
        setIsActive(category.isActive);
        setHasSlabs(category.hasSlabs || false);
        setBaseAmount(category.baseAmount || 0);
        setSlabMultiplier(category.slabMultiplier || 0);
        setMonths(category.months || 10);

        // Merge existing amounts with available classes to ensure all inputs render
        const mergedAmounts = availableClasses.map(cls => {
            const existing = category.amounts.find(a => a.className === cls);
            return existing ? existing : { className: cls, amount: 0 };
        });
        setAmounts(mergedAmounts);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                name,
                description,
                isActive,
                hasSlabs,
                baseAmount: Number(baseAmount),
                slabMultiplier: Number(slabMultiplier),
                months: Number(months),
                amounts: amounts.filter(a => a.amount >= 0) // filter out invalid negative attempts
            };

            if (currentId) {
                await api.put(`/fee-categories/${currentId}`, payload);
                addToast('Category updated successfully', 'success');
            } else {
                await api.post('/fee-categories', payload);
                addToast('Category created successfully', 'success');
            }

            resetForm();
            fetchCategories();
        } catch (error) {
            console.error(error);
            addToast(error.response?.data?.message || 'Failed to save category', 'error');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this fee category? This may affect historical reporting.')) return;

        try {
            await api.delete(`/fee-categories/${id}`);
            addToast('Category deleted successfully', 'success');
            fetchCategories();
        } catch (error) {
            console.error(error);
            addToast('Failed to delete category', 'error');
        }
    };

    const content = (
        <div className={isInline ? "w-full flex flex-col overflow-hidden" : "bg-white rounded-2xl shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden"}>
            {/* Header */}
            {!isInline && (
                <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
                            <Settings size={22} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">Fee Configuration</h2>
                            <p className="text-sm text-slate-500">Manage dynamic fee categories and class-specific amounts</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
                        <X size={24} />
                    </button>
                </div>
            )}

            <div className="flex-1 overflow-auto flex flex-col lg:flex-row">
                {/* Left Panel: List of Categories */}
                <div className="w-full lg:w-1/3 border-r border-slate-100 bg-slate-50 p-6 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-slate-700">Categories</h3>
                        {!isEditing && (
                            <button onClick={resetForm} className="text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-700 bg-indigo-100 hover:bg-indigo-200 px-2 py-1 rounded transition-colors font-medium">
                                <Plus size={14} /> New
                            </button>
                        )}
                        {isEditing && (
                            <button onClick={resetForm} className="text-xs text-slate-500 hover:text-slate-700 border border-slate-300 bg-white px-2 py-1 rounded transition-colors">
                                Cancel Edit
                            </button>
                        )}
                    </div>

                    {loading ? (
                        <div className="flex justify-center p-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                        </div>
                    ) : categories.length === 0 ? (
                        <div className="text-center p-8 text-slate-400 border border-dashed border-slate-300 rounded-xl bg-white">
                            <AlertCircle size={32} className="mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No fee categories configured.</p>
                        </div>
                    ) : (
                        <div className="space-y-3 overflow-y-auto pr-2 pb-4">
                            {categories.map(category => (
                                <div
                                    key={category._id}
                                    className={`p-4 rounded-xl border transition-all ${currentId === category._id ? 'border-indigo-500 bg-indigo-50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300 shadow-sm'}`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">
                                            {category.name}
                                            {category.hasSlabs && <span className="ml-2 text-[10px] uppercase bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">Slab Based</span>}
                                            {!category.isActive && <span className="ml-2 text-[10px] uppercase bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">Inactive</span>}
                                        </h4>
                                        <div className="flex gap-2 text-slate-400">
                                            <button onClick={() => handleEdit(category)} className="hover:text-indigo-600 transition-colors" title="Edit">
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(category._id)} className="hover:text-red-600 transition-colors" title="Delete">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    {category.description && <p className="text-xs text-slate-500 line-clamp-2">{category.description}</p>}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right Panel: Editor */}
                <div className="w-full lg:w-2/3 p-6 bg-white overflow-y-auto">
                    <h3 className="text-lg font-semibold text-slate-800 mb-6 border-b border-slate-100 pb-2">
                        {currentId ? 'Edit Category' : 'Create New Category'}
                    </h3>

                    <form onSubmit={handleSave} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Category Name *</label>
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    placeholder="e.g. Tuition Fee"
                                />
                            </div>
                            <div className="flex items-center mt-6">
                                <label className="flex items-center cursor-pointer">
                                    <div className="relative">
                                        <input
                                            type="checkbox"
                                            className="sr-only"
                                            checked={isActive}
                                            onChange={(e) => setIsActive(e.target.checked)}
                                        />
                                        <div className={`block w-10 h-6 rounded-full transition-colors ${isActive ? 'bg-indigo-500' : 'bg-slate-300'}`}></div>
                                        <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${isActive ? 'transform translate-x-4' : ''}`}></div>
                                    </div>
                                    <div className="ml-3 font-medium text-sm text-slate-700">
                                        Active Status
                                    </div>
                                </label>
                            </div>
                        </div>

                        <div className="flex items-center">
                            <label className="flex items-center cursor-pointer">
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        className="sr-only"
                                        checked={hasSlabs}
                                        onChange={(e) => setHasSlabs(e.target.checked)}
                                    />
                                    <div className={`block w-10 h-6 rounded-full transition-colors ${hasSlabs ? 'bg-amber-500' : 'bg-slate-300'}`}></div>
                                    <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${hasSlabs ? 'transform translate-x-4' : ''}`}></div>
                                </div>
                                <div className="ml-3 font-medium text-sm text-slate-700">
                                    Is Slab-Based (e.g., Conveyance)
                                    <p className="text-xs text-slate-500 font-normal mt-0.5">Overrides class-specific static amounts.</p>
                                </div>
                            </label>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Description (Optional)</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                rows="2"
                                placeholder="Brief description of this fee..."
                            />
                        </div>

                        <div className="pt-4 border-t border-slate-100">
                            {hasSlabs ? (
                                <>
                                    <h4 className="text-sm font-semibold text-slate-800 mb-4">Slab Configuration</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 bg-amber-50/50 p-4 rounded-xl border border-amber-100">
                                        <div>
                                            <label className="block text-xs font-medium text-slate-700 mb-1.5">Base Amount (₹)</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={baseAmount === 0 ? '' : baseAmount}
                                                onChange={(e) => setBaseAmount(e.target.value)}
                                                placeholder="e.g. 200"
                                                className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-amber-500 focus:outline-none text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-700 mb-1.5">Multiplier Per Slab (₹)</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={slabMultiplier === 0 ? '' : slabMultiplier}
                                                onChange={(e) => setSlabMultiplier(e.target.value)}
                                                placeholder="e.g. 100"
                                                className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-amber-500 focus:outline-none text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-700 mb-1.5">Months Charged</label>
                                            <input
                                                type="number"
                                                min="1"
                                                max="12"
                                                value={months}
                                                onChange={(e) => setMonths(e.target.value)}
                                                className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-2 focus:ring-amber-500 focus:outline-none text-sm"
                                            />
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-3 flex gap-2">
                                        <Info size={14} className="text-amber-500 flex-shrink-0" />
                                        Formula: (Base Amount + (Student's Conveyance Slab * Multiplier)) * Months. <br />
                                        If a student has no slab, the fee due will be ₹0.
                                    </p>
                                </>
                            ) : (
                                <>
                                    <h4 className="text-sm font-semibold text-slate-800 mb-4 flex items-center justify-between">
                                        <span>Class-Specific Amounts</span>
                                        <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-1 rounded">Set '0' if not applicable</span>
                                    </h4>

                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                                        {amounts.map((item) => (
                                            <div key={item.className} className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                                                <label className="block text-xs font-medium text-slate-600 mb-1.5">{item.className}</label>
                                                <div className="relative">
                                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₹</span>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={item.amount === 0 ? '' : item.amount} // Show empty string for 0 to make it easier to type
                                                        onChange={(e) => handleAmountChange(item.className, e.target.value)}
                                                        placeholder="0"
                                                        className="w-full pl-6 pr-2 py-1.5 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="pt-6 flex justify-end">
                            <button
                                type="submit"
                                disabled={!name}
                                className="px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 shadow-sm flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Save size={18} />
                                {currentId ? 'Save Changes' : 'Create Category'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );

    if (isInline) return content;

    return (
        <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4 animate-in fade-in backdrop-blur-sm">
            {content}
        </div>
    );
}
