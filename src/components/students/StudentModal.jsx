import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, Edit, Save, User, Phone, MapPin, Calendar, Book, Users, FileText, Bus, ChevronDown, ChevronUp, CreditCard } from 'lucide-react';
import { storageService } from '../../services/storage';
import { useToast } from '../../components/ui/Toast';
import { CONVEYANCE_SLABS, calculateConveyanceFee, calculateTotalConveyanceFee } from '../../utils/feeUtils';

/**
 * StudentModal Component
 * Reorganized with Accordions for better UI/UX in both View and Edit modes.
 */
export default function StudentModal({ isOpen, onClose, studentId, initialMode = 'view', onUpdate }) {
    const { addToast } = useToast();
    const [mode, setMode] = useState(initialMode);
    const [loading, setLoading] = useState(false);
    const [student, setStudent] = useState(null);
    const { register, handleSubmit, reset, watch, formState: { errors } } = useForm();

    // Accordion State: Only one section open at a time
    const [openSection, setOpenSection] = useState('academic');

    const toggleSection = (section) => {
        setOpenSection(openSection === section ? null : section);
    };

    useEffect(() => {
        if (isOpen && studentId) {
            fetchStudent();
            setMode(initialMode);
            setOpenSection('academic'); // Reset to academic on open
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

            // Calculate fees
            const tuitionFee = 20000;
            const materialsFee = 6500;

            // Conveyance Calculation
            const slab = data.conveyanceSlab ? parseInt(data.conveyanceSlab) : 0;
            const conveyanceFee = calculateTotalConveyanceFee(slab);

            const totalFee = tuitionFee + materialsFee + conveyanceFee;
            const paid = feeHistory.reduce((sum, f) => sum + (f.amount || 0), 0);
            const pending = totalFee - paid;

            const studentWithFees = {
                ...data,
                feeDetails: {
                    paid,
                    pending,
                    totalFee,
                    tuitionFee,
                    materialsFee,
                    conveyanceFee,
                    monthlyConveyance: calculateConveyanceFee(slab)
                },
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
                address: data.address,
                feesStatus: data.feesStatus,
                conveyanceSlab: data.conveyanceSlab || 0
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
                conveyanceSlab: parseInt(data.conveyanceSlab) // Ensure number
            });

            // Re-fetch to update calculations
            await fetchStudent();

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

    // Helper for Accordion Item
    const AccordionItem = ({ id, title, icon: Icon, children }) => (
        <div className="border border-slate-200 rounded-lg overflow-hidden mb-3 shadow-sm bg-white">
            <button
                type="button" // Prevent form submission
                onClick={() => toggleSection(id)}
                className={`w-full flex items-center justify-between p-4 text-left transition-colors ${openSection === id ? 'bg-indigo-50 text-indigo-900 border-b border-indigo-100' : 'bg-white hover:bg-slate-50'}`}
            >
                <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-md ${openSection === id ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                        <Icon size={18} />
                    </div>
                    <span className="font-semibold">{title}</span>
                </div>
                {openSection === id ? <ChevronUp size={20} className="text-indigo-400" /> : <ChevronDown size={20} className="text-slate-400" />}
            </button>
            {openSection === id && (
                <div className="p-4 bg-white animate-in slide-in-from-top-2 duration-200">
                    {children}
                </div>
            )}
        </div>
    );

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
                <div className="overflow-y-auto p-6 flex-1 bg-slate-50/50">
                    {loading && !student ? (
                        <div className="flex justify-center items-center h-40 text-slate-500">
                            Loading details...
                        </div>
                    ) : (
                        <form id="student-form" onSubmit={handleSubmit(onSubmit)}>
                            {/* Academic Details - Always First */}
                            <AccordionItem id="academic" title="Academic Information" icon={Book}>
                                {mode === 'view' ? (
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div>
                                            <p className="text-xs text-slate-500">Class & Section</p>
                                            <p className="font-medium text-slate-900">{student?.className || student?.class} - {student?.section}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500">Roll No</p>
                                            <p className="font-medium text-slate-900">{student?.rollNo || 'Not Assigned'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500">Admission No</p>
                                            <p className="font-medium text-slate-900">{student?.admissionNo}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500">Status</p>
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${student?.feesStatus === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                {student?.feesStatus || 'Active'}
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-slate-700 mb-1">Class</label>
                                            <input {...register("className")} className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-700 mb-1">Section</label>
                                            <input {...register("section")} className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-700 mb-1">Roll No</label>
                                            <input {...register("rollNo")} className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-700 mb-1">Admission No</label>
                                            <input {...register("admissionNo")} disabled className="w-full p-2 border rounded text-sm bg-slate-50 text-slate-500 cursor-not-allowed" />
                                        </div>
                                    </div>
                                )}
                            </AccordionItem>

                            {/* Personal Details - Second */}
                            <AccordionItem id="personal" title="Personal Information" icon={User}>
                                {mode === 'view' ? (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div>
                                            <p className="text-xs text-slate-500">Date of Birth</p>
                                            <p className="font-medium flex items-center gap-1 text-slate-900">
                                                <Calendar size={14} className="text-slate-400" />
                                                {student?.dob ? new Date(student.dob).toLocaleDateString() : 'N/A'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500">Gender</p>
                                            <p className="font-medium text-slate-900">{student?.gender}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500">Blood Group</p>
                                            <p className="font-medium text-slate-900">{student?.bloodGroup || 'N/A'}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2">
                                            <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
                                            <input {...register("name", { required: true })} className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-700 mb-1">Gender</label>
                                            <select {...register("gender")} className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-700 mb-1">Date of Birth</label>
                                            <input type="date" {...register("dob")} className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                                        </div>
                                    </div>
                                )}
                            </AccordionItem>

                            {/* Guardian & Contact - Third (Moved below Personal) */}
                            <AccordionItem id="guardian" title="Parents & Guardian Details" icon={Users}>
                                {mode === 'view' ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <p className="text-xs text-slate-500">Father's Name</p>
                                            <p className="font-medium text-slate-900">{student?.fatherName || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500">Mother's Name</p>
                                            <p className="font-medium text-slate-900">{student?.motherName || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500">Primary Guardian</p>
                                            <p className="font-medium text-slate-900">{student?.guardian}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500">Contact Number</p>
                                            <p className="font-medium flex items-center gap-1 text-slate-900">
                                                <Phone size={14} className="text-slate-400" />
                                                {student?.primaryPhone || student?.contact}
                                            </p>
                                        </div>
                                        <div className="md:col-span-2">
                                            <p className="text-xs text-slate-500">Residential Address</p>
                                            <p className="font-medium flex items-start gap-1 text-slate-900">
                                                <MapPin size={14} className="text-slate-400 mt-0.5" />
                                                {student?.address || 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-medium text-slate-700 mb-1">Guardian Name</label>
                                                <input {...register("guardian")} className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-slate-700 mb-1">Phone</label>
                                                <input {...register("primaryPhone")} className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-700 mb-1">Address</label>
                                            <textarea {...register("address")} rows={2} className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                                        </div>
                                    </div>
                                )}
                            </AccordionItem>

                            {/* Fee Overview - Fourth - Contains Conveyance */}
                            <AccordionItem id="fees" title="Fee Overview & Conveyance" icon={CreditCard}>
                                <div className="space-y-4">
                                    {mode === 'view' ? (
                                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 space-y-3">
                                            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                                                <span className="text-sm text-slate-600">Standard Fee (Tuition + Materials)</span>
                                                <span className="font-bold text-slate-900">₹{(student?.feeDetails?.tuitionFee + student?.feeDetails?.materialsFee).toLocaleString()}</span>
                                            </div>

                                            {/* Conveyance Section */}
                                            <div className="flex justify-between items-center py-2 border-b border-slate-200">
                                                <div className="flex items-center gap-2">
                                                    <Bus size={16} className="text-blue-600" />
                                                    <span className="text-sm text-slate-700 font-medium">Conveyance Fee</span>
                                                    {student?.conveyanceSlab > 0 && (
                                                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                                            Slab {student.conveyanceSlab}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-right">
                                                    {student?.conveyanceSlab > 0 ? (
                                                        <>
                                                            <span className="block font-bold text-slate-900">₹{student?.feeDetails?.conveyanceFee?.toLocaleString()}</span>
                                                            <span className="text-xs text-slate-500">₹{student?.feeDetails?.monthlyConveyance}/mo (10 mos)</span>
                                                        </>
                                                    ) : (
                                                        <span className="text-sm text-slate-400 italic">Not Availed</span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex justify-between items-center pt-2">
                                                <span className="text-sm font-semibold text-slate-700">Total Annual Payable</span>
                                                <span className="font-bold text-indigo-700 text-lg">₹{student?.feeDetails?.totalFee?.toLocaleString()}</span>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 pt-4 mt-2 border-t border-slate-200">
                                                <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100 text-center">
                                                    <p className="text-xs text-emerald-600 font-semibold uppercase">Total Paid</p>
                                                    <p className="text-lg font-bold text-emerald-700">₹{student?.feeDetails?.paid?.toLocaleString() || 0}</p>
                                                </div>
                                                <div className="bg-rose-50 p-3 rounded-lg border border-rose-100 text-center">
                                                    <p className="text-xs text-rose-600 font-semibold uppercase">Pending Due</p>
                                                    <p className="text-lg font-bold text-rose-700">₹{student?.feeDetails?.pending?.toLocaleString() || 0}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                                            <div className="space-y-4">
                                                {/* Read-only fee summary for Edit Mode context */}
                                                <div className="flex justify-between items-center pb-2 border-b border-blue-200">
                                                    <span className="text-sm text-blue-800">Standard Fee</span>
                                                    <span className="font-semibold text-blue-900">₹{(20000 + 6500).toLocaleString()}</span>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-semibold text-blue-800 mb-2 flex items-center gap-2">
                                                        <Bus size={16} />
                                                        Conveyance Slab Selection
                                                    </label>
                                                    <select
                                                        {...register("conveyanceSlab")}
                                                        className="w-full p-2 border rounded text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm"
                                                    >
                                                        {CONVEYANCE_SLABS.map(slab => (
                                                            <option key={slab.id} value={slab.id}>
                                                                {slab.label} {slab.id > 0 ? `(₹${slab.monthly}/mo)` : ''}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <p className="text-xs text-blue-600 mt-2">
                                                        * Selecting a slab will automatically add the annual conveyance fee to the student's total payable amount.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </AccordionItem>

                            {/* Payment History - Only in View Mode */}
                            {mode === 'view' && student?.feeHistory?.length > 0 && (
                                <AccordionItem id="history" title="Payment History" icon={FileText}>
                                    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                                                <tr>
                                                    <th className="px-4 py-2">Date</th>
                                                    <th className="px-4 py-2">Type</th>
                                                    <th className="px-4 py-2 text-right">Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {student.feeHistory.map((fee, idx) => (
                                                    <tr key={fee.id || idx} className="hover:bg-slate-50">
                                                        <td className="px-4 py-2 text-slate-600">
                                                            {fee.paymentDate ? new Date(fee.paymentDate).toLocaleDateString() : 'N/A'}
                                                        </td>
                                                        <td className="px-4 py-2">
                                                            <span className="font-medium text-slate-900">{fee.feeType || 'Fee'}</span>
                                                            <div className="text-xs text-slate-400">{fee.paymentMode}</div>
                                                        </td>
                                                        <td className="px-4 py-2 text-right font-semibold text-emerald-600">
                                                            ₹{Number(fee.amount).toLocaleString()}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </AccordionItem>
                            )}
                        </form>
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
                            form="student-form" // Link to form ID
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
