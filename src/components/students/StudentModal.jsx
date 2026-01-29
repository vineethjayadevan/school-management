import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, Edit, Save, User, Phone, MapPin, Calendar, Book, Users, FileText } from 'lucide-react';
import { storageService } from '../../services/storage';
import { useToast } from '../../components/ui/Toast';

export default function StudentModal({ isOpen, onClose, studentId, initialMode = 'view', onUpdate }) {
    const { addToast } = useToast();
    const [mode, setMode] = useState(initialMode);
    const [loading, setLoading] = useState(false);
    const [student, setStudent] = useState(null);
    const { register, handleSubmit, reset, formState: { errors } } = useForm();

    useEffect(() => {
        if (isOpen && studentId) {
            fetchStudent();
            setMode(initialMode);
        } else {
            setStudent(null);
            reset();
        }
    }, [isOpen, studentId, initialMode]);

    const fetchStudent = async () => {
        setLoading(true);
        try {
            // Parallel fetch: Student Profile AND Fee History
            const [data, feeHistory] = await Promise.all([
                storageService.students.getById(studentId),
                storageService.fees.getByStudent(studentId)
            ]);

            // Calculate fee stats
            const totalFee = 26500;
            const paid = feeHistory.reduce((sum, f) => sum + (f.amount || 0), 0);
            const pending = totalFee - paid;

            const studentWithFees = {
                ...data,
                feeDetails: { paid, pending }
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
                address: data.address,
                feesStatus: data.feesStatus // Use status from profile, but display details from calculation
            });
        } catch (error) {
            console.error(error);
            addToast("Failed to fetch student details", "error");
            onClose();
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            const updatedStudent = await storageService.students.update(studentId, {
                ...data,
                // Ensure legacy fields are handled if necessary, mostly backend handles it
            });
            setStudent(updatedStudent);
            setMode('view');
            addToast("Student updated successfully", "success");
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error(error);
            addToast("Failed to update student", "error");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
                    <div className="flex items-center gap-2">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${student?.gender === 'Female' ? 'bg-pink-100 text-pink-600' : 'bg-blue-100 text-blue-600'}`}>
                            {student?.name?.charAt(0) || 'S'}
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">{loading ? 'Loading...' : student?.name}</h2>
                            <p className="text-xs text-slate-500 font-mono">{student?.admissionNo}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {mode === 'view' && !loading && student && (
                            <button
                                onClick={() => setMode('edit')}
                                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                                title="Edit Student"
                            >
                                <Edit size={20} />
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="overflow-y-auto p-6 flex-1">
                    {loading && !student ? (
                        <div className="flex justify-center items-center h-40 text-slate-500">
                            Loading details...
                        </div>
                    ) : (
                        mode === 'view' ? (
                            <div className="space-y-6">
                                {/* Academic Info */}
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <Book size={16} /> Academic Details
                                    </h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
                                        <div>
                                            <p className="text-xs text-slate-500">Class & Section</p>
                                            <p className="font-medium">{student?.className || student?.class} - {student?.section}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500">Roll No</p>
                                            <p className="font-medium">{student?.rollNo || 'Not Assigned'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500">Admission No</p>
                                            <p className="font-medium">{student?.admissionNo}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500">Status</p>
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${student?.feesStatus === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                {student?.feesStatus || 'Active'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Fee Details (Read Only) */}
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <div className="text-emerald-500">
                                            {/* Reuse existing icons or import Wallet/CreditCard if needed. Using Users for now or generic icon */}
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2" /><line x1="2" x2="22" y1="10" y2="10" /></svg>
                                        </div>
                                        Fee Information
                                    </h3>
                                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-3">
                                        <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                                            <span className="text-sm text-slate-600">Total Fee</span>
                                            <span className="font-bold text-slate-900">₹26,500</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-slate-600">Paid Amount</span>
                                            <span className="font-semibold text-emerald-600">
                                                ₹{student?.feeDetails?.paid?.toLocaleString() || 0}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                                            <span className="text-sm text-slate-600">Pending Due</span>
                                            <span className="font-bold text-rose-600">
                                                ₹{student?.feeDetails?.pending?.toLocaleString() || '26,500'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Personal Info */}
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <User size={16} /> Personal Information
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div>
                                            <p className="text-xs text-slate-500">Date of Birth</p>
                                            <p className="font-medium flex items-center gap-1">
                                                <Calendar size={14} className="text-slate-400" />
                                                {student?.dob ? new Date(student.dob).toLocaleDateString() : 'N/A'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500">Gender</p>
                                            <p className="font-medium">{student?.gender}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500">Blood Group</p>
                                            <p className="font-medium">{student?.bloodGroup || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Guardian Info */}
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                                        <Users size={16} /> Guardian & Contact
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <p className="text-xs text-slate-500">Father's Name</p>
                                            <p className="font-medium">{student?.fatherName || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500">Mother's Name</p>
                                            <p className="font-medium">{student?.motherName || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500">Primary Guardian</p>
                                            <p className="font-medium">{student?.guardian}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500">Contact Number</p>
                                            <p className="font-medium flex items-center gap-1">
                                                <Phone size={14} className="text-slate-400" />
                                                {student?.primaryPhone || student?.contact}
                                            </p>
                                        </div>
                                        <div className="md:col-span-2">
                                            <p className="text-xs text-slate-500">Address</p>
                                            <p className="font-medium flex items-start gap-1">
                                                <MapPin size={14} className="text-slate-400 mt-0.5" />
                                                {student?.address || 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <form id="edit-student-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                                {/* Academic Edit */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold text-indigo-600 border-b border-indigo-100 pb-1">Academic Info</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-slate-700 mb-1">Class</label>
                                            <input {...register("className")} className="w-full p-2 border rounded text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-700 mb-1">Section</label>
                                            <input {...register("section")} className="w-full p-2 border rounded text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-700 mb-1">Roll No</label>
                                            <input {...register("rollNo")} className="w-full p-2 border rounded text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-700 mb-1">Admission No</label>
                                            <input {...register("admissionNo")} disabled className="w-full p-2 border rounded text-sm bg-slate-50 text-slate-500 cursor-not-allowed" />
                                        </div>
                                    </div>
                                </div>

                                {/* Personal Edit */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold text-indigo-600 border-b border-indigo-100 pb-1">Personal Info</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2">
                                            <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
                                            <input {...register("name", { required: true })} className="w-full p-2 border rounded text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-700 mb-1">Gender</label>
                                            <select {...register("gender")} className="w-full p-2 border rounded text-sm">
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-700 mb-1">Date of Birth</label>
                                            <input type="date" {...register("dob")} className="w-full p-2 border rounded text-sm" />
                                        </div>
                                    </div>
                                </div>

                                {/* Contact Edit */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold text-indigo-600 border-b border-indigo-100 pb-1">Guardian & Contact</h3>
                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-medium text-slate-700 mb-1">Guardian Name</label>
                                                <input {...register("guardian")} className="w-full p-2 border rounded text-sm" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-slate-700 mb-1">Phone</label>
                                                <input {...register("primaryPhone")} className="w-full p-2 border rounded text-sm" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-700 mb-1">Address</label>
                                            <textarea {...register("address")} rows={2} className="w-full p-2 border rounded text-sm" />
                                        </div>
                                    </div>
                                </div>
                            </form>
                        )
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg text-sm font-medium transition-colors"
                    >
                        Close
                    </button>
                    {mode === 'edit' && (
                        <button
                            form="edit-student-form"
                            type="submit"
                            className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-sm font-medium flex items-center gap-2"
                            disabled={loading}
                        >
                            <Save size={16} />
                            Save Changes
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
