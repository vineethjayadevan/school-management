import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, Edit, Save, User, Phone, MapPin, Calendar, Book, Users, FileText, Bus, ChevronDown, ChevronUp, CreditCard } from 'lucide-react';
import { storageService } from '../../services/storage';
import api from '../../services/api';
import { useToast } from '../../components/ui/Toast';
import { calculateDetailedFeeBreakdown } from '../../utils/feeUtils';

/**
 * StudentModal Component
 * Reorganized with Accordions for better UI/UX in both View and Edit modes.
 */
export default function StudentModal({ isOpen, onClose, studentId, initialMode = 'view', onUpdate, readOnly = false }) {
    const { addToast } = useToast();
    const [mode, setMode] = useState(initialMode);
    const [loading, setLoading] = useState(false);
    const [student, setStudent] = useState(null);
    const [academicClasses, setAcademicClasses] = useState([]);
    const { register, handleSubmit, reset, watch, formState: { errors } } = useForm();
    const selectedClassName = watch('className');

    // Deriving available sections for the selected class
    const availableSections = academicClasses.find(c => c.name === selectedClassName)?.sections || [];

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
            // Parallel fetch: Student Profile, Fee History, Fee Categories, and Academic Classes
            const [data, feeHistory, categoriesRes, classesRes] = await Promise.all([
                storageService.students.getById(studentId),
                storageService.fees.getByStudent(studentId).catch(() => []),
                api.get('/fee-categories').catch(() => ({ data: [] })),
                api.get('/academics/classes').catch(() => ({ data: [] }))
            ]);

            setAcademicClasses(classesRes.data || []);

            const fetchedCategories = categoriesRes.data || [];

            // Conveyance Calculation
            const monthlyConveyance = data.monthlyConveyanceFee ? Number(data.monthlyConveyanceFee) : 0;
            const conveyanceAnnual = monthlyConveyance * 10;

            const feeDetails = {
                paid: 0,
                pending: 0,
                totalFee: 0,
                monthlyConveyance,
                breakdown: [],
                paidOthers: 0
            };

            // Calculate paid per category from history breakdown
            let totalPaidComputed = 0;
            const categoryPaid = {};

            feeHistory.forEach(txn => {
                let txnAmountLeft = txn.amount || 0;
                if (txn.breakdown && txn.breakdown.length > 0) {
                    txn.breakdown.forEach(item => {
                        const normalizedName = item.feeType?.trim().toLowerCase();
                        if (normalizedName) {
                            categoryPaid[normalizedName] = (categoryPaid[normalizedName] || 0) + item.amount;
                        }
                    });
                } else if (txn.feeType) {
                    const normalizedName = txn.feeType.trim().toLowerCase();
                    categoryPaid[normalizedName] = (categoryPaid[normalizedName] || 0) + txnAmountLeft;
                }
                totalPaidComputed += (txn.amount || 0);
            });

            // Calculate precise pending/total per active category
            const currentClassName = data.className || data.class;
            let totalFeeComputed = 0;
            let matchedPaid = 0;

            fetchedCategories.forEach(category => {
                const normalizedCatName = category.name.trim().toLowerCase();
                let annualTotal = 0;
                let monthlyAmount = 0;

                if (category.hasSlabs) {
                    annualTotal = conveyanceAnnual;
                    monthlyAmount = monthlyConveyance;
                } else {
                    const classSpecific = category.amounts?.find(a => a.className === currentClassName);
                    annualTotal = classSpecific ? classSpecific.amount : (category.baseAmount || 0);
                    monthlyAmount = annualTotal / (category.months || 10);
                }

                if (annualTotal > 0) {
                    totalFeeComputed += annualTotal;
                    const paidForCat = categoryPaid[normalizedCatName] || 0;
                    matchedPaid += paidForCat;
                    const pendingForCat = Math.max(0, annualTotal - paidForCat);

                    feeDetails.breakdown.push({
                        id: category._id,
                        name: category.name,
                        type: category.type,
                        total: annualTotal,
                        paid: paidForCat,
                        pending: pendingForCat,
                        monthly: monthlyAmount,
                        months: category.months || 10,
                        isConveyance: category.hasSlabs || normalizedCatName.includes('conveyance')
                    });
                }
            });

            feeDetails.paid = totalPaidComputed;
            feeDetails.totalFee = totalFeeComputed;
            feeDetails.pending = Math.max(0, totalFeeComputed - totalPaidComputed);
            feeDetails.paidOthers = Math.max(0, totalPaidComputed - matchedPaid);

            const studentWithFees = {
                ...data,
                feeDetails: feeDetails,
                feeHistory: feeHistory || []
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
                monthlyConveyanceFee: data.monthlyConveyanceFee || 0
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
                monthlyConveyanceFee: Number(data.monthlyConveyanceFee || 0) // Ensure number
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
                        {mode === 'view' && !loading && student && !readOnly && (
                            <button
                                onClick={() => setMode('edit')}
                                className="px-3 py-1.5 text-indigo-600 hover:bg-indigo-50 rounded-md text-sm font-medium transition-colors flex items-center gap-1"
                                title="Edit Student"
                            >
                                <Edit size={16} /> Edit
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
                                            <select {...register("className")} className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                                                <option value="">Select Class</option>
                                                {academicClasses.map(cls => (
                                                    <option key={cls._id} value={cls.name}>{cls.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-slate-700 mb-1">Section</label>
                                            <select {...register("section")} className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                                                <option value="">Select Section</option>
                                                {availableSections.map((sec, idx) => (
                                                    <option key={idx} value={sec.name}>{sec.name}</option>
                                                ))}
                                            </select>
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
                                        <div className="space-y-6">
                                            {/* Top Summary Cards */}
                                            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Annual Fee</span>
                                                    <span className="text-[10px] text-slate-400 font-medium bg-slate-100 px-2 py-0.5 rounded-full">Current Session</span>
                                                </div>
                                                <div className="text-3xl font-black text-slate-900 mb-5">
                                                    ₹{student?.feeDetails?.totalFee?.toLocaleString()}
                                                </div>

                                                <div className="grid grid-cols-2 gap-3 mb-4">
                                                    <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100 shadow-[inset_0_1px_2px_rgba(255,255,255,0.5)]">
                                                        <p className="text-[10px] font-black uppercase text-emerald-600 tracking-wider mb-1">Total Paid</p>
                                                        <p className="text-xl font-bold text-emerald-700">₹{student?.feeDetails?.paid?.toLocaleString() || 0}</p>
                                                    </div>
                                                    <div className="bg-rose-50 rounded-lg p-3 border border-rose-100 shadow-[inset_0_1px_2px_rgba(255,255,255,0.5)]">
                                                        <p className="text-[10px] font-black uppercase text-rose-600 tracking-wider mb-1">Total Balance</p>
                                                        <p className="text-xl font-bold text-rose-700">₹{student?.feeDetails?.pending?.toLocaleString() || 0}</p>
                                                    </div>
                                                </div>

                                                {/* Overall Progress Bar */}
                                                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                                                        style={{ width: `${Math.min(100, Math.max(0, ((student?.feeDetails?.paid || 0) / (student?.feeDetails?.totalFee || 1)) * 100))}%` }}
                                                    ></div>
                                                </div>
                                            </div>

                                            {/* Payments Breakdown */}
                                            <div className="px-1">
                                                <div className="flex justify-between items-center mb-5">
                                                    <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Payments To Make</h4>
                                                    <span className="text-[10px] text-slate-400 italic">Expected Annual</span>
                                                </div>

                                                <div className="space-y-6">
                                                    {student?.feeDetails?.breakdown?.map((cat, idx) => (
                                                        <div key={cat.id || idx} className="group">
                                                            <div className="flex justify-between items-end mb-2">
                                                                <span className="text-sm font-semibold text-slate-700">
                                                                    {cat.name}
                                                                    {cat.isConveyance && student?.monthlyConveyanceFee > 0 &&
                                                                        <span className="ml-2 text-[10px] font-normal text-slate-400 italic">(Monthly: ₹{student.monthlyConveyanceFee})</span>
                                                                    }
                                                                </span>
                                                                <span className="block font-bold text-slate-900">₹{cat.total.toLocaleString()}</span>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                                    <div
                                                                        className={`h-full rounded-full transition-all duration-500 ${cat.paid >= cat.total ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                                                                        style={{ width: `${Math.min(100, Math.max(0, (cat.paid / (cat.total || 1)) * 100))}%` }}
                                                                    ></div>
                                                                </div>
                                                                <span className="text-[10px] text-slate-400 font-medium w-6 text-right">
                                                                    {Math.round((cat.paid / (cat.total || 1)) * 100)}%
                                                                </span>
                                                                <span className={`text-xs w-20 text-right ${cat.pending > 0 ? 'font-bold text-rose-600' : 'font-semibold text-emerald-600'}`}>
                                                                    {cat.pending > 0 ? `₹${cat.pending.toLocaleString()} Due` : 'Cleared'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}

                                                    {/* Miscellaneous (if applicable) */}
                                                    {student?.feeDetails?.paidOthers > 0 && (
                                                        <div className="group pt-4 border-t border-slate-100 mt-6">
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-sm font-semibold text-slate-700">Miscellaneous Paid</span>
                                                                <span className="font-bold text-emerald-600 text-sm">₹{student?.feeDetails?.paidOthers?.toLocaleString()}</span>
                                                            </div>
                                                        </div>
                                                    )}
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
                                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                                        Monthly Vehicle Fee (₹)
                                                    </label>
                                                    <input
                                                        type="number"
                                                        {...register("monthlyConveyanceFee")}
                                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
                                                        placeholder="Enter monthly fee amount"
                                                    />
                                                    <p className="mt-1 text-xs text-slate-500">
                                                        * Entering an amount will automatically add the annual vehicle fee to the student's total payable amount (Monthly × 10).
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
                                                            <span className="font-medium text-slate-900">
                                                                {fee.feeType === 'Split Payment' && fee.breakdown?.length > 0
                                                                    ? fee.breakdown.map(b => b.feeType).join(', ')
                                                                    : (fee.feeType || 'Fee')}
                                                            </span>
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
        </div >
    );
}
