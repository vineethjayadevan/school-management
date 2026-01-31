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
                rollNo: data.rollNo,
                className: data.className || data.class,
                section: data.section,
                gender: data.gender,
                dob: data.dob ? new Date(data.dob).toISOString().split('T')[0] : '',
                bloodGroup: data.bloodGroup,
                guardian: data.guardian,
                fatherName: data.fatherName,
                motherName: data.motherName,
                primaryPhone: data.primaryPhone || data.contact,
                email: data.email,
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
                            {/* Academic & Basic Info Card */}
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <Book size={16} /> Academic Information
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
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

                            {/* Personal Details Card */}
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <User size={16} /> Personal & Guardian Details
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
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
                                    <div className="md:col-span-2 border-t border-slate-100 my-2"></div>
                                    <div>
                                        <p className="text-xs text-slate-500 mb-1">Father's Name</p>
                                        <p className="font-medium">{student.fatherName || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 mb-1">Mother's Name</p>
                                        <p className="font-medium">{student.motherName || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 mb-1">Primary Guardian</p>
                                        <p className="font-medium">{student.guardian}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 mb-1">Contact Number</p>
                                        <p className="font-medium flex items-center gap-2">
                                            <Phone size={14} className="text-slate-400" />
                                            {student.primaryPhone || student.contact}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 mb-1">Email Address</p>
                                        <p className="font-medium flex items-center gap-2">
                                            <span className="text-slate-400">@</span>
                                            {student.email || 'N/A'}
                                        </p>
                                    </div>
                                    <div className="md:col-span-2">
                                        <p className="text-xs text-slate-500 mb-1">Address</p>
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
                                {/* Academic Edit */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold text-indigo-600 border-b border-indigo-100 pb-1">Academic Info</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-slate-700 mb-1">Class</label>
                                            <input {...register("className")} className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-700 mb-1">Section</label>
                                            <input {...register("section")} className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-700 mb-1">Roll No</label>
                                            <input {...register("rollNo")} className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-700 mb-1">Admission No</label>
                                            <input {...register("admissionNo")} disabled className="w-full p-2 border border-slate-200 rounded text-sm bg-slate-50 text-slate-500 cursor-not-allowed" />
                                        </div>
                                    </div>
                                </div>

                                {/* Personal Edit */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold text-indigo-600 border-b border-indigo-100 pb-1">Personal Info</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2">
                                            <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
                                            <input {...register("name", { required: true })} className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
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
                                            <input {...register("bloodGroup")} className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-700 mb-1">Date of Birth</label>
                                            <input type="date" {...register("dob")} className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                                        </div>
                                    </div>
                                </div>

                                {/* Contact Edit */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold text-indigo-600 border-b border-indigo-100 pb-1">Guardian & Contact</h3>
                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-medium text-slate-700 mb-1">Father's Name</label>
                                                <input {...register("fatherName")} className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-slate-700 mb-1">Mother's Name</label>
                                                <input {...register("motherName")} className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-medium text-slate-700 mb-1">Guardian Name</label>
                                                <input {...register("guardian")} className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-slate-700 mb-1">Phone</label>
                                                <input {...register("primaryPhone")} className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-700 mb-1">Email Address</label>
                                            <input {...register("email")} type="email" className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-700 mb-1">Address</label>
                                            <textarea {...register("address")} rows={2} className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                                        </div>
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
