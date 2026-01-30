import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useLocation } from 'react-router-dom';
import { Save, X, ChevronRight, ChevronLeft, Upload } from 'lucide-react';
import { storageService } from '../../services/storage';
import api from '../../services/api';

export default function AdmissionForm() {
    const navigate = useNavigate();
    const location = useLocation();
    const [step, setStep] = useState(1);

    // Prevent unregistering fields when they are hidden (vital for multi-step forms)
    const { register, handleSubmit, setValue, trigger, formState: { errors } } = useForm({ shouldUnregister: false });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Check for pre-fill data from ReadyForAdmission page
    useEffect(() => {
        if (location.state?.prefill) {
            const { prefill } = location.state;
            const fieldsToFill = ['firstName', 'middleName', 'lastName', 'dob', 'class', 'gender', 'bloodGroup', 'fatherName', 'motherName', 'guardian', 'contact', 'email', 'address'];

            fieldsToFill.forEach(field => {
                if (prefill[field]) {
                    let value = prefill[field];

                    // Normalize Gender (Title Case)
                    if (field === 'gender') {
                        value = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
                    }

                    // Normalize Class (Ensure 'Grade' prefix if missing, or match directly)
                    if (field === 'class') {
                        // If incoming is "Class 1", map to "Grade 1" if needed, or keep as is if it matches
                        // The user requested options are "Grade 1", so we might need mapping
                        if (value.startsWith('Class ')) {
                            value = value.replace('Class ', 'Grade ');
                        }
                    }

                    setValue(field, value);
                }
            });
            // If class is pre-selected, also set it explicitly just in case
            if (prefill.class) {
                let cls = prefill.class;
                if (cls.startsWith('Class ')) {
                    cls = cls.replace('Class ', 'Grade ');
                }
                setValue('class', cls);
            }
        }
    }, [location.state, setValue]);

    const onSubmit = async (data) => {
        setIsSubmitting(true);
        try {
            // Construct full name from parts
            const fullName = `${data.firstName} ${data.middleName ? data.middleName + ' ' : ''}${data.lastName}`;

            const newStudent = {
                ...data,
                name: fullName, // Backend expects 'name'
                guardian: data.guardian || data.fatherName, // Default to fatherName if guardian not provided
                className: data.class, // Map 'class' from form to 'className' in DB
                primaryPhone: data.contact, // Map 'contact' from form to 'primaryPhone' in DB
                admissionNo: data.admissionNo || `ADM${Date.now().toString().slice(-6)}`,
                status: 'Active',
                feesStatus: 'Pending',
                admissionDate: new Date().toISOString().split('T')[0],
                rollNo: data.rollNo || 'Not Assigned', // Use entered rollNo or default
            };

            await storageService.students.add(newStudent);

            // If this was from an enquiry, update the enquiry status to 'Enrolled'
            if (location.state?.prefill?.enquiryId) {
                // We need to import api service at the top first, assuming it's available
                // I'll handle the import in a separate edit or assume the user imports it if I can't do multiple edits here.
                // Wait, I can't import in this block.
                // I will add the logic here and then add the import separate.
                try {
                    const { enquiryId } = location.state.prefill;
                    await api.put(`/enquiries/${enquiryId}`, { status: 'Enrolled' });
                } catch (err) {
                    console.error("Failed to update enquiry status", err);
                    // We don't block the admission on this failure, but maybe show a toast warning?
                    // For now, silent failure log is acceptable as admission is primary.
                }
            }

            navigate('/admin/students');
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || 'Failed to admit student');
        } finally {
            setIsSubmitting(false);
        }
    };

    // ... (rest of code)


    const nextStep = async (e) => {
        e.preventDefault();
        let isValid = false;

        if (step === 1) {
            isValid = await trigger(['firstName', 'lastName', 'dob', 'gender', 'class']);
        } else if (step === 2) {
            isValid = await trigger(['fatherName', 'motherName', 'contact']);
        } else {
            isValid = true;
        }

        if (isValid) {
            setStep(s => s + 1);
        }
    };

    const prevStep = (e) => {
        e.preventDefault();
        setStep(s => s - 1);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">New Admission</h1>
                    <p className="text-slate-500">Enter student details for enrollment.</p>
                </div>
                <button
                    onClick={() => navigate('/admin/admissions')}
                    className="text-slate-500 hover:text-slate-700"
                >
                    <X size={24} />
                </button>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-center mb-8">
                <div className={`flex items-center ${step >= 1 ? 'text-indigo-600' : 'text-slate-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 font-bold ${step >= 1 ? 'border-indigo-600 bg-indigo-50' : 'border-slate-300'}`}>1</div>
                    <span className="ml-2 font-medium">Student Info</span>
                </div>
                <div className={`w-12 h-0.5 mx-4 ${step >= 2 ? 'bg-indigo-600' : 'bg-slate-300'}`}></div>
                <div className={`flex items-center ${step >= 2 ? 'text-indigo-600' : 'text-slate-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 font-bold ${step >= 2 ? 'border-indigo-600 bg-indigo-50' : 'border-slate-300'}`}>2</div>
                    <span className="ml-2 font-medium">Parents & Contact</span>
                </div>
                <div className={`w-12 h-0.5 mx-4 ${step >= 3 ? 'bg-indigo-600' : 'bg-slate-300'}`}></div>
                <div className={`flex items-center ${step >= 3 ? 'text-indigo-600' : 'text-slate-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 font-bold ${step >= 3 ? 'border-indigo-600 bg-indigo-50' : 'border-slate-300'}`}>3</div>
                    <span className="ml-2 font-medium">Documents</span>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 md:p-8">
                {step === 1 && (
                    <div className="space-y-6">
                        <h3 className="text-lg font-semibold text-slate-900 border-b pb-2">Personal Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">First Name <span className="text-red-500">*</span></label>
                                    <input
                                        {...register('firstName', { required: true })}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none ${errors.firstName ? 'border-red-500' : 'border-slate-300'}`}
                                        placeholder="First Name"
                                    />
                                    {errors.firstName && <p className="text-xs text-red-500 mt-1">First Name is required</p>}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Middle Name</label>
                                    <input
                                        {...register('middleName')}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                        placeholder="Middle Name"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Last Name <span className="text-red-500">*</span></label>
                                    <input
                                        {...register('lastName', { required: true })}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none ${errors.lastName ? 'border-red-500' : 'border-slate-300'}`}
                                        placeholder="Last Name"
                                    />
                                    {errors.lastName && <p className="text-xs text-red-500 mt-1">Last Name is required</p>}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Date of Birth <span className="text-red-500">*</span></label>
                                <input
                                    type="date"
                                    {...register('dob', { required: true })}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none ${errors.dob ? 'border-red-500' : 'border-slate-300'}`}
                                />
                                {errors.dob && <p className="text-xs text-red-500 mt-1">Date of Birth is required</p>}
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Gender <span className="text-red-500">*</span></label>
                                <select
                                    {...register('gender', { required: true })}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none ${errors.gender ? 'border-red-500' : 'border-slate-300'}`}
                                >
                                    <option value="">Select Gender</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                                {errors.gender && <p className="text-xs text-red-500 mt-1">Gender is required</p>}
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Blood Group</label>
                                <select
                                    {...register('bloodGroup')}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                >
                                    <option value="">Select Group</option>
                                    <option value="A+">A+</option>
                                    <option value="A-">A-</option>
                                    <option value="B+">B+</option>
                                    <option value="B-">B-</option>
                                    <option value="AB+">AB+</option>
                                    <option value="AB-">AB-</option>
                                    <option value="O+">O+</option>
                                    <option value="O-">O-</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Admission Class <span className="text-red-500">*</span></label>
                                <select
                                    {...register('class', { required: true })}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none ${errors.class ? 'border-red-500' : 'border-slate-300'}`}
                                >
                                    <option value="">Select Class</option>
                                    <option value="Mont 1">Mont 1</option>
                                    <option value="Mont 2">Mont 2</option>
                                    <option value="Grade 1">Grade 1</option>
                                    <option value="Grade 2">Grade 2</option>
                                    <option value="Grade 3">Grade 3</option>
                                    <option value="Grade 4">Grade 4</option>
                                    <option value="Grade 5">Grade 5</option>
                                </select>
                                {errors.class && <p className="text-xs text-red-500 mt-1">Class is required</p>}
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Section</label>
                                <select
                                    {...register('section')}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                >
                                    <option value="A">A</option>
                                    <option value="B">B</option>
                                    <option value="C">C</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-6">
                        <h3 className="text-lg font-semibold text-slate-900 border-b pb-2">Guardian Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Father's Name <span className="text-red-500">*</span></label>
                                <input
                                    {...register('fatherName', { required: true })}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none ${errors.fatherName ? 'border-red-500' : 'border-slate-300'}`}
                                />
                                {errors.fatherName && <p className="text-xs text-red-500 mt-1">Father's Name is required</p>}
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Mother's Name <span className="text-red-500">*</span></label>
                                <input
                                    {...register('motherName', { required: true })}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none ${errors.motherName ? 'border-red-500' : 'border-slate-300'}`}
                                />
                                {errors.motherName && <p className="text-xs text-red-500 mt-1">Mother's Name is required</p>}
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Primary Contact (Guardian)</label>
                                <input
                                    {...register('guardian')} // Maps to list view 'guardian'
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    placeholder="Guardian Name"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Phone Number <span className="text-red-500">*</span></label>
                                <input
                                    type="tel"
                                    {...register('contact', { required: true })}
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none ${errors.contact ? 'border-red-500' : 'border-slate-300'}`}
                                />
                                {errors.contact && <p className="text-xs text-red-500 mt-1">Phone Number is required</p>}
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Email Address (Optional)</label>
                                <input
                                    type="email"
                                    {...register('email')}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    placeholder="parent@example.com"
                                />
                            </div>
                            <div className="col-span-1 md:col-span-2 space-y-2">
                                <label className="text-sm font-medium text-slate-700">Residential Address</label>
                                <textarea
                                    {...register('address')}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-6">
                        <h3 className="text-lg font-semibold text-slate-900 border-b pb-2">Documents Upload</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {['Birth Certificate', 'Previous Marksheet', 'Transfer Certificate', 'Aadhar Card'].map((doc) => (
                                <div key={doc} className="border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors cursor-pointer">
                                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-full mb-3">
                                        <Upload size={24} />
                                    </div>
                                    <p className="font-medium text-slate-900">{doc}</p>
                                    <p className="text-sm text-slate-500 mt-1">Click to upload or drag & drop</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Footer Actions */}
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-200">
                    {step > 1 ? (
                        <button
                            onClick={prevStep}
                            className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 flex items-center gap-2"
                        >
                            <ChevronLeft size={20} />
                            Previous
                        </button>
                    ) : <div></div>}

                    {step < 3 ? (
                        <button
                            onClick={nextStep}
                            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
                        >
                            Next
                            <ChevronRight size={20} />
                        </button>
                    ) : (
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-8 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 disabled:opacity-70"
                        >
                            <Save size={20} />
                            {isSubmitting ? 'Submitting...' : 'Submit Admission'}
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}
