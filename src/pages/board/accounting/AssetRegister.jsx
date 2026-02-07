import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { Plus, Trash2 } from 'lucide-react';

export default function AssetRegister() {
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        purchaseDate: '',
        purchaseCost: '',
        salvageValue: '0',
        usefulLifeYears: '5',
        description: ''
    });

    const fetchAssets = async () => {
        setLoading(true);
        try {
            const res = await api.get('/accounting/assets');
            setAssets(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAssets();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/accounting/assets', formData);
            setShowModal(false);
            setFormData({
                name: '',
                purchaseDate: '',
                purchaseCost: '',
                salvageValue: '0',
                usefulLifeYears: '5',
                description: ''
            });
            fetchAssets();
        } catch (error) {
            console.error("Failed to add asset", error);
            alert("Failed to add asset");
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-slate-800">Fixed Asset Register</h2>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    <Plus size={18} />
                    Add Asset
                </button>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
                <table className="w-full text-left bg-white">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Asset Name</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Purchase Date</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Cost</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Salvage Value</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Life (Yrs)</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Depreciation (Yr)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan="6" className="p-8 text-center text-slate-500">Loading assets...</td></tr>
                        ) : assets.length === 0 ? (
                            <tr><td colSpan="6" className="p-8 text-center text-slate-500">No assets recorded.</td></tr>
                        ) : (
                            assets.map((asset) => (
                                <tr key={asset._id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 font-medium text-slate-800">
                                        {asset.name}
                                        {asset.description && <p className="text-xs text-slate-400 font-normal">{asset.description}</p>}
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">
                                        {new Date(asset.purchaseDate).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right font-medium text-slate-800">
                                        {formatCurrency(asset.purchaseCost)}
                                    </td>
                                    <td className="px-6 py-4 text-right text-slate-500">
                                        {formatCurrency(asset.salvageValue)}
                                    </td>
                                    <td className="px-6 py-4 text-right text-slate-600">
                                        {asset.usefulLifeYears}
                                    </td>
                                    <td className="px-6 py-4 text-right text-emerald-600 font-medium">
                                        {formatCurrency(asset.annualDepreciation)}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-slate-800">New Asset</h3>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                                <span className="text-2xl">×</span>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">Asset Name</label>
                                <input required type="text" name="name" value={formData.name} onChange={handleChange} className="w-full border p-2 rounded-lg" placeholder="e.g. MacBook Pro" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">Purchase Date</label>
                                <input required type="date" name="purchaseDate" value={formData.purchaseDate} onChange={handleChange} className="w-full border p-2 rounded-lg" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1">Cost</label>
                                    <input required type="number" name="purchaseCost" value={formData.purchaseCost} onChange={handleChange} className="w-full border p-2 rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1">Life (Years)</label>
                                    <input required type="number" name="usefulLifeYears" value={formData.usefulLifeYears} onChange={handleChange} className="w-full border p-2 rounded-lg" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1">Salvage Value</label>
                                    <input required type="number" name="salvageValue" value={formData.salvageValue} onChange={handleChange} className="w-full border p-2 rounded-lg" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">Description</label>
                                <textarea name="description" value={formData.description} onChange={handleChange} className="w-full border p-2 rounded-lg" rows="2"></textarea>
                            </div>
                            <button type="submit" className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700">Save Asset</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
