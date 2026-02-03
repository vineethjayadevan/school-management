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
    const { register, handleSubmit, setValue, watch, trigger, formState: { errors } } = useForm({
        shouldUnregister: false,
        mode: 'onChange'
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Watch boolean fields for conditional rendering
    const hasLearningDisability = watch('hasLearningDisability');
    const hasMedicalCondition = watch('hasMedicalCondition');
    const hasAllergy = watch('hasAllergy');

    // Check for pre-fill data from ReadyForAdmission page
    useEffect(() => {
        if (location.state?.prefill) {
            const { prefill } = location.state;
            console.log("DEBUG: AdmissionForm Received Prefill:", prefill);
            const fieldsToFill = ['firstName', 'middleName', 'lastName', 'dob', 'class', 'gender', 'bloodGroup', 'fatherName', 'motherName', 'guardian', 'contact', 'email', 'address'];

            fieldsToFill.forEach(field => {
                if (prefill[field]) {
                    let value = prefill[field];
                    console.log(`DEBUG: Processing field ${field} with value:`, value);

                    // Normalize Gender
                    if (field === 'gender') {
                        const v = value.toString().toLowerCase().trim();
                        if (v === 'male' || v === 'm') value = 'Male';
                        else if (v === 'female' || v === 'f') value = 'Female';
                        else if (v === 'other') value = 'Other';
                    }

                    // Normalize Blood Group
                    if (field === 'bloodGroup') {
                        // Remove spaces and uppercase
                        let v = value.toString().toUpperCase().replace(/\s/g, '');
                        // Handle written forms
                        v = v.replace('POSITIVE', '+').replace('NEGATIVE', '-');

                        const validGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
                        if (validGroups.includes(v)) {
                            value = v;
                        }
                    }

                    // Normalize Class (Ensure 'Grade' prefix if missing, or match directly)
                    if (field === 'class') {
                        // If incoming is "Class 1", map to "Grade 1" if needed, or keep as is if it matches
                        // The user requested options are "Grade 1", so we might need mapping
                        if (value.startsWith('Class ')) {
                            value = value.replace('Class ', 'Grade ');
                        }
                    }

                    console.log(`DEBUG: Setting value for ${field}:`, value);
                    setValue(field, value);
                } else {
                    console.log(`DEBUG: No value found for field ${field}`);
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
                guardian: data.fatherName || data.motherName, // Automatic mapping to Father or Mother name
                className: data.class, // Map 'class' from form to 'className' in DB
                primaryPhone: data.fatherMobile, // Map mandatory 'fatherMobile' to 'primaryPhone'
                email: data.fatherEmail || data.motherEmail, // Map available email
                // admissionNo: data.admissionNo, // Already in data
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
            isValid = await trigger(['applicationNo', 'submissionDate', 'admissionNo', 'firstName', 'lastName', 'dob', 'gender', 'class']);
        } else if (step === 2) {
            isValid = await trigger(['fatherName', 'motherName', 'fatherMobile', 'motherMobile']);
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
                    <div className="space-y-8">
                        {/* Administrative Details */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold text-slate-900 border-b pb-2">Administrative Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Application No <span className="text-red-500">*</span></label>
                                    <input
                                        {...register('applicationNo', { required: true })}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none ${errors.applicationNo ? 'border-red-500' : 'border-slate-300'}`}
                                        placeholder="App No"
                                    />
                                    {errors.applicationNo && <p className="text-xs text-red-500 mt-1">Application No is required</p>}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Date of Submission <span className="text-red-500">*</span></label>
                                    <input
                                        type="date"
                                        {...register('submissionDate', { required: true })}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none ${errors.submissionDate ? 'border-red-500' : 'border-slate-300'}`}
                                    />
                                    {errors.submissionDate && <p className="text-xs text-red-500 mt-1">Date is required</p>}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Admission No <span className="text-red-500">*</span></label>
                                    <input
                                        {...register('admissionNo', { required: true })}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none ${errors.admissionNo ? 'border-red-500' : 'border-slate-300'}`}
                                        placeholder="Adm No"
                                    />
                                    {errors.admissionNo && <p className="text-xs text-red-500 mt-1">Admission No is required</p>}
                                </div>
                            </div>
                        </div>

                        {/* Personal Information */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold text-slate-900 border-b pb-2">Personal Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Place of Birth</label>
                                    <input
                                        {...register('placeOfBirth')}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                        placeholder="City/Town"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Nationality</label>
                                    <input
                                        {...register('nationality')}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                        placeholder="Nationality"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Religion</label>
                                    <input
                                        {...register('religion')}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                        placeholder="Religion"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Caste/Community</label>
                                    <input
                                        {...register('caste')}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                        placeholder="Caste"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Category</label>
                                    <select
                                        {...register('category')}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    >
                                        <option value="">Select Category</option>
                                        <option value="General">General</option>
                                        <option value="SC">SC</option>
                                        <option value="ST">ST</option>
                                        <option value="OBC">OBC</option>
                                        <option value="Others">Others</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Aadhar Number</label>
                                    <input
                                        {...register('aadharNo')}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                        placeholder="12-digit Aadhar"
                                    />
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

                            </div>
                        </div>

                        {/* Previous Schooling */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold text-slate-900 border-b pb-2">Previous Education</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="col-span-1 md:col-span-2">
                                    <label className="text-sm font-medium text-slate-700">Previous School Attended</label>
                                    <input
                                        {...register('previousSchool')}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                        placeholder="School Name"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Previous Class</label>
                                    <select
                                        {...register('previousClass')}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
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
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Medium of Instruction</label>
                                    <input
                                        {...register('mediumOfInstruction')}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                        placeholder="e.g. English, Malayalam"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Health & Other Details */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold text-slate-900 border-b pb-2">Health & Other Details</h3>
                            <div className="grid grid-cols-1 gap-6">
                                {/* Learning Disabilities */}
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <input type="checkbox" id="hasLearningDisability" {...register('hasLearningDisability')} className="w-4 h-4 text-indigo-600 rounded" />
                                        <label htmlFor="hasLearningDisability" className="text-sm font-medium text-slate-700">Any Learning Disabilities?</label>
                                    </div>
                                    {hasLearningDisability && (
                                        <textarea
                                            {...register('learningDisabilityDetails')}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none mt-2"
                                            placeholder="Please provide details..."
                                            rows={2}
                                        />
                                    )}
                                </div>

                                {/* Medical Conditions */}
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <input type="checkbox" id="hasMedicalCondition" {...register('hasMedicalCondition')} className="w-4 h-4 text-indigo-600 rounded" />
                                        <label htmlFor="hasMedicalCondition" className="text-sm font-medium text-slate-700">Medical Conditions (if any)?</label>
                                    </div>
                                    {hasMedicalCondition && (
                                        <textarea
                                            {...register('medicalConditionDetails')}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none mt-2"
                                            placeholder="Please provide details..."
                                            rows={2}
                                        />
                                    )}
                                </div>

                                {/* Allergies */}
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <input type="checkbox" id="hasAllergy" {...register('hasAllergy')} className="w-4 h-4 text-indigo-600 rounded" />
                                        <label htmlFor="hasAllergy" className="text-sm font-medium text-slate-700">Allergies (if any)?</label>
                                    </div>
                                    {hasAllergy && (
                                        <textarea
                                            {...register('allergyDetails')}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none mt-2"
                                            placeholder="Please provide details..."
                                            rows={2}
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-8">
                        {/* Father's Details */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold text-slate-900 border-b pb-2">Father's Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Father's Name <span className="text-red-500">*</span></label>
                                    <input
                                        {...register('fatherName', { required: true })}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none ${errors.fatherName ? 'border-red-500' : 'border-slate-300'}`}
                                    />
                                    {errors.fatherName && <p className="text-xs text-red-500 mt-1">Father's Name is required</p>}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Father's Mobile <span className="text-red-500">*</span></label>
                                    <input
                                        type="tel"
                                        {...register('fatherMobile', { required: true })}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none ${errors.fatherMobile ? 'border-red-500' : 'border-slate-300'}`}
                                        placeholder="Mobile Number"
                                    />
                                    {errors.fatherMobile && <p className="text-xs text-red-500 mt-1">Father's Mobile is required</p>}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Occupation</label>
                                    <input
                                        {...register('fatherOccupation')}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                        placeholder="Occupation"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Designation</label>
                                    <input
                                        {...register('fatherDesignation')}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                        placeholder="Designation"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Company Name</label>
                                    <input
                                        {...register('fatherCompany')}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                        placeholder="Company Name"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Office Address</label>
                                    <input
                                        {...register('fatherOfficeAddress')}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                        placeholder="Office Address"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Educational Qualification</label>
                                    <input
                                        {...register('fatherEducation')}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                        placeholder="Qualification"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Annual Income</label>
                                    <input
                                        {...register('fatherIncome')}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                        placeholder="Annual Income"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Aadhar Number</label>
                                    <input
                                        {...register('fatherAadhar')}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                        placeholder="Aadhar Number"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Father's Email</label>
                                    <input
                                        type="email"
                                        {...register('fatherEmail')}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                        placeholder="Email ID"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Mother's Details */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold text-slate-900 border-b pb-2">Mother's Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Mother's Name <span className="text-red-500">*</span></label>
                                    <input
                                        {...register('motherName', { required: true })}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none ${errors.motherName ? 'border-red-500' : 'border-slate-300'}`}
                                    />
                                    {errors.motherName && <p className="text-xs text-red-500 mt-1">Mother's Name is required</p>}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Mother's Mobile <span className="text-red-500">*</span></label>
                                    <input
                                        type="tel"
                                        {...register('motherMobile', { required: true })}
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none ${errors.motherMobile ? 'border-red-500' : 'border-slate-300'}`}
                                        placeholder="Mobile Number"
                                    />
                                    {errors.motherMobile && <p className="text-xs text-red-500 mt-1">Mother's Mobile is required</p>}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Occupation</label>
                                    <input
                                        {...register('motherOccupation')}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                        placeholder="Occupation"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Designation</label>
                                    <input
                                        {...register('motherDesignation')}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                        placeholder="Designation"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Company Name</label>
                                    <input
                                        {...register('motherCompany')}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                        placeholder="Company Name"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Office Address</label>
                                    <input
                                        {...register('motherOfficeAddress')}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                        placeholder="Office Address"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Educational Qualification</label>
                                    <input
                                        {...register('motherEducation')}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                        placeholder="Qualification"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Annual Income</label>
                                    <input
                                        {...register('motherIncome')}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                        placeholder="Annual Income"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Aadhar Number</label>
                                    <input
                                        {...register('motherAadhar')}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                        placeholder="Aadhar Number"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Mother's Email</label>
                                    <input
                                        type="email"
                                        {...register('motherEmail')}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                        placeholder="Email ID"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Contact & Address */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold text-slate-900 border-b pb-2">Address</h3>
                            <div className="grid grid-cols-1 gap-6">
                                <div className="col-span-1 space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Residential Address</label>
                                    <textarea
                                        {...register('address')}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                        placeholder="Residential Address"
                                    />
                                </div>
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
