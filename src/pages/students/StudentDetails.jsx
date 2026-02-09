
import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Edit, Save, User, Phone, MapPin, Calendar, Book, FileText, Ban, Bus, Trash2, ExternalLink, Upload, File, Download } from 'lucide-react';
import { storageService } from '../../services/storage';
import { useToast } from '../../components/ui/Toast';
import api from '../../services/api';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import Accordion from '../../components/ui/Accordion';

export default function StudentDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { addToast } = useToast();

    // Determine initial mode from navigation state or default to 'view'
    const [mode, setMode] = useState(location.state?.mode || 'view');
    const [loading, setLoading] = useState(true);
    const [student, setStudent] = useState(null);
    const [documents, setDocuments] = useState([]); // State for documents (existing + pending previews)
    const [pendingUploads, setPendingUploads] = useState({}); // Stores File objects: { category: File }
    const [uploading, setUploading] = useState(false); // General loading state during submit
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [documentToDelete, setDocumentToDelete] = useState(null);
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
            setDocuments(data.documents || []); // Initialize documents state
            setPendingUploads({});

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
                fatherAadhar: data.aadharNo, // Assuming fatherAadhar maps to student's aadhar for now
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
                feesStatus: data.feesStatus,
                conveyanceSlab: data.conveyanceSlab || '0'
            });
        } catch (error) {
            console.error(error);
            addToast("Failed to fetch student details", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = (e, category) => {
        const file = e.target.files[0];
        if (!file) return;

        // Store file in pendingUploads
        setPendingUploads(prev => ({ ...prev, [category]: file }));

        // Temporary preview in documents list
        const tempDoc = {
            name: file.name,
            url: URL.createObjectURL(file), // Temporary URL for preview
            type: file.type,
            category: category,
            isPending: true // Flag to identify pending uploads
        };

        setDocuments(prev => {
            const filtered = prev.filter(d => d.category !== category);
            return [...filtered, tempDoc];
        });

        // Reset file input
        e.target.value = null;
    };

    const handleDeleteClick = (doc) => {
        setDocumentToDelete(doc);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!documentToDelete) return;

        const doc = documentToDelete;

        if (doc.isPending) {
            // Remove from pending uploads (UI only)
            setPendingUploads(prev => {
                const newState = { ...prev };
                delete newState[doc.category];
                return newState;
            });
            setDocuments(prev => prev.filter(d => d.name !== doc.name));
            setIsDeleteModalOpen(false);
            setDocumentToDelete(null);
        } else {
            try {
                // 1. Delete from GCS
                await api.delete('/upload', { data: { fileName: doc.url } });

                // 2. Update Student Record in DB (Remove from documents array)
                const updatedDocs = documents.filter(d => d.url !== doc.url && !d.isPending);

                await storageService.students.update(id, {
                    documents: updatedDocs
                });

                // 3. Update UI
                setDocuments(prev => prev.filter(d => d.url !== doc.url));
                addToast("Document deleted successfully", "success");

                // Re-fetch to ensure sync
                fetchStudent();

            } catch (error) {
                console.error("Delete failed", error);
                addToast("Failed to delete document", "error");
            } finally {
                setIsDeleteModalOpen(false);
                setDocumentToDelete(null);
            }
        }
    };

    const handleDownload = async (doc) => {
        try {
            const response = await api.get('/upload/signed-url', {
                params: { fileName: doc.url }
            });

            if (response.data.signedUrl) {
                window.open(response.data.signedUrl, '_blank');
            } else {
                addToast("Failed to get download link", "error");
            }
        } catch (error) {
            console.error("Download failed", error);
            addToast("Failed to download document", "error");
        }
    };

    const onSubmit = async (data) => {
        setUploading(true);
        try {


            // 2. Process Uploads
            const uploadedDocs = [];
            const categoriesToUpload = Object.keys(pendingUploads);

            if (categoriesToUpload.length > 0) {
                await Promise.all(categoriesToUpload.map(async (category) => {
                    const file = pendingUploads[category];
                    const formData = new FormData();
                    formData.append('file', file);
                    formData.append('category', category);
                    formData.append('studentId', id);

                    const response = await api.post('/upload', formData, {
                        headers: { 'Content-Type': 'multipart/form-data' },
                    });

                    uploadedDocs.push({
                        name: response.data.name,
                        url: response.data.url,
                        type: response.data.type,
                        category: category
                    });
                }));
            }

            // 3. Merge Documents
            // Filter out deleted and pending docs from current state (we have the real list in 'student.documents' minus deleted)
            // Actually, 'documents' state has the latest UI view. 
            // We should take the non-pending, non-deleted existing docs + new uploaded docs.

            const existingDocs = documents.filter(d => !d.isPending);
            // Note: documents state already has deleted ones removed.

            const finalDocuments = [...existingDocs, ...uploadedDocs];

            // 4. Update Student
            const updatedStudent = await storageService.students.update(id, {
                ...data,
                documents: finalDocuments
            });

            // Re-fetch to normalize state
            await fetchStudent();

            setMode('view');
            addToast("Student updated successfully", "success");
        } catch (error) {
            console.error(error);
            addToast("Failed to update student", "error");
        } finally {
            setUploading(false);
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
                                disabled={uploading}
                                className={`px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg text-sm font-medium flex items-center gap-2 ${uploading ? 'opacity-75 cursor-not-allowed' : ''}`}
                            >
                                {uploading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save size={16} /> Save Changes
                                    </>
                                )}
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

                            {/* Documents (View Mode) */}
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <File size={16} /> Documents
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {documents.length > 0 ? (
                                        documents.map((doc, index) => (
                                            <div key={index} className="flex items-center p-3 border border-slate-200 rounded-lg group">
                                                <div className="p-2 rounded-lg mr-3 bg-indigo-50 text-indigo-600">
                                                    <FileText size={20} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-bold text-slate-500 uppercase mb-0.5">{doc.category || 'Document'}</p>
                                                    <p className="text-sm font-medium text-slate-900 truncate" title={doc.name}>{doc.name}</p>
                                                </div>
                                                <button
                                                    onClick={() => handleDownload(doc)}
                                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-full transition-colors cursor-pointer"
                                                    title="Download/View Document"
                                                >
                                                    <Download size={18} />
                                                </button>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="col-span-1 md:col-span-2 text-center py-8 text-slate-500 italic border-2 border-dashed border-slate-200 rounded-lg">
                                            No documents uploaded
                                        </div>
                                    )}
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
                                            {student.previousClass ? `Class: ${student.previousClass} ` : ''}
                                            {student.mediumOfInstruction ? ` • Medium: ${student.mediumOfInstruction} ` : ''}
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

                                    {/* Conveyance Display */}
                                    <div className="col-span-1 md:col-span-2 mt-4 pt-4 border-t border-gray-100">
                                        <h4 className="text-sm font-medium text-gray-900 mb-2">Transport Details</h4>
                                        <div className="flex items-center gap-2">
                                            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                                <Bus size={20} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">
                                                    {student.conveyanceSlab && student.conveyanceSlab > 0
                                                        ? `Slab ${student.conveyanceSlab} (₹${200 + (parseInt(student.conveyanceSlab) * 100)})`
                                                        : 'Not Applicable'}
                                                </p>
                                                <p className="text-xs text-gray-500">Monthly Conveyance Fee</p>
                                            </div>
                                        </div>
                                    </div>


                                </div>
                            </div>
                        </>
                    ) : (
                        /* Mode: EDIT Form */
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <form id="edit-student-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                                {/* Administrative */}
                                <Accordion title="Administrative Info" icon={Book} defaultOpen={true}>
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
                                </Accordion>

                                {/* Personal */}
                                <Accordion title="Personal Info" icon={User}>
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
                                </Accordion>

                                {/* Previous Education */}
                                <Accordion title="Previous Education" icon={Book}>
                                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
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
                                </Accordion>

                                {/* Health */}
                                <Accordion title="Health Details" icon={Ban}>
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
                                </Accordion>

                                {/* Parents */}
                                <Accordion title="Parents & Guardian & Address" icon={User}>
                                    <div className="space-y-6">
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

                                        {/* Conveyance Slab */}
                                        <div>
                                            <label className="block text-xs font-medium text-slate-700 mb-1">Conveyance Slab</label>
                                            <select
                                                {...register('conveyanceSlab')}
                                                className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                            >
                                                <option value="0">Not Applicable</option>
                                                <option value="1">Slab 1 (₹300)</option>
                                                <option value="2">Slab 2 (₹400)</option>
                                                <option value="3">Slab 3 (₹500)</option>
                                                <option value="4">Slab 4 (₹600)</option>
                                                <option value="5">Slab 5 (₹700)</option>
                                            </select>
                                        </div>
                                    </div>
                                </Accordion>


                                {/* Documents Upload (Edit Mode) */}
                                <Accordion title="Documents" icon={File}>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {['Birth Certificate', 'Transfer Certificate', 'Previous Marksheet', 'Aadhar Card', 'Other'].map((category) => {
                                            const uploadedDoc = documents.find(d => d.category === category);
                                            const isUploading = uploading[category];

                                            return (
                                                <div key={category} className="space-y-2">
                                                    <label className="block text-xs font-semibold text-slate-700">{category}</label>

                                                    {uploadedDoc ? (
                                                        <div className={`flex items-center justify-between p-3 border rounded-lg ${uploadedDoc.isPending ? 'border-amber-200 bg-amber-50/50' : 'border-emerald-200 bg-emerald-50/50'}`}>
                                                            <div className="flex items-center gap-3 overflow-hidden">
                                                                <div className={`p-1.5 rounded ${uploadedDoc.isPending ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                                                    <FileText size={16} />
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <div className="flex items-center gap-2">
                                                                        <p className="text-xs font-medium text-slate-900 truncate max-w-[150px]">{uploadedDoc.name}</p>
                                                                        {uploadedDoc.isPending && (
                                                                            <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">Pending</span>
                                                                        )}
                                                                    </div>
                                                                    {!uploadedDoc.isPending && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleDownload(uploadedDoc)}
                                                                            className="text-[10px] text-indigo-600 hover:underline flex items-center gap-1 bg-transparent border-0 cursor-pointer p-0"
                                                                        >
                                                                            Download <Download size={10} />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDeleteClick(uploadedDoc)}
                                                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                                                title="Remove Document"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="relative">
                                                            <input
                                                                type="file"
                                                                id={`doc-upload-${category}`}
                                                                onChange={(e) => handleFileUpload(e, category)}
                                                                className="hidden"
                                                                disabled={isUploading}
                                                            />
                                                            <label
                                                                htmlFor={`doc-upload-${category}`}
                                                                className={`flex flex-col items-center justify-center gap-2 w-full p-4 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-indigo-500 hover:bg-indigo-50/30 transition-all ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                            >
                                                                <Upload size={18} className="text-slate-400" />
                                                                <span className="text-xs font-medium text-slate-600">
                                                                    {isUploading ? "Uploading..." : "Click to Upload"}
                                                                </span>
                                                            </label>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </Accordion>

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
            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => {
                    setIsDeleteModalOpen(false);
                    setDocumentToDelete(null);
                }}
                onConfirm={handleConfirmDelete}
                title="Delete Document"
                message={`Are you sure you want to delete ${documentToDelete?.category}? This action cannot be undone.`}
                confirmText="Delete"
                isDanger={true}
            />
        </div>
    );
}
