import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
    ArrowLeft,
    Save,
    User,
    Phone,
    MapPin,
    Calendar,
    Briefcase,
    Mail,
    Upload,
    FileText,
    CheckCircle2,
    X,
    Heart,
    Shield,
    Camera
} from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../components/ui/Toast';

export default function StaffForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToast } = useToast();
    const isEdit = !!id;

    const [loading, setLoading] = useState(isEdit);
    const [submitting, setSubmitting] = useState(false);
    const [idCardPreview, setIdCardPreview] = useState(null);
    const [idCardFile, setIdCardFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [photoFile, setPhotoFile] = useState(null);
    const [subjects, setSubjects] = useState([]);
    const [categories, setCategories] = useState([]);

    const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
        defaultValues: {
            role: 'Teacher',
            category: 'Teacher',
            isMarried: false,
            joiningDate: new Date().toISOString().split('T')[0],
            status: 'Active'
        }
    });

    const isMarried = watch('isMarried');
    const selectedCategoryName = watch('category');

    const selectedCategory = categories.find(c => c.name === selectedCategoryName);
    const availableSubcategories = selectedCategory?.subcategories || [];

    useEffect(() => {
        fetchSubjects();
        fetchCategories();
        if (isEdit) {
            fetchStaff();
        }
    }, [id]);

    useEffect(() => {
        // Clear subcategory if it doesn't belong to the new category
        if (selectedCategoryName && !isEdit) {
            setValue('subcategory', '');
        }
    }, [selectedCategoryName]);

    const fetchSubjects = async () => {
        try {
            const { data } = await api.get('/academics/subjects');
            setSubjects(data);
        } catch (error) {
            console.error('Failed to fetch subjects:', error);
        }
    };

    const fetchCategories = async () => {
        try {
            const { data } = await api.get('/staff-categories');
            setCategories(data);
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        }
    };

    const fetchStaff = async () => {
        try {
            const { data } = await api.get(`/staff/${id}`);
            const formattedData = {
                ...data,
                joiningDate: data.joiningDate ? new Date(data.joiningDate).toISOString().split('T')[0] : '',
                subjects: data.subjects?.map(s => s._id) || []
            };
            reset(formattedData);
            if (data.idCardImage) setIdCardPreview(data.idCardImage);
            if (data.photoUrl) {
                // Show the photo; fetch a signed URL as fallback in case GCS object isn't public
                try {
                    const signRes = await api.get('/upload/signed-url', { params: { fileName: data.photoUrl } });
                    setPhotoPreview(signRes.data.signedUrl || data.photoUrl);
                } catch {
                    setPhotoPreview(data.photoUrl);
                }
            }
        } catch (error) {
            console.error('Failed to fetch staff:', error);
            addToast('Failed to load staff details', 'error');
            navigate('/admin/staff');
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setIdCardFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setIdCardPreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setPhotoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setPhotoPreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const uploadFile = async () => {
        if (!idCardFile) return watch('idCardImage');

        const formData = new FormData();
        formData.append('file', idCardFile);
        formData.append('category', 'Staff ID Card');

        try {
            const { data } = await api.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return data.url;
        } catch (error) {
            console.error('File upload failed:', error);
            throw new Error('Failed to upload ID card image');
        }
    };

    const uploadPhoto = async (staffId) => {
        if (!photoFile) return null;
        const formData = new FormData();
        formData.append('file', photoFile);
        formData.append('category', 'Staff Photo');
        formData.append('staffId', staffId);
        try {
            const { data } = await api.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return data.url;
        } catch (error) {
            console.error('Photo upload failed:', error);
            throw new Error('Failed to upload staff photo');
        }
    };

    const onSubmit = async (formData) => {
        setSubmitting(true);
        try {
            let idCardImageUrl = formData.idCardImage;
            if (idCardFile) {
                idCardImageUrl = await uploadFile();
            }

            // For photo: if editing, we know the ID; if creating, we get it after
            let photoUrl = formData.photoUrl || '';

            const payload = {
                ...formData,
                idCardImage: idCardImageUrl,
                photoUrl
            };

            let savedId = id;
            if (isEdit) {
                // Upload photo first if changed
                if (photoFile) {
                    photoUrl = await uploadPhoto(id) || photoUrl;
                }
                await api.put(`/staff/${id}`, { ...payload, photoUrl });
                addToast('Staff updated successfully', 'success');
            } else {
                const { data: created } = await api.post('/staff', payload);
                savedId = created._id;
                // Upload photo after creation (need the ID for path)
                if (photoFile) {
                    photoUrl = await uploadPhoto(savedId) || '';
                    await api.put(`/staff/${savedId}`, { photoUrl });
                }
                addToast('Staff added successfully', 'success');
            }
            navigate('/admin/staff');
        } catch (error) {
            console.error('Submission failed:', error);
            addToast(error.message || 'Failed to save staff details', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto pb-20">
            {/* Header */}
            <div className="flex items-center justify-between mb-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/admin/staff')}
                        className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
                    >
                        <ArrowLeft size={24} />
                    </button>

                    {/* Profile Photo Upload */}
                    <div className="relative group">
                        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-indigo-200 shadow-md bg-indigo-50 flex items-center justify-center cursor-pointer"
                            onClick={() => document.getElementById('staff-photo-input').click()}>
                            {photoPreview ? (
                                <img src={photoPreview} alt="Photo" className="w-full h-full object-cover" />
                            ) : (
                                <User size={28} className="text-indigo-300" />
                            )}
                        </div>
                        {/* Camera overlay */}
                        <label htmlFor="staff-photo-input"
                            className="absolute inset-0 rounded-full flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                            <Camera size={18} className="text-white" />
                        </label>
                        <input
                            id="staff-photo-input"
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handlePhotoChange}
                        />
                        {photoPreview && (
                            <button type="button"
                                onClick={() => {
                                    setPhotoPreview(null);
                                    setPhotoFile(null);
                                    setValue('photoUrl', '');
                                }}
                                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white shadow-md hover:bg-red-600 transition-colors">
                                <X size={11} />
                            </button>
                        )}
                        <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-medium text-slate-400">Photo</div>
                    </div>

                    <div className="ml-2">
                        <h1 className="text-2xl font-bold text-slate-900">
                            {isEdit ? 'Edit Staff Member' : 'Add New Staff Member'}
                        </h1>
                        <p className="text-slate-500 text-sm">
                            {isEdit ? 'Update the details of the existing staff member' : 'Fill in the information to register a new staff member'}
                        </p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => navigate('/admin/staff')}
                        className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit(onSubmit)}
                        disabled={submitting}
                        className="px-6 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl font-semibold shadow-lg shadow-indigo-200 disabled:opacity-70 flex items-center gap-2 transition-all active:scale-95"
                    >
                        {submitting ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Save size={20} />
                        )}
                        {isEdit ? 'Update Staff' : 'Save Staff'}
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                {/* Personal Information Section */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="px-8 py-6 bg-slate-50/50 border-b border-slate-100 flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                            <User size={20} />
                        </div>
                        <h2 className="text-lg font-bold text-slate-900">Personal Information</h2>
                    </div>

                    <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Full Name <span className="text-red-500">*</span></label>
                            <input
                                {...register('name', { required: 'Name is required' })}
                                className={`w-full px-4 py-2.5 rounded-xl border ${errors.name ? 'border-red-300 bg-red-50' : 'border-slate-200 focus:border-indigo-500'} focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all`}
                                placeholder="e.g. John Doe"
                            />
                            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Email Address <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="email"
                                    {...register('email', {
                                        required: 'Email is required',
                                        pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' }
                                    })}
                                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border ${errors.email ? 'border-red-300 bg-red-50' : 'border-slate-200 focus:border-indigo-500'} focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all`}
                                    placeholder="john@example.com"
                                />
                            </div>
                            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Phone Number <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    {...register('phone', { required: 'Phone is required' })}
                                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl border ${errors.phone ? 'border-red-300 bg-red-50' : 'border-slate-200 focus:border-indigo-500'} focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all`}
                                    placeholder="e.g. 9876543210"
                                />
                            </div>
                            {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Date of Joining</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="date"
                                    {...register('joiningDate')}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Educational Qualification</label>
                            <input
                                {...register('qualification')}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                                placeholder="e.g. M.Sc B.Ed"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Marital Status</label>
                            <div className="flex gap-4 mt-2">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input
                                        type="radio"
                                        checked={!isMarried}
                                        onChange={() => setValue('isMarried', false)}
                                        className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300"
                                    />
                                    <span className="text-sm text-slate-700 group-hover:text-slate-900 transition-colors">Single</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input
                                        type="radio"
                                        checked={isMarried}
                                        onChange={() => setValue('isMarried', true)}
                                        className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300"
                                    />
                                    <span className="text-sm text-slate-700 group-hover:text-slate-900 transition-colors">Married</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="px-8 pb-8">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Residential Address</label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-3 text-slate-400" size={18} />
                                <textarea
                                    {...register('address')}
                                    rows={3}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all resize-none"
                                    placeholder="Enter full residential address"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Spouse Details (Conditional) */}
                {isMarried && (
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                        <div className="px-8 py-6 bg-pink-50/30 border-b border-pink-100 flex items-center gap-3">
                            <div className="p-2 bg-pink-100 text-pink-600 rounded-lg">
                                <Heart size={20} />
                            </div>
                            <h2 className="text-lg font-bold text-slate-900">Spouse Details</h2>
                        </div>

                        <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Spouse Name</label>
                                <input
                                    {...register('spouseName')}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                                    placeholder="Spouse Name"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Spouse Phone</label>
                                <input
                                    {...register('spousePhone')}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                                    placeholder="Phone Number"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Spouse Email</label>
                                <input
                                    type="email"
                                    {...register('spouseEmail')}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                                    placeholder="Email Address"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Professional Information Section */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="px-8 py-6 bg-slate-50/50 border-b border-slate-100 flex items-center gap-3">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                            <Briefcase size={20} />
                        </div>
                        <h2 className="text-lg font-bold text-slate-900">Professional Details</h2>
                    </div>

                    <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Role/Designation</label>
                            <input
                                {...register('role')}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                                placeholder="e.g. Senior Teacher"
                            />
                        </div>

                        <div className="md:col-span-2 space-y-4">
                            <label className="text-sm font-semibold text-slate-700 block">Subjects (For Teachers)</label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                {subjects.map(s => (
                                    <label key={s._id} className="flex items-center gap-2 p-2 hover:bg-white rounded-lg transition-colors cursor-pointer group border border-transparent hover:border-slate-200">
                                        <input
                                            type="checkbox"
                                            value={s._id}
                                            {...register("subjects")}
                                            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                                        />
                                        <span className="text-sm text-slate-600 group-hover:text-slate-900">{s.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">HR Category</label>
                                <select
                                    {...register('category')}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                                >
                                    <option value="">Select Category</option>
                                    {categories.map(c => (
                                        <option key={c._id} value={c.name}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Subcategory</label>
                                <select
                                    {...register('subcategory')}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                                    disabled={!availableSubcategories.length}
                                >
                                    <option value="">Select Subcategory</option>
                                    {availableSubcategories.map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                                {!availableSubcategories.length && selectedCategoryName && (
                                    <p className="text-[10px] text-slate-400">No subcategories defined for this category</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ID Proof Section */}
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="px-8 py-6 bg-slate-50/50 border-b border-slate-100 flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                            <Shield size={20} />
                        </div>
                        <h2 className="text-lg font-bold text-slate-900">Identification Details</h2>
                    </div>

                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Aadhar / ID Card Number</label>
                            <div className="relative">
                                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    {...register('idCardNumber')}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                                    placeholder="Enter ID number"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-sm font-semibold text-slate-700">ID Card Image (Upload)</label>
                            <div className="flex items-start gap-4">
                                <div className="flex-1">
                                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-2xl cursor-pointer hover:bg-slate-50 hover:border-indigo-300 transition-all">
                                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                            <Upload className="w-8 h-8 text-slate-400 mb-2" />
                                            <p className="text-xs text-slate-500"><span className="font-semibold text-indigo-600">Click to upload</span> or drag and drop</p>
                                            <p className="text-[10px] text-slate-400 mt-1">PNG, JPG or PDF (MAX. 5MB)</p>
                                        </div>
                                        <input type="file" className="hidden" onChange={handleFileChange} accept="image/*,application/pdf" />
                                    </label>
                                </div>
                                {idCardPreview && (
                                    <div className="relative w-32 h-32 rounded-2xl overflow-hidden border border-slate-200 shadow-sm group">
                                        <img src={idCardPreview} alt="ID card preview" className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIdCardPreview(null);
                                                setIdCardFile(null);
                                                setValue('idCardImage', '');
                                            }}
                                            className="absolute top-1 right-1 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all hover:scale-110 shadow-lg"
                                        >
                                            <X size={14} />
                                        </button>
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                            <CheckCircle2 className="text-white" size={24} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
