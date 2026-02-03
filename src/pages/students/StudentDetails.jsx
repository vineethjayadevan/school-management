import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Edit, Save, User, Phone, MapPin, Calendar, Book, FileText, Ban } from 'lucide-react';
import { storageService } from '../../services/storage';
import { useToast } from '../../components/ui/Toast';

export default function StudentDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { addToast } = useToast();

    // Determine initial mode from navigation state or default to 'view'
    const [mode, setMode] = useState(location.state?.mode || 'view');
    const [loading, setLoading] = useState(true);
    const [student, setStudent] = useState(null);
    const { register, handleSubmit, reset, formState: { errors } } = useForm();

    useEffect(() => {
        if (id) {
            fetchStudent();
        }
    }, [id]);

    const fetchStudent = async () => {
        setLoading(true);
        try {
            // Parallel fetch: Student Profile AND Fee History
            const [data, feeHistory] = await Promise.all([
                storageService.students.getById(id),
                storageService.fees.getByStudent(id)
            ]);

            if (!data) {
                console.error("Student not found for ID:", id);
                addToast("Student not found", "error");
                navigate('/admin/students');
                return;
            }
            console.log("Fetched Student Data:", data);

            // Calculate fee stats
            const totalFee = 26500;
            const paid = feeHistory.reduce((sum, f) => sum + (f.amount || 0), 0);
            const pending = totalFee - paid;

            const studentWithFees = {
                ...data,
                feeDetails: { paid, pending },
                feeHistory: feeHistory || [] // Store history
            };

            setStudent(studentWithFees);

            // Pre-fill form for edit mode
            reset({
                name: data.name,
                admissionNo: data.admissionNo,
                applicationNo: data.applicationNo,
                submissionDate: data.submissionDate ? new Date(data.submissionDate).toISOString().split('T')[0] : '',
                rollNo: data.rollNo,
                className: data.className || data.class,
                section: data.section,
                gender: data.gender,
                dob: data.dob ? new Date(data.dob).toISOString().split('T')[0] : '',
                bloodGroup: data.bloodGroup,
                placeOfBirth: data.placeOfBirth,
                nationality: data.nationality,
                religion: data.religion,
                caste: data.caste,
                category: data.category,
                aadharNo: data.aadharNo,
                previousSchool: data.previousSchool,
                previousClass: data.previousClass,
                mediumOfInstruction: data.mediumOfInstruction,
                hasLearningDisability: data.hasLearningDisability,
                learningDisabilityDetails: data.learningDisabilityDetails,
                hasMedicalCondition: data.hasMedicalCondition,
                medicalConditionDetails: data.medicalConditionDetails,
                hasAllergy: data.hasAllergy,
                allergyDetails: data.allergyDetails,
                guardian: data.guardian,
                fatherName: data.fatherName,
                fatherOccupation: data.fatherOccupation,
                fatherDesignation: data.fatherDesignation,
                fatherCompany: data.fatherCompany,
                fatherOfficeAddress: data.fatherOfficeAddress,
                fatherEducation: data.fatherEducation,
                fatherIncome: data.fatherIncome,
                fatherAadhar: data.fatherAadhar,
                fatherMobile: data.fatherMobile,
                fatherEmail: data.fatherEmail,
                motherName: data.motherName,
                motherOccupation: data.motherOccupation,
                motherDesignation: data.motherDesignation,
                motherCompany: data.motherCompany,
                motherOfficeAddress: data.motherOfficeAddress,
                motherEducation: data.motherEducation,
                motherIncome: data.motherIncome,
                motherAadhar: data.motherAadhar,
                motherMobile: data.motherMobile,
                motherEmail: data.motherEmail,
                primaryPhone: data.primaryPhone || data.contact, // This is usually mapped from fatherMobile now
                email: data.email, // This is mapped from father/mother email usually
                address: data.address,
                feesStatus: data.feesStatus
            });
        } catch (error) {
            console.error(error);
            addToast("Failed to fetch student details", "error");
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            const updatedStudent = await storageService.students.update(id, {
                ...data,
            });

            // Re-fetch to normalize state (especially fee calcs which aren't in form)
            await fetchStudent();

            setMode('view');
            addToast("Student updated successfully", "success");
        } catch (error) {
            console.error(error);
            addToast("Failed to update student", "error");
            setLoading(false);
        }
    };

    if (loading && !student) {
        return (
            <div className="flex items-center justify-center min-h-[500px]">
                <div className="text-slate-500">Loading student details...</div>
            </div>
        );
    }

    if (!student) return null;

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/admin/students')}
                        className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">{student.name}</h1>
                        <p className="text-slate-500 font-mono">ADM: {student.admissionNo}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {mode === 'view' ? (
                        <>
                            <button
                                onClick={() => setMode('edit')}
                                className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-sm font-medium flex items-center gap-2"
                            >
                                <Edit size={16} /> Edit Profile
                            </button>
                        </>
                    ) : (
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    setMode('view');
                                    reset(); // Reset form to original values
                                }}
                                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                form="edit-student-form"
                                type="submit"
                                className="px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg text-sm font-medium flex items-center gap-2"
                            >
                                <Save size={16} /> Save Changes
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Quick Stats & Personal Info */}
                <div className="space-y-6 lg:col-span-2">

                    {/* Mode: VIEW */}
                    {mode === 'view' ? (
                        <>
                            {/* Administrative & Academic Details */}
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <Book size={16} /> Administrative & Academic Info
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                    <div>
                                        <p className="text-xs text-slate-500 mb-1">Application No</p>
                                        <p className="font-semibold text-lg">{student.applicationNo || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 mb-1">Admission No</p>
                                        <p className="font-semibold text-lg">{student.admissionNo}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 mb-1">Date of Submission</p>
                                        <p className="font-medium">{student.submissionDate ? new Date(student.submissionDate).toLocaleDateString() : 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 mb-1">Class & Section</p>
                                        <p className="font-semibold text-lg">{student.className || student.class} - {student.section}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 mb-1">Roll Number</p>
                                        <p className="font-semibold text-lg">{student.rollNo || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 mb-1">Fee Status</p>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${student.feesStatus === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                                            {student.feesStatus || 'Pending'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Personal Information */}
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <User size={16} /> Personal Information
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-8">
                                    <div>
                                        <p className="text-xs text-slate-500 mb-1">Full Name</p>
                                        <p className="font-medium text-lg">{student.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 mb-1">Date of Birth</p>
                                        <p className="font-medium flex items-center gap-2">
                                            <Calendar size={14} className="text-slate-400" />
                                            {student.dob ? new Date(student.dob).toLocaleDateString() : 'N/A'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 mb-1">Gender</p>
                                        <p className="font-medium">{student.gender || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 mb-1">Blood Group</p>
                                        <p className="font-medium">{student.bloodGroup || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 mb-1">Place of Birth</p>
                                        <p className="font-medium">{student.placeOfBirth || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 mb-1">Nationality</p>
                                        <p className="font-medium">{student.nationality || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 mb-1">Religion</p>
                                        <p className="font-medium">{student.religion || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 mb-1">Caste</p>
                                        <p className="font-medium">{student.caste || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 mb-1">Category</p>
                                        <p className="font-medium">{student.category || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 mb-1">Aadhar Number</p>
                                        <p className="font-medium">{student.aadharNo || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Previous Education */}
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Previous Education</h3>
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                                    <div className="col-span-1 lg:col-span-2">
                                        <p className="text-xs text-slate-500 mb-1">School Attended</p>
                                        <p className="font-medium">{student.previousSchool || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 mb-1">Details</p>
                                        <p className="text-sm text-slate-600">
                                            {student.previousClass ? `Class: ${student.previousClass}` : ''}
                                            {student.mediumOfInstruction ? ` • Medium: ${student.mediumOfInstruction}` : ''}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Health & Other Details */}
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <Ban size={16} /> Health & Other Details
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className={`p-4 rounded-lg border ${student.hasLearningDisability ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
                                        <p className="font-semibold text-sm mb-1">Learning Disability</p>
                                        <p className="text-xs text-slate-600">{student.hasLearningDisability ? student.learningDisabilityDetails : 'None Reported'}</p>
                                    </div>
                                    <div className={`p-4 rounded-lg border ${student.hasMedicalCondition ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
                                        <p className="font-semibold text-sm mb-1">Medical Condition</p>
                                        <p className="text-xs text-slate-600">{student.hasMedicalCondition ? student.medicalConditionDetails : 'None Reported'}</p>
                                    </div>
                                    <div className={`p-4 rounded-lg border ${student.hasAllergy ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
                                        <p className="font-semibold text-sm mb-1">Allergies</p>
                                        <p className="text-xs text-slate-600">{student.hasAllergy ? student.allergyDetails : 'None Reported'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Parent Details */}
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <User size={16} /> Parents & Guardian Details
                                </h3>

                                <div className="space-y-8">
                                    {/* Father */}
                                    <div>
                                        <h4 className="text-sm font-semibold text-indigo-600 border-b border-indigo-100 pb-2 mb-4">Father's Information</h4>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                            <div>
                                                <p className="text-xs text-slate-500 mb-1">Name</p>
                                                <p className="font-medium">{student.fatherName || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 mb-1">Mobile</p>
                                                <p className="font-medium flex items-center gap-2">
                                                    <Phone size={14} className="text-slate-400" />
                                                    {student.fatherMobile || 'N/A'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 mb-1">Email</p>
                                                <p className="font-medium text-xs break-all">{student.fatherEmail || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 mb-1">Occupation</p>
                                                <p className="font-medium">{student.fatherOccupation || 'N/A'}</p>
                                            </div>
                                            <div className="col-span-1 md:col-span-2">
                                                <p className="text-xs text-slate-500 mb-1">Office Address</p>
                                                <p className="font-medium text-sm">{student.fatherOfficeAddress || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Mother */}
                                    <div>
                                        <h4 className="text-sm font-semibold text-pink-600 border-b border-pink-100 pb-2 mb-4">Mother's Information</h4>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                            <div>
                                                <p className="text-xs text-slate-500 mb-1">Name</p>
                                                <p className="font-medium">{student.motherName || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 mb-1">Mobile</p>
                                                <p className="font-medium flex items-center gap-2">
                                                    <Phone size={14} className="text-slate-400" />
                                                    {student.motherMobile || 'N/A'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 mb-1">Email</p>
                                                <p className="font-medium text-xs break-all">{student.motherEmail || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 mb-1">Occupation</p>
                                                <p className="font-medium">{student.motherOccupation || 'N/A'}</p>
                                            </div>
                                            <div className="col-span-1 md:col-span-2">
                                                <p className="text-xs text-slate-500 mb-1">Office Address</p>
                                                <p className="font-medium text-sm">{student.motherOfficeAddress || 'N/A'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Address */}
                                    <div>
                                        <h4 className="text-sm font-semibold text-slate-600 border-b border-slate-100 pb-2 mb-4">Residential Address</h4>
                                        <p className="font-medium flex items-start gap-2">
                                            <MapPin size={14} className="text-slate-400 mt-1" />
                                            {student.address || 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        /* Mode: EDIT Form */
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <form id="edit-student-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                                {/* Administrative */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold text-indigo-600 border-b border-indigo-100 pb-1">Administrative Info</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-slate-700 mb-1">Application No</label>
                                            <input {...register("applicationNo")} className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-700 mb-1">Submission Date</label>
                                            <input type="date" {...register("submissionDate")} className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-700 mb-1">Admission No</label>
                                            <input {...register("admissionNo")} className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-700 mb-1">Class</label>
                                            <select {...register("className")} className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                                                <option value="Mont 1">Mont 1</option>
                                                <option value="Mont 2">Mont 2</option>
                                                <option value="Grade 1">Grade 1</option>
                                                <option value="Grade 2">Grade 2</option>
                                                <option value="Grade 3">Grade 3</option>
                                                <option value="Grade 4">Grade 4</option>
                                                <option value="Grade 5">Grade 5</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-700 mb-1">Section</label>
                                            <select {...register("section")} className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                                                <option value="A">A</option>
                                                <option value="B">B</option>
                                                <option value="C">C</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-700 mb-1">Roll No</label>
                                            <input {...register("rollNo")} className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                                        </div>
                                    </div>
                                </div>

                                {/* Personal */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold text-indigo-600 border-b border-indigo-100 pb-1">Personal Info</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        <div className="col-span-1 md:col-span-2">
                                            <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
                                            <input {...register("name", { required: true })} className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-700 mb-1">DOB</label>
                                            <input type="date" {...register("dob")} className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-700 mb-1">Gender</label>
                                            <select {...register("gender")} className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-700 mb-1">Blood Group</label>
                                            <select {...register("bloodGroup")} className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                                                <option value="">Select</option>
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
                                        <div>
                                            <label className="block text-xs font-medium text-slate-700 mb-1">Nationality</label>
                                            <input {...register("nationality")} className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-700 mb-1">Religion</label>
                                            <input {...register("religion")} className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-700 mb-1">Caste</label>
                                            <input {...register("caste")} className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-700 mb-1">Category</label>
                                            <select {...register("category")} className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                                                <option value="General">General</option>
                                                <option value="SC">SC</option>
                                                <option value="ST">ST</option>
                                                <option value="OBC">OBC</option>
                                                <option value="Others">Others</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-700 mb-1">Aadhar No</label>
                                            <input {...register("aadharNo")} className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                                        </div>
                                    </div>
                                </div>

                                {/* Previous Education */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold text-indigo-600 border-b border-indigo-100 pb-1">Previous Education</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        <div className="col-span-1 md:col-span-2">
                                            <label className="block text-xs font-medium text-slate-700 mb-1">Previous School</label>
                                            <input {...register("previousSchool")} className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-700 mb-1">Previous Class</label>
                                            <input {...register("previousClass")} className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-700 mb-1">Medium</label>
                                            <input {...register("mediumOfInstruction")} className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                                        </div>
                                    </div>
                                </div>

                                {/* Health */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold text-indigo-600 border-b border-indigo-100 pb-1">Health Details</h3>
                                    <div className="grid grid-cols-1 gap-4">
                                        <div>
                                            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 mb-1">
                                                <input type="checkbox" {...register("hasMedicalCondition")} className="rounded text-indigo-600" />
                                                Has Medical Condition?
                                            </label>
                                            <textarea {...register("medicalConditionDetails")} placeholder="Details" rows={1} className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                                        </div>
                                        <div>
                                            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 mb-1">
                                                <input type="checkbox" {...register("hasAllergy")} className="rounded text-indigo-600" />
                                                Has Allergies?
                                            </label>
                                            <textarea {...register("allergyDetails")} placeholder="Details" rows={1} className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                                        </div>
                                    </div>
                                </div>

                                {/* Parents */}
                                <div className="space-y-6">
                                    <h3 className="text-sm font-semibold text-indigo-600 border-b border-indigo-100 pb-1">Parents & Guardian</h3>

                                    {/* Father */}
                                    <div className="space-y-3 p-3 bg-slate-50 rounded-lg">
                                        <h4 className="text-xs font-bold text-slate-700">Father's Info</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="col-span-2">
                                                <label className="block text-xs font-medium text-slate-700 mb-1">Name</label>
                                                <input {...register("fatherName")} className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                                            </div>
                                            <div className="col-span-2">
                                                <label className="block text-xs font-medium text-slate-700 mb-1">Mobile</label>
                                                <input {...register("fatherMobile")} className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-slate-700 mb-1">Email</label>
                                                <input {...register("fatherEmail")} className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-slate-700 mb-1">Occupation</label>
                                                <input {...register("fatherOccupation")} className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                                            </div>
                                            <div className="col-span-2">
                                                <label className="block text-xs font-medium text-slate-700 mb-1">Office Address</label>
                                                <input {...register("fatherOfficeAddress")} className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-slate-700 mb-1">Designation</label>
                                                <input {...register("fatherDesignation")} className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-slate-700 mb-1">Income</label>
                                                <input {...register("fatherIncome")} className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Mother */}
                                    <div className="space-y-3 p-3 bg-slate-50 rounded-lg">
                                        <h4 className="text-xs font-bold text-slate-700">Mother's Info</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="col-span-2">
                                                <label className="block text-xs font-medium text-slate-700 mb-1">Name</label>
                                                <input {...register("motherName")} className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                                            </div>
                                            <div className="col-span-2">
                                                <label className="block text-xs font-medium text-slate-700 mb-1">Mobile</label>
                                                <input {...register("motherMobile")} className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-slate-700 mb-1">Email</label>
                                                <input {...register("motherEmail")} className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-slate-700 mb-1">Occupation</label>
                                                <input {...register("motherOccupation")} className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                                            </div>
                                            <div className="col-span-2">
                                                <label className="block text-xs font-medium text-slate-700 mb-1">Office Address</label>
                                                <input {...register("motherOfficeAddress")} className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Address */}
                                    <div>
                                        <label className="block text-xs font-medium text-slate-700 mb-1">Residential Address</label>
                                        <textarea {...register("address")} rows={3} className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                                    </div>
                                </div>

                            </form>
                        </div>
                    )}
                </div>

                {/* Right Column: Fees & History (Shared) */}
                <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <div className="text-emerald-500">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2" /><line x1="2" x2="22" y1="10" y2="10" /></svg>
                            </div>
                            Fee Overview
                        </h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                                <span className="text-sm text-slate-600">Total Annual Fee</span>
                                <span className="font-bold text-slate-900">₹26,500</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-600">Paid Amount</span>
                                <span className="font-semibold text-emerald-600">
                                    ₹{student?.feeDetails?.paid?.toLocaleString() || 0}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-slate-600">Pending Amount</span>
                                <span className="font-bold text-rose-600">
                                    ₹{student?.feeDetails?.pending?.toLocaleString() || '26,500'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Transaction History Snippet */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-0 overflow-hidden">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                <FileText size={16} /> Recent Payments
                            </h3>
                        </div>
                        {student?.feeHistory?.length > 0 ? (
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                                    <tr>
                                        <th className="px-4 py-2">Date</th>
                                        <th className="px-4 py-2 text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {student.feeHistory.slice(0, 5).map((fee, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50">
                                            <td className="px-4 py-3 text-slate-600">
                                                {fee.paymentDate ? new Date(fee.paymentDate).toLocaleDateString() : 'N/A'}
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium text-emerald-600">
                                                ₹{Number(fee.amount).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="p-6 text-center text-slate-500 text-sm">
                                No payment history found.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
