import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Edit, Save, User, Phone, MapPin, Calendar, Book, FileText, Ban, Bus, Trash2, ExternalLink, Upload, File, Download, CreditCard, ChevronDown, ChevronUp, Printer } from 'lucide-react';
import { storageService } from '../../services/storage';
import { useToast } from '../../components/ui/Toast';
import api from '../../services/api';
import StudentSearch from '../../components/students/StudentSearch';
import ConfirmationModal from '../../components/ui/ConfirmationModal';
import Accordion from '../../components/ui/Accordion';
import { CONVEYANCE_SLABS, calculateConveyanceFee, calculateTotalConveyanceFee } from '../../utils/feeUtils';
import TCModal from '../../components/students/TCModal';
import { generateTC } from '../../utils/tcGenerator';

export default function StudentDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { addToast } = useToast();

    // ... (rest of state definitions)

    // Determine initial mode from navigation state or default to 'view'
    const [mode, setMode] = useState(location.state?.mode || 'view');
    const [loading, setLoading] = useState(true);
    const [student, setStudent] = useState(null);
    const [activeCategories, setActiveCategories] = useState([]); // State for active categories
    const [documents, setDocuments] = useState([]); // State for documents (existing + pending previews)
    const [pendingUploads, setPendingUploads] = useState({}); // Stores File objects: { category: File }
    const [uploading, setUploading] = useState(false); // General loading state during submit
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [documentToDelete, setDocumentToDelete] = useState(null);
    const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm();
    const [siblings, setSiblings] = useState([]);
    const [discounts, setDiscounts] = useState([]); // Per-category fee discounts

    // Accordion State
    const [openSection, setOpenSection] = useState('academic');
    const [isTCModalOpen, setIsTCModalOpen] = useState(false);

    // Watch conveyance slab for dynamic updates in Edit mode
    const watchConveyance = watch('conveyanceSlab');
    const transportMode = watch('transportMode');

    useEffect(() => {
        if (id) {
            fetchStudent();
        }
    }, [id]);

    const toggleSection = (section) => {
        setOpenSection(openSection === section ? null : section);
    };

    const handleDownloadProfile = async () => {
        if (!student) return;
        const doc = new jsPDF();

        // Student Photo
        if (student.photoUrl) {
            try {
                const img = await new Promise((resolve, reject) => {
                    const img = new Image();
                    img.crossOrigin = 'Anonymous';
                    img.onload = () => resolve(img);
                    img.onerror = () => reject(new Error("Could not load image"));
                    img.src = student.photoUrl;
                });
                // Add photo to top right
                doc.addImage(img, 'JPEG', 160, 15, 35, 35);
                // Optional: add a border around the photo
                doc.setDrawColor(79, 70, 229); // Indigo 600
                doc.setLineWidth(0.5);
                doc.rect(160, 15, 35, 35);
            } catch (error) {
                console.warn("Skipping photo in PDF:", error);
                // Placeholder if photo fails
                doc.setDrawColor(200, 200, 200);
                doc.rect(160, 15, 35, 35);
                doc.setFontSize(8);
                doc.setTextColor(100, 116, 139);
                doc.text('No Photo', 170, 32);
            }
        }

        // Brand Colors
        const primaryColor = [79, 70, 229]; // Indigo 600
        const secondaryColor = [100, 116, 139]; // Slate 500

        // Header
        doc.setFontSize(22);
        doc.setTextColor(...primaryColor);
        doc.text('STEM Global Public School', 14, 20);

        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text('Student Profile Report', 14, 30);

        doc.setFontSize(10);
        doc.setTextColor(...secondaryColor);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 38);

        let finalY = 55; // Pushed down slightly to accommodate header/photo

        const addField = (label, value) => [label, value || '-'];

        // --- 1. Academic & Administrative ---
        autoTable(doc, {
            startY: finalY,
            head: [['Attribute', 'Details']],
            body: [
                addField('Full Name', student.name),
                addField('Admission No', student.admissionNo),
                addField('Class & Section', `${student.className || student.class} - ${student.section}`),
                addField('Roll No', student.rollNo),
                addField('Application No', student.applicationNo),
                addField('Date of Admission', student.submissionDate ? new Date(student.submissionDate).toLocaleDateString() : '-'),
                addField('Fee Status', student.feesStatus)
            ],
            theme: 'grid',
            headStyles: { fillColor: primaryColor, textColor: 255, fontStyle: 'bold' },
            columnStyles: { 0: { fontStyle: 'bold', cellWidth: 60 } },
            margin: { top: 10 },
            showHead: 'firstPage'
        });
        finalY = doc.lastAutoTable.finalY + 10;

        // --- 2. Personal Information ---
        doc.text('Personal Information', 14, finalY);
        finalY += 3;
        autoTable(doc, {
            startY: finalY,
            body: [
                ['Date of Birth', student.dob ? new Date(student.dob).toLocaleDateString() : '-', 'Gender', student.gender],
                ['Blood Group', student.bloodGroup || '-', 'Nationality', student.nationality || '-'],
                ['Religion', student.religion || '-', 'Caste', student.caste || '-'],
                ['Category', student.category || '-', 'Aadhar No', student.aadharNo || '-'],
                ['Place of Birth', student.placeOfBirth || '-', 'Email', student.email || '-'],
                ['Primary Phone', student.primaryPhone || student.contact || '-', '', '']
            ],
            theme: 'plain',
            styles: { cellPadding: 1.5, fontSize: 10 },
            columnStyles: {
                0: { fontStyle: 'bold', cellWidth: 35 },
                2: { fontStyle: 'bold', cellWidth: 35 }
            },
        });
        finalY = doc.lastAutoTable.finalY + 5;
        doc.setDrawColor(200, 200, 200);
        doc.line(14, finalY, 196, finalY); // Separator line
        finalY += 10;

        // --- 3. Academic History ---
        doc.text('Academic History', 14, finalY);
        finalY += 3;
        autoTable(doc, {
            startY: finalY,
            body: [
                ['Previous School', student.previousSchool || '-', 'Previous Class', student.previousClass || '-'],
                ['Medium of Instr.', student.mediumOfInstruction || '-', '', '']
            ],
            theme: 'plain',
            styles: { cellPadding: 1.5, fontSize: 10 },
            columnStyles: {
                0: { fontStyle: 'bold', cellWidth: 35 },
                2: { fontStyle: 'bold', cellWidth: 35 }
            },
        });
        finalY = doc.lastAutoTable.finalY + 5;
        doc.line(14, finalY, 196, finalY);
        finalY += 10;

        // --- 4. Health Information ---
        doc.text('Health Information', 14, finalY);
        finalY += 3;
        autoTable(doc, {
            startY: finalY,
            body: [
                ['Medical Condition', student.hasMedicalCondition ? 'Yes' : 'No', 'Details', student.medicalConditionDetails || '-'],
                ['Allergies', student.hasAllergy ? 'Yes' : 'No', 'Details', student.allergyDetails || '-'],
                ['Learning Disability', student.hasLearningDisability ? 'Yes' : 'No', 'Details', student.learningDisabilityDetails || '-']
            ],
            theme: 'plain',
            styles: { cellPadding: 1.5, fontSize: 10 },
            columnStyles: {
                0: { fontStyle: 'bold', cellWidth: 35 },
                2: { fontStyle: 'bold', cellWidth: 35 }
            },
        });
        finalY = doc.lastAutoTable.finalY + 5;
        doc.line(14, finalY, 196, finalY);
        finalY += 10;

        // --- 5. Parent & Guardian Details ---
        doc.text('Parent & Guardian Details', 14, finalY);
        finalY += 3;

        const parentBody = [
            ['Father', student.fatherName || '-', student.fatherMobile || '-', student.fatherEmail || '-', student.fatherOccupation || '-'],
            ['Mother', student.motherName || '-', student.motherMobile || '-', student.motherEmail || '-', student.motherOccupation || '-'],
            ['Guardian', student.guardianName || '-', student.guardianPhone || '-', '-', student.guardianOccupation || '-']
        ];

        autoTable(doc, {
            startY: finalY,
            head: [['Relation', 'Name', 'Phone', 'Email', 'Occupation']],
            body: parentBody, // Include all, even if empty
            theme: 'striped',
            headStyles: { fillColor: [100, 116, 139] } // Slate 500
        });
        finalY = doc.lastAutoTable.finalY + 10;

        // --- 6. Address ---
        const resAddr = student.residentialAddress;
        const resString = resAddr ? `${resAddr.houseNo || ''} ${resAddr.street || ''} ${resAddr.locality || ''} ${resAddr.city || ''} ${resAddr.state || ''} ${resAddr.pinCode || ''}`.trim() : student.address || '-';

        const permAddr = student.permanentAddress;
        const permString = permAddr ? `${permAddr.houseNo || ''} ${permAddr.street || ''} ${permAddr.locality || ''} ${permAddr.city || ''} ${permAddr.state || ''} ${permAddr.pinCode || ''}`.trim() : '-';

        autoTable(doc, {
            startY: finalY,
            head: [['Address Type', 'Details']],
            body: [
                ['Residential', resString],
                ['Permanent', permString]
            ],
            theme: 'grid',
            columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 } }
        });
        finalY = doc.lastAutoTable.finalY + 10;

        // --- 7. Emergency Contact ---
        autoTable(doc, {
            startY: finalY,
            head: [['Emergency Contact', 'Phone', 'Relation']],
            body: [
                [
                    student.emergencyContact?.name || student.fatherName || '-',
                    student.emergencyContact?.phone || student.fatherMobile || '-',
                    student.emergencyContact?.relation || 'Father'
                ]
            ],
            theme: 'grid',
            headStyles: { fillColor: [239, 68, 68] } // Red
        });
        finalY = doc.lastAutoTable.finalY + 10;

        // --- 8. Transport ---
        autoTable(doc, {
            startY: finalY,
            head: [['Transport Mode', 'Route No', 'Pickup', 'Drop']],
            body: [
                [
                    student.transportation?.mode || 'Walking',
                    student.transportation?.routeNumber || '-',
                    student.transportation?.pickupPoint || '-',
                    student.transportation?.dropPoint || '-'
                ]
            ],
            theme: 'grid',
            headStyles: { fillColor: [249, 115, 22] } // Orange
        });
        finalY = doc.lastAutoTable.finalY + 10;

        // --- 9. Siblings ---
        if (student.siblings && student.siblings.length > 0) {
            doc.text('Sibling Information', 14, finalY);
            finalY += 3;
            autoTable(doc, {
                startY: finalY,
                head: [['Name', 'Class', 'Section', 'Admission No']],
                body: student.siblings.map(sib => [sib.name || '-', sib.class || '-', sib.section || '-', sib.admissionNo || '-']),
                theme: 'striped',
                headStyles: { fillColor: [13, 148, 136] } // Teal
            });
            finalY = doc.lastAutoTable.finalY + 10;
        }

        // Save
        doc.save(`Profile_${student.name}_${student.admissionNo}.pdf`);
    };

    const handleDownloadFeeStatement = () => {
        if (!student) return;
        const doc = jsPDF();
        const primaryColor = [79, 70, 229]; // Indigo 600

        // Header - School Branding
        doc.setFontSize(20);
        doc.setTextColor(...primaryColor);
        doc.text('STEM Global Public School', 14, 20);

        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text('Student Fee Statement', 14, 30);

        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 38);

        let finalY = 45;

        // 1. Student & Parent Information
        autoTable(doc, {
            startY: finalY,
            head: [['Student Details', 'Parent Details']],
            body: [
                [
                    `Name: ${student.name}\nClass: ${student.className || student.class} - ${student.section}\nRoll No: ${student.rollNo}\nAdmission No: ${student.admissionNo}`,
                    `Father: ${student.fatherName || '-'}\nPhone: ${student.fatherMobile || '-'}\nEmail: ${student.fatherEmail || '-'}`
                ]
            ],
            theme: 'grid',
            headStyles: { fillColor: primaryColor, textColor: 255 },
            styles: { cellPadding: 5, fontSize: 10, lineHeight: 1.5 }
        });
        finalY = doc.lastAutoTable.finalY + 10;

        // 2. Fee Summary
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text('Fee Summary', 14, finalY);
        finalY += 5;

        autoTable(doc, {
            startY: finalY,
            body: [
                ['Total Annual Fee', `Rs. ${student.feeDetails?.totalFee?.toLocaleString()}`],
                ['Total Amount Paid', `Rs. ${student.feeDetails?.paid?.toLocaleString()}`],
                ['Total Balance Due', `Rs. ${student.feeDetails?.pending?.toLocaleString()}`]
            ],
            theme: 'striped',
            styles: { fontSize: 10, cellPadding: 3 },
            columnStyles: {
                0: { fontStyle: 'bold', cellWidth: 100 },
                1: { halign: 'right', fontStyle: 'bold' }
            }
        });
        // Add color to balance if pending
        if (student.feeDetails?.pending > 0) {
            doc.setTextColor(220, 38, 38); // Red
            doc.setFontSize(10);
            const balanceY = doc.lastAutoTable.finalY - 5;
            // Since we can't easily re-paint a cell, we rely on the summary text
        }
        finalY = doc.lastAutoTable.finalY + 10;

        // 3. Category-wise Breakdown
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text('Fee Breakdown (Category-wise)', 14, finalY);
        finalY += 5;

        autoTable(doc, {
            startY: finalY,
            head: [['Fee Category', 'Annual Total', 'Paid', 'Pending', 'Status']],
            body: student.feeDetails?.breakdown?.map(cat => [
                cat.name,
                `Rs. ${cat.total.toLocaleString()}`,
                `Rs. ${cat.paid.toLocaleString()}`,
                `Rs. ${cat.pending.toLocaleString()}`,
                cat.pending === 0 ? 'CLEARED' : 'PENDING'
            ]),
            theme: 'grid',
            headStyles: { fillColor: [100, 116, 139] },
            columnStyles: {
                1: { halign: 'right' },
                2: { halign: 'right' },
                3: { halign: 'right' },
                4: { halign: 'center' }
            },
            didParseCell: (data) => {
                if (data.column.index === 4 && data.cell.text[0] === 'CLEARED') {
                    data.cell.styles.textColor = [22, 163, 74];
                    data.cell.styles.fontStyle = 'bold';
                }
                if (data.column.index === 4 && data.cell.text[0] === 'PENDING') {
                    data.cell.styles.textColor = [220, 38, 38];
                }
            }
        });
        finalY = doc.lastAutoTable.finalY + 10;

        // 4. Transaction History
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text('Transaction History', 14, finalY);
        finalY += 5;

        autoTable(doc, {
            startY: finalY,
            head: [['Date', 'Receipt No', 'Fee Type', 'Mode', 'Amount']],
            body: (student.feeHistory || []).map(txn => [
                new Date(txn.paymentDate || txn.createdAt).toLocaleDateString(),
                txn.receiptNo || 'MANUAL-ENTRY',
                txn.feeType || 'Payment',
                txn.paymentMode || txn.mode || 'Cash',
                `Rs. ${txn.amount?.toLocaleString()}`
            ]),
            theme: 'striped',
            headStyles: { fillColor: [71, 85, 105] },
            columnStyles: {
                4: { halign: 'right', fontStyle: 'bold' }
            }
        });

        // Save
        doc.save(`FeeStatement_${student.name}_${student.admissionNo}.pdf`);
    };

    const fetchStudent = async () => {
        setLoading(true);
        try {
            // Parallel fetch: Student Profile, Fee History, and Active Categories
            const [data, feeHistory, categoriesRes] = await Promise.all([
                storageService.students.getById(id).catch(err => {
                    console.error("Failed to fetch student profile:", err);
                    return null;
                }),
                storageService.fees.getByStudent(id).catch(err => {
                    console.error("Failed to fetch fee history:", err);
                    return [];
                }),
                api.get('/fee-categories').catch(err => {
                    console.error("Failed to fetch fee categories:", err);
                    return { data: [] };
                })
            ]);

            const fetchedCategories = categoriesRes.data || [];
            setActiveCategories(fetchedCategories);

            if (!data) {
                console.error("Student not found for ID:", id);
                addToast("Student not found", "error");
                navigate('/admin/students');
                return;
            }

            // Calculate dynamic fee stats breakdown
            const breakdown = [];
            const slab = data.conveyanceSlab ? parseInt(data.conveyanceSlab) : 0;
            let totalFeeComputed = 0;
            let totalPaidComputed = 0;

            const feeDetails = {
                paid: 0,
                pending: 0,
                totalFee: 0,
                monthlyConveyance: calculateConveyanceFee(slab),
                breakdown: []
            };

            // Calculate paid per category from history breakdown
            const categoryPaid = {};
            feeHistory.forEach(txn => {
                let txnAmountLeft = txn.amount || 0;
                if (txn.breakdown && txn.breakdown.length > 0) {
                    txn.breakdown.forEach(item => {
                        // Normalize name for matching
                        const normalizedName = item.feeType?.trim().toLowerCase();
                        if (normalizedName) {
                            categoryPaid[normalizedName] = (categoryPaid[normalizedName] || 0) + item.amount;
                        }
                    });
                } else if (txn.feeType) {
                    // Fallback for older singular fees
                    const normalizedName = txn.feeType.trim().toLowerCase();
                    categoryPaid[normalizedName] = (categoryPaid[normalizedName] || 0) + txnAmountLeft;
                }
                totalPaidComputed += (txn.amount || 0);
            });

            // Calculate precise pending/total per category
            const currentClassName = data.className || data.class;
            const studentDiscounts = data.discounts || [];

            fetchedCategories.forEach(category => {
                const normalizedCatName = category.name.trim().toLowerCase();
                let annualTotal = 0;
                let monthlyAmount = 0;

                if (category.hasSlabs) {
                    // Slab-based (e.g. Conveyance): Only include if student has an active slab
                    if (slab > 0) {
                        const baseMonthly = category.baseAmount || 0;
                        monthlyAmount = baseMonthly + (slab * (category.slabMultiplier || 0));
                        annualTotal = monthlyAmount * (category.months || 10);
                    }
                } else {
                    // Regular fee: class-specific amount
                    const classSpecific = category.amounts?.find(a => a.className === currentClassName);
                    annualTotal = classSpecific ? classSpecific.amount : (category.baseAmount || 0);
                    monthlyAmount = annualTotal / (category.months || 10);
                }

                if (annualTotal > 0) {
                    // Apply per-category discount if present
                    const discountEntry = studentDiscounts.find(d =>
                        d.categoryId?.toString() === category._id?.toString() ||
                        d.categoryName?.toLowerCase() === normalizedCatName
                    );
                    const discountAmt = discountEntry?.discountAmount || 0;
                    const netTotal = Math.max(0, annualTotal - discountAmt);

                    totalFeeComputed += netTotal;
                    const paidForCat = categoryPaid[normalizedCatName] || 0;
                    const pendingForCat = Math.max(0, netTotal - paidForCat);

                    feeDetails.breakdown.push({
                        id: category._id,
                        name: category.name,
                        type: category.type,
                        total: annualTotal,           // gross before discount
                        discountAmount: discountAmt,  // discount granted
                        netTotal: netTotal,           // net due after discount
                        paid: paidForCat,
                        pending: pendingForCat,
                        monthly: monthlyAmount,
                        months: category.months || 10
                    });
                }
            });


            feeDetails.paid = totalPaidComputed;
            feeDetails.totalFee = totalFeeComputed;
            feeDetails.pending = Math.max(0, totalFeeComputed - totalPaidComputed);

            const studentWithFees = {
                ...data,
                feeDetails: feeDetails,
                feeHistory: feeHistory || [] // Store history
            };

            setStudent(studentWithFees);
            setDocuments(data.documents || []);
            setSiblings(data.siblings || []);
            setDiscounts(data.discounts || []);  // Initialise discount state from saved student data
            setPendingUploads({});

            // Legacy Address Auto-fill Logic
            let legacyHouseNo = '';
            let legacyCity = '';
            let legacyState = '';
            if (!data.residentialAddress?.houseNo && data.address) {
                const parts = data.address.split(',').map(p => p.trim()).filter(p => p);
                if (parts.length > 0) legacyHouseNo = parts[0];
                if (parts.length > 1) legacyCity = parts[1];
                if (parts.length > 2) legacyState = parts[parts.length - 1];
            }

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
                // Guardian Details
                isGuardian: data.isGuardian,
                guardianName: data.guardianName,
                guardianRelation: data.guardianRelation,
                guardianOccupation: data.guardianOccupation,
                guardianPhone: data.guardianPhone,
                guardianAddress: data.guardianAddress,

                // Emergency Contact (Default to Father if empty)
                emergencyName: data.emergencyContact?.name || data.fatherName,
                emergencyPhone: data.emergencyContact?.phone || data.fatherMobile,
                emergencyRelation: data.emergencyContact?.relation || 'Father',

                fatherName: data.fatherName,
                fatherOccupation: data.fatherOccupation,
                fatherDesignation: data.fatherDesignation,
                fatherCompany: data.fatherCompany,
                fatherOfficeAddress: data.fatherOfficeAddress,
                fatherEducation: data.fatherEducation,
                fatherIncome: data.fatherIncome,
                fatherMobile: data.fatherMobile,
                fatherEmail: data.fatherEmail,
                motherName: data.motherName,
                motherOccupation: data.motherOccupation,
                motherDesignation: data.motherDesignation,
                motherCompany: data.motherCompany,
                motherOfficeAddress: data.motherOfficeAddress,
                motherEducation: data.motherEducation,
                motherIncome: data.motherIncome,
                motherMobile: data.motherMobile,
                motherEmail: data.motherEmail,
                primaryPhone: data.primaryPhone || data.contact,
                email: data.email,

                // Address Details (Flattened)
                resHouseNo: data.residentialAddress?.houseNo || legacyHouseNo,
                resStreet: data.residentialAddress?.street,
                resLocality: data.residentialAddress?.locality,
                resCity: data.residentialAddress?.city || legacyCity,
                resState: data.residentialAddress?.state || legacyState,
                resPinCode: data.residentialAddress?.pinCode,
                resCountry: data.residentialAddress?.country || 'India',

                permHouseNo: data.permanentAddress?.houseNo,
                permStreet: data.permanentAddress?.street,
                permLocality: data.permanentAddress?.locality,
                permCity: data.permanentAddress?.city,
                permState: data.permanentAddress?.state,
                permPinCode: data.permanentAddress?.pinCode,
                permCountry: data.permanentAddress?.country || 'India',

                // Transportation
                transportMode: data.transportation?.mode || 'Walking',
                routeNumber: data.transportation?.routeNumber,
                pickupPoint: data.transportation?.pickupPoint,
                dropPoint: data.transportation?.dropPoint,

                // If legacy address exists but new fields are empty, keep it?  
                // We rely on new fields. We can check if new residentialAddress is empty and populate 'resStreet' with old address as fallback
                // For now, let's keep it clean.
                address: data.address,

                feesStatus: data.feesStatus,
                conveyanceSlab: data.conveyanceSlab || '0'
            });

            // Default open section
            setOpenSection('academic');

        } catch (error) {
            console.error(error);
            addToast("Failed to fetch student details", "error");
        } finally {
            setLoading(false);
        }
    };

    // Auto-fill Permanent Address from Residential Address Logic
    const sameAsResidential = watch('sameAsResidential');
    const [resHouseNo, resStreet, resLocality, resCity, resState, resPinCode, resCountry] = watch(['resHouseNo', 'resStreet', 'resLocality', 'resCity', 'resState', 'resPinCode', 'resCountry']);

    useEffect(() => {
        if (sameAsResidential && mode === 'edit') {
            setValue('permHouseNo', resHouseNo);
            setValue('permStreet', resStreet);
            setValue('permLocality', resLocality);
            setValue('permCity', resCity);
            setValue('permState', resState);
            setValue('permPinCode', resPinCode);
            setValue('permCountry', resCountry || 'India');
        }
    }, [sameAsResidential, resHouseNo, resStreet, resLocality, resCity, resState, resPinCode, resCountry, mode, setValue]);

    const handleFileUpload = (e, category) => {
        const file = e.target.files[0];
        if (!file) return;

        setPendingUploads(prev => ({ ...prev, [category]: file }));

        const tempDoc = {
            name: file.name,
            url: URL.createObjectURL(file),
            type: file.type,
            category: category,
            isPending: true
        };

        setDocuments(prev => {
            const filtered = prev.filter(d => d.category !== category);
            return [...filtered, tempDoc];
        });

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
                await api.delete('/upload', { data: { fileName: doc.url } });
                const updatedDocs = documents.filter(d => d.url !== doc.url && !d.isPending);
                await storageService.students.update(id, {
                    documents: updatedDocs
                });
                setDocuments(prev => prev.filter(d => d.url !== doc.url));
                addToast("Document deleted successfully", "success");
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

            const existingDocs = documents.filter(d => !d.isPending);
            const finalDocuments = [...existingDocs, ...uploadedDocs];

            // Construct Address Objects
            const residentialAddress = {
                houseNo: data.resHouseNo,
                street: data.resStreet,
                locality: data.resLocality,
                city: data.resCity,
                state: data.resState,
                pinCode: data.resPinCode,
                country: data.resCountry || 'India'
            };

            const permanentAddress = {
                houseNo: data.permHouseNo,
                street: data.permStreet,
                locality: data.permLocality,
                city: data.permCity,
                state: data.permState,
                pinCode: data.permPinCode,
                country: data.permCountry || 'India'
            };

            const emergencyContact = {
                name: data.emergencyName,
                phone: data.emergencyPhone,
                relation: data.emergencyRelation
            };

            // Remove flat address fields
            const {
                resHouseNo, resStreet, resLocality, resCity, resState, resPinCode, resCountry,
                permHouseNo, permStreet, permLocality, permCity, permState, permPinCode, permCountry,
                sameAsResidential,
                // Remove flat emergency fields
                emergencyName, emergencyPhone, emergencyRelation,
                // Remove flat transportation fields
                transportMode, routeNumber, pickupPoint, dropPoint,
                ...restData
            } = data;

            const transportation = {
                mode: transportMode || 'Walking',
                routeNumber,
                pickupPoint,
                dropPoint
            };

            const siblingData = siblings.map(s => ({
                studentId: s.id || s.studentId, // Handle both raw student and flattened sibling object
                name: s.name,
                class: s.className || s.class,
                section: s.section,
                admissionNo: s.admissionNo
            }));

            // Sync photoUrl from documents
            const photoDoc = finalDocuments.find(d => d.category === 'Student Photo');
            const photoUrl = photoDoc ? photoDoc.url : '';

            // Recalculate the guardian field so the Student List CONTACT column stays in sync.
            // If a separate guardian is registered, use their name; otherwise use father's name.
            const updatedGuardian = (restData.isGuardian && restData.guardianName)
                ? restData.guardianName
                : (restData.fatherName || restData.motherName || restData.guardian);

            const updatedStudent = await storageService.students.update(id, {
                ...restData,
                guardian: updatedGuardian,
                residentialAddress,
                permanentAddress,
                emergencyContact,
                transportation,
                siblings: siblingData,
                documents: finalDocuments,
                photoUrl: photoUrl,
                conveyanceSlab: parseInt(data.conveyanceSlab), // Convert to number
                discounts: discounts.filter(d => d.discountAmount > 0) // Only save non-zero discounts
            });

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
            <div className="flex flex-col items-center justify-center min-h-[500px] gap-4">
                <div className="w-12 h-12 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
                <div className="text-slate-500 font-medium">Loading student details...</div>
            </div>
        );
    }

    if (!student) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[500px] text-center px-4">
                <div className="p-4 bg-rose-50 rounded-full text-rose-600 mb-4">
                    <User size={48} />
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">Student Not Found</h2>
                <p className="text-slate-500 mb-6 max-w-md">We couldn't find the student details you're looking for. The student may have been deleted or the link might be broken.</p>
                <button
                    onClick={() => navigate('/admin/students')}
                    className="px-6 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg font-medium transition-colors"
                >
                    Back to Student List
                </button>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-6 w-full mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/admin/students')}
                            className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
                        >
                            <ArrowLeft size={24} />
                        </button>
                        {/* Student Photo */}
                        <div className="relative">
                            {student.photoUrl ? (
                                <img
                                    src={student.photoUrl}
                                    alt={student.name}
                                    className="w-16 h-16 rounded-full object-cover border-2 border-indigo-100 shadow-sm"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = '';
                                        e.target.classList.add('hidden');
                                        e.target.nextSibling.classList.remove('hidden');
                                    }}
                                />
                            ) : null}
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-xl ${student.gender === 'Female' ? 'bg-pink-100 text-pink-600' : 'bg-blue-100 text-blue-600'} border-2 border-slate-100 ${student.photoUrl ? 'hidden' : ''}`}>
                                {student.name?.charAt(0)}
                            </div>
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">{student.name}</h1>
                            <p className="text-slate-500 font-mono">ADM: {student.admissionNo}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {mode === 'view' ? (
                            <>
                                <button
                                    onClick={handleDownloadProfile}
                                    className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                                >
                                    <Download size={16} /> Download Profile
                                </button>
                                {student.isActive && (
                                    <button
                                        onClick={() => setIsTCModalOpen(true)}
                                        className="px-4 py-2 bg-amber-500 text-white hover:bg-amber-600 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-sm"
                                    >
                                        <FileText size={16} /> Issue TC
                                    </button>
                                )}
                                <button
                                    onClick={() => {
                                        setMode('edit');
                                        setOpenSection('academic'); // Default to first section in edit mode
                                    }}
                                    disabled={!student.isActive}
                                    title={!student.isActive ? 'Student is no longer active' : 'Edit Profile'}
                                    className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                                        setOpenSection('academic');
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

                {/* TC Modal */}
                {isTCModalOpen && (
                    <TCModal
                        student={student}
                        onClose={() => setIsTCModalOpen(false)}
                        onSuccess={() => {
                            setIsTCModalOpen(false);
                            fetchStudent();
                        }}
                    />
                )}

                {/* Relieved / TC Issued Banner */}
                {!student.isActive && student.promotionStatus === 'Relieved' && (
                    <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                        <FileText size={20} className="text-amber-500 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="font-semibold text-amber-800 text-sm">Transfer Certificate Issued</p>
                            <p className="text-amber-700 text-xs mt-0.5">
                                TC No: <strong>{student.tcDetails?.tcNo || '—'}</strong> &nbsp;·&nbsp;
                                Issued on: <strong>{student.tcDetails?.issueDate ? new Date(student.tcDetails.issueDate).toLocaleDateString('en-IN') : '—'}</strong> &nbsp;·&nbsp;
                                Reason: <strong>{student.tcDetails?.reasonForLeaving || '—'}</strong>
                            </p>
                        </div>
                        <button
                            onClick={async () => student.tcDetails && await generateTC(student, student.tcDetails)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-amber-100 text-amber-700 hover:bg-amber-200 rounded-lg transition-colors border border-amber-300"
                        >
                            <Download size={13} /> Re-download TC
                        </button>
                    </div>
                )}

                {/* Main Content */}
                <div className="flex flex-col lg:flex-row gap-6 items-start">

                    {/* Left Side: Information */}
                    <div className="flex-1 space-y-4 w-full">

                        {/* Mode: VIEW */}
                        {mode === 'view' ? (
                            <div className="space-y-4">
                                {/* Administrative & Academic Details - ACCORDION */}
                                <Accordion
                                    title="Administrative & Academic Info"
                                    icon={Book}
                                    isOpen={openSection === 'academic'}
                                    onToggle={() => toggleSection('academic')}
                                >
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
                                </Accordion>

                                {/* Personal Information - ACCORDION */}
                                <Accordion
                                    title="Personal Information"
                                    icon={User}
                                    isOpen={openSection === 'personal'}
                                    onToggle={() => toggleSection('personal')}
                                >
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
                                </Accordion>

                                {/* Parent Details - ACCORDION - Moved Below Personal */}
                                <Accordion
                                    title="Parents & Guardian Details"
                                    icon={User}
                                    isOpen={openSection === 'guardian'}
                                    onToggle={() => toggleSection('guardian')}
                                >
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

                                        {/* Address Details */}
                                        <div className="col-span-2 md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <h4 className="text-sm font-semibold text-slate-600 border-b border-slate-100 pb-2 mb-4">Residential Address</h4>
                                                {student.residentialAddress && (student.residentialAddress.street || student.residentialAddress.houseNo) ? (
                                                    <div className="text-sm text-slate-700 space-y-1">
                                                        <p>{student.residentialAddress.houseNo}, {student.residentialAddress.street}</p>
                                                        <p>{student.residentialAddress.locality}</p>
                                                        <p>{student.residentialAddress.city}, {student.residentialAddress.state} - {student.residentialAddress.pinCode}</p>
                                                        <p>{student.residentialAddress.country}</p>
                                                    </div>
                                                ) : (
                                                    <p className="font-medium flex items-start gap-2">
                                                        <MapPin size={14} className="text-slate-400 mt-1" />
                                                        {student.address || 'N/A'}
                                                    </p>
                                                )}
                                            </div>

                                            <div>
                                                <h4 className="text-sm font-semibold text-slate-600 border-b border-slate-100 pb-2 mb-4">Permanent Address</h4>
                                                {student.permanentAddress && (student.permanentAddress.street || student.permanentAddress.houseNo) ? (
                                                    <div className="text-sm text-slate-700 space-y-1">
                                                        <p>{student.permanentAddress.houseNo}, {student.permanentAddress.street}</p>
                                                        <p>{student.permanentAddress.locality}</p>
                                                        <p>{student.permanentAddress.city}, {student.permanentAddress.state} - {student.permanentAddress.pinCode}</p>
                                                        <p>{student.permanentAddress.country}</p>
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-slate-500 italic">No permanent address recorded.</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Guardian Details (Conditionally Displayed) */}
                                        {student.isGuardian && (
                                            <div>
                                                <h4 className="text-sm font-semibold text-violet-600 border-b border-violet-100 pb-2 mb-4">Guardian Information</h4>
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                                    <div>
                                                        <p className="text-xs text-slate-500 mb-1">Guardian Name</p>
                                                        <p className="font-medium">{student.guardianName || 'N/A'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-slate-500 mb-1">Relationship</p>
                                                        <p className="font-medium">{student.guardianRelation || 'N/A'}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-slate-500 mb-1">Mobile</p>
                                                        <p className="font-medium flex items-center gap-2">
                                                            <Phone size={14} className="text-slate-400" />
                                                            {student.guardianPhone || 'N/A'}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-slate-500 mb-1">Occupation</p>
                                                        <p className="font-medium">{student.guardianOccupation || 'N/A'}</p>
                                                    </div>
                                                    <div className="col-span-1 md:col-span-2">
                                                        <p className="text-xs text-slate-500 mb-1">Guardian Address</p>
                                                        <p className="font-medium text-sm">{student.guardianAddress || 'N/A'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Emergency Contact */}
                                        <div>
                                            <h4 className="text-sm font-semibold text-orange-600 border-b border-orange-100 pb-2 mb-4">Emergency Contact</h4>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                                <div>
                                                    <p className="text-xs text-slate-500 mb-1">Contact Name</p>
                                                    <p className="font-medium">{student.emergencyContact?.name || student.fatherName || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-500 mb-1">Relationship</p>
                                                    <p className="font-medium">{student.emergencyContact?.relation || 'Father'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-500 mb-1">Mobile</p>
                                                    <p className="font-medium flex items-center gap-2">
                                                        <Phone size={14} className="text-slate-400" />
                                                        {student.emergencyContact?.phone || student.fatherMobile || 'N/A'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Transportation Details */}
                                        <div>
                                            <h4 className="text-sm font-semibold text-blue-600 border-b border-blue-100 pb-2 mb-4">Transportation Details</h4>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                                <div>
                                                    <p className="text-xs text-slate-500 mb-1">Mode</p>
                                                    <p className="font-medium">{student.transportation?.mode || 'N/A'}</p>
                                                </div>
                                                {student.transportation?.mode === 'School Bus' && (
                                                    <>
                                                        <div>
                                                            <p className="text-xs text-slate-500 mb-1">Route No</p>
                                                            <p className="font-medium">{student.transportation?.routeNumber || '-'}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-slate-500 mb-1">Pickup Point</p>
                                                            <p className="font-medium">{student.transportation?.pickupPoint || '-'}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-slate-500 mb-1">Drop Point</p>
                                                            <p className="font-medium">{student.transportation?.dropPoint || '-'}</p>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {/* Sibling Information */}
                                        <div>
                                            <h4 className="text-sm font-semibold text-teal-600 border-b border-teal-100 pb-2 mb-4">Sibling Information</h4>
                                            {student.siblings && student.siblings.length > 0 ? (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {student.siblings.map((sib, idx) => (
                                                        <div key={idx} className="bg-teal-50 border border-teal-100 rounded-lg p-3">
                                                            <p className="font-semibold text-teal-900">{sib.name}</p>
                                                            <p className="text-xs text-teal-700">Class: {sib.class} - {sib.section} • Adm: {sib.admissionNo}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-sm text-slate-500 italic">No siblings linked.</p>
                                            )}
                                        </div>

                                        {/* Conveyance removed from here and moved to Fee Overview */}
                                    </div>
                                </Accordion>

                                {/* Documents - ACCORDION */}
                                <Accordion
                                    title="Documents"
                                    icon={File}
                                    isOpen={openSection === 'documents'}
                                    onToggle={() => toggleSection('documents')}
                                >
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
                                </Accordion>

                                {/* Previous Education - ACCORDION */}
                                <Accordion
                                    title="Previous Education"
                                    icon={Book}
                                    isOpen={openSection === 'education'}
                                    onToggle={() => toggleSection('education')}
                                >
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
                                </Accordion>

                                {/* Health & Other Details - ACCORDION */}
                                <Accordion
                                    title="Health & Other Details"
                                    icon={Ban}
                                    isOpen={openSection === 'health'}
                                    onToggle={() => toggleSection('health')}
                                >
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
                                </Accordion>
                            </div>
                        ) : (
                            /* Mode: EDIT Form */
                            <form id="edit-student-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                                {/* Administrative Details - 1st */}
                                <Accordion
                                    title="Administrative Info"
                                    icon={Book}
                                    isOpen={openSection === 'academic'}
                                    onToggle={() => toggleSection('academic')}
                                >
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

                                {/* Personal Information - 2nd */}
                                <Accordion
                                    title="Personal Info"
                                    icon={User}
                                    isOpen={openSection === 'personal'}
                                    onToggle={() => toggleSection('personal')}
                                >
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

                                {/* Parents - 3rd (Below Personal) */}
                                <Accordion
                                    title="Parents & Guardian & Address"
                                    icon={User}
                                    isOpen={openSection === 'guardian'}
                                    onToggle={() => toggleSection('guardian')}
                                >
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

                                        {/* Address Details */}
                                        <div className="col-span-2 space-y-4">
                                            {/* Residential */}
                                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                                <h4 className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-2">
                                                    <MapPin size={14} /> Residential Address
                                                </h4>
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                                    <div>
                                                        <label className="block text-[10px] font-medium text-slate-500 uppercase">House No</label>
                                                        <input {...register("resHouseNo")} className="w-full p-2 border border-slate-300 rounded text-sm" placeholder="House No" />
                                                    </div>
                                                    <div className="col-span-2">
                                                        <label className="block text-[10px] font-medium text-slate-500 uppercase">Street Name</label>
                                                        <input {...register("resStreet")} className="w-full p-2 border border-slate-300 rounded text-sm" placeholder="Street Name / Road" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-medium text-slate-500 uppercase">Locality</label>
                                                        <input {...register("resLocality")} className="w-full p-2 border border-slate-300 rounded text-sm" placeholder="Locality / Village" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-medium text-slate-500 uppercase">City</label>
                                                        <input {...register("resCity")} className="w-full p-2 border border-slate-300 rounded text-sm" placeholder="City / District" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-medium text-slate-500 uppercase">State</label>
                                                        <input {...register("resState")} className="w-full p-2 border border-slate-300 rounded text-sm" placeholder="State" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-medium text-slate-500 uppercase">PIN Code</label>
                                                        <input {...register("resPinCode")} className="w-full p-2 border border-slate-300 rounded text-sm" placeholder="PIN Code" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[10px] font-medium text-slate-500 uppercase">Country</label>
                                                        <input {...register("resCountry")} defaultValue="India" className="w-full p-2 border border-slate-300 rounded text-sm" />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Permanent */}
                                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                                                <div className="flex items-center justify-between mb-3">
                                                    <h4 className="text-xs font-bold text-slate-700 flex items-center gap-2">
                                                        <MapPin size={14} /> Permanent Address
                                                    </h4>
                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                        <input type="checkbox" {...register("sameAsResidential")} className="rounded text-indigo-600 w-4 h-4" />
                                                        <span className="text-xs text-slate-600">Same as Residential</span>
                                                    </label>
                                                </div>

                                                {!watch('sameAsResidential') && (
                                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 animate-in fade-in slide-in-from-top-2">
                                                        <div>
                                                            <label className="block text-[10px] font-medium text-slate-500 uppercase">House No</label>
                                                            <input {...register("permHouseNo")} className="w-full p-2 border border-slate-300 rounded text-sm" placeholder="House No" />
                                                        </div>
                                                        <div className="col-span-2">
                                                            <label className="block text-[10px] font-medium text-slate-500 uppercase">Street Name</label>
                                                            <input {...register("permStreet")} className="w-full p-2 border border-slate-300 rounded text-sm" placeholder="Street Name / Road" />
                                                        </div>
                                                        <div>
                                                            <label className="block text-[10px] font-medium text-slate-500 uppercase">Locality</label>
                                                            <input {...register("permLocality")} className="w-full p-2 border border-slate-300 rounded text-sm" placeholder="Locality / Village" />
                                                        </div>
                                                        <div>
                                                            <label className="block text-[10px] font-medium text-slate-500 uppercase">City</label>
                                                            <input {...register("permCity")} className="w-full p-2 border border-slate-300 rounded text-sm" placeholder="City / District" />
                                                        </div>
                                                        <div>
                                                            <label className="block text-[10px] font-medium text-slate-500 uppercase">State</label>
                                                            <input {...register("permState")} className="w-full p-2 border border-slate-300 rounded text-sm" placeholder="State" />
                                                        </div>
                                                        <div>
                                                            <label className="block text-[10px] font-medium text-slate-500 uppercase">PIN Code</label>
                                                            <input {...register("permPinCode")} className="w-full p-2 border border-slate-300 rounded text-sm" placeholder="PIN Code" />
                                                        </div>
                                                        <div>
                                                            <label className="block text-[10px] font-medium text-slate-500 uppercase">Country</label>
                                                            <input {...register("permCountry")} defaultValue="India" className="w-full p-2 border border-slate-300 rounded text-sm" />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Guardian Details Toggle */}
                                        <div className="pt-4 border-t border-slate-200">
                                            <div className="flex items-center gap-2 mb-4">
                                                <input
                                                    type="checkbox"
                                                    id="editIsGuardian"
                                                    {...register('isGuardian')}
                                                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                                                />
                                                <label htmlFor="editIsGuardian" className="text-sm font-medium text-slate-800 cursor-pointer">
                                                    Student is NOT living with parents (Edit Guardian Details)
                                                </label>
                                            </div>

                                            {watch('isGuardian') && (
                                                <div className="space-y-3 p-3 bg-violet-50 rounded-lg border border-violet-100 animate-in fade-in">
                                                    <h4 className="text-xs font-bold text-violet-700 mb-2">Guardian's Info</h4>
                                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                        <div>
                                                            <label className="block text-xs font-medium text-slate-700 mb-1">Guardian Name <span className="text-red-500">*</span></label>
                                                            <input {...register("guardianName", { required: watch('isGuardian') })} className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                                                            {errors.guardianName && <span className="text-[10px] text-red-500">Required</span>}
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-medium text-slate-700 mb-1">Relationship <span className="text-red-500">*</span></label>
                                                            <input {...register("guardianRelation", { required: watch('isGuardian') })} className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                                                            {errors.guardianRelation && <span className="text-[10px] text-red-500">Required</span>}
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-medium text-slate-700 mb-1">Phone <span className="text-red-500">*</span></label>
                                                            <input {...register("guardianPhone", { required: watch('isGuardian') })} className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                                                            {errors.guardianPhone && <span className="text-[10px] text-red-500">Required</span>}
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-medium text-slate-700 mb-1">Occupation <span className="text-red-500">*</span></label>
                                                            <input {...register("guardianOccupation", { required: watch('isGuardian') })} className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                                                            {errors.guardianOccupation && <span className="text-[10px] text-red-500">Required</span>}
                                                        </div>
                                                        <div className="col-span-1 md:col-span-2">
                                                            <label className="block text-xs font-medium text-slate-700 mb-1">Guardian Address <span className="text-red-500">*</span></label>
                                                            <textarea {...register("guardianAddress", { required: watch('isGuardian') })} rows={2} className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                                                            {errors.guardianAddress && <span className="text-[10px] text-red-500">Required</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Emergency Contact */}
                                        <div className="pt-4 border-t border-slate-200 mt-4">
                                            <div className="p-3 bg-orange-50 rounded-lg border border-orange-100">
                                                <h4 className="text-xs font-bold text-orange-700 mb-2">Emergency Contact</h4>
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                    <div>
                                                        <label className="block text-xs font-medium text-slate-700 mb-1">Name</label>
                                                        <input {...register("emergencyName")} className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium text-slate-700 mb-1">Mobile</label>
                                                        <input {...register("emergencyPhone")} className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-medium text-slate-700 mb-1">Relation</label>
                                                        <input {...register("emergencyRelation")} className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        {/* Transportation Details (Edit) */}
                                        <div className="pt-4 border-t border-slate-200 mt-4">
                                            <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                                                <h4 className="text-xs font-bold text-blue-700 mb-2">Transportation Details</h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-xs font-medium text-slate-700 mb-1">Mode of Transport</label>
                                                        <select {...register("transportMode")} className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                                                            <option value="Walking">Walking / Self</option>
                                                            <option value="Private">Private Transport</option>
                                                            <option value="School Bus">School Bus</option>
                                                        </select>
                                                    </div>
                                                    {transportMode === 'School Bus' && (
                                                        <>
                                                            <div>
                                                                <label className="block text-xs font-medium text-slate-700 mb-1">Route Number</label>
                                                                <input {...register("routeNumber")} className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" placeholder="Route No" />
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs font-medium text-slate-700 mb-1">Pickup Point</label>
                                                                <input {...register("pickupPoint")} className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" placeholder="Pickup Point" />
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs font-medium text-slate-700 mb-1">Drop Point</label>
                                                                <input {...register("dropPoint")} className="w-full p-2 border border-slate-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" placeholder="Drop Point" />
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Sibling Information (Edit) */}
                                        <div className="pt-4 border-t border-slate-200 mt-4">
                                            <div className="p-3 bg-teal-50 rounded-lg border border-teal-100">
                                                <h4 className="text-xs font-bold text-teal-700 mb-2">Sibling Information</h4>

                                                <div className="mb-4">
                                                    <label className="block text-xs font-medium text-slate-700 mb-1">Add Sibling</label>
                                                    <StudentSearch
                                                        onSelect={(student) => {
                                                            if (!siblings.find(s => (s.id || s.studentId) === student.id)) {
                                                                setSiblings([...siblings, student]);
                                                            }
                                                        }}
                                                        excludeIds={[id, ...siblings.map(s => s.id || s.studentId)]}
                                                    />
                                                </div>

                                                {siblings.length > 0 && (
                                                    <div className="space-y-2">
                                                        <p className="text-xs font-medium text-slate-600">Linked Siblings:</p>
                                                        <div className="grid gap-2">
                                                            {siblings.map((sib, idx) => (
                                                                <div key={idx} className="flex items-center justify-between bg-white border border-teal-100 p-2 rounded">
                                                                    <div>
                                                                        <p className="font-semibold text-teal-900 text-sm">{sib.name}</p>
                                                                        <p className="text-xs text-teal-700">Class: {sib.className || sib.class} - {sib.section} | Adm: {sib.admissionNo}</p>
                                                                    </div>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setSiblings(siblings.filter((_, i) => i !== idx))}
                                                                        className="text-red-400 hover:text-red-600"
                                                                    >
                                                                        <Trash2 size={14} />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </Accordion>



                                {/* Documents (Edit Mode) */}
                                <Accordion
                                    title="Documents"
                                    icon={File}
                                    isOpen={openSection === 'documents'}
                                    onToggle={() => toggleSection('documents')}
                                >
                                    <div className="space-y-4">
                                        {[
                                            'Student Photo',
                                            'Birth Certificate',
                                            'Transfer Certificate',
                                            'Previous Marksheet',
                                            'Report Card (Previous School)',
                                            'Caste Certificate',
                                            'Aadhar Card (Student)',
                                            "Parent's Aadhar Card",
                                            'Medical Certificate',
                                            'Address Proof'
                                        ].map((docType) => {
                                            const existingDoc = documents.find(d => d.category === docType);
                                            return (
                                                <div key={docType} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
                                                    <div>
                                                        <p className="text-sm font-medium text-slate-900">{docType}</p>
                                                        {existingDoc ? (
                                                            <div className="text-xs text-green-600 flex items-center gap-1 mt-1">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                                                Uploaded: {existingDoc.name}
                                                            </div>
                                                        ) : (
                                                            <p className="text-xs text-slate-500 mt-1 italic">Not uploaded</p>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {existingDoc && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDeleteClick(existingDoc)}
                                                                className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                                                title="Delete Document"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        )}
                                                        <label className="cursor-pointer p-2 text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors relative">
                                                            <Upload size={16} />
                                                            <input
                                                                type="file"
                                                                className="hidden" // Hidden input, triggered by label
                                                                onChange={(e) => handleFileUpload(e, docType)}
                                                                accept=".pdf,.jpg,.jpeg,.png"
                                                            />
                                                        </label>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </Accordion>

                                {/* Fee Overview & Conveyance (Edit Mode) */}
                                <Accordion
                                    title="Fee Overview & Conveyance"
                                    icon={CreditCard}
                                    isOpen={openSection === 'fees'}
                                    onToggle={() => toggleSection('fees')}
                                >
                                    <div className="space-y-6">
                                        {/* Conveyance Selector */}
                                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                                            <label className="block text-sm font-semibold text-blue-800 mb-2 flex items-center gap-2">
                                                <Bus size={16} />
                                                Conveyance Slab Selection
                                            </label>
                                            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                                                <select
                                                    {...register("conveyanceSlab")}
                                                    className="w-full md:w-auto flex-1 p-2 border rounded text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm"
                                                >
                                                    {CONVEYANCE_SLABS.map(slab => (
                                                        <option key={slab.id} value={slab.id}>
                                                            {slab.label} {slab.id > 0 ? `(₹${slab.monthly}/mo)` : ''}
                                                        </option>
                                                    ))}
                                                </select>
                                                {watchConveyance > 0 && (
                                                    <div className="text-right flex-1">
                                                        <p className="text-xs text-blue-600 font-semibold uppercase">Est. Conveyance Fee</p>
                                                        <p className="text-lg font-bold text-blue-800">
                                                            ₹{calculateTotalConveyanceFee(watchConveyance).toLocaleString()}
                                                            <span className="text-xs font-normal text-blue-600 ml-1">
                                                                (₹{calculateConveyanceFee(watchConveyance)}/mo)
                                                            </span>
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-xs text-blue-600 mt-3">
                                                * Updates to conveyance slab will immediately affect the student's total payable fee upon saving.
                                            </p>
                                        </div>
                                    </div>
                                </Accordion>

                                {/* Fee Discount (Edit Mode) */}
                                <Accordion
                                    title="Fee Discount"
                                    icon={CreditCard}
                                    isOpen={openSection === 'discount'}
                                    onToggle={() => toggleSection('discount')}
                                >
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={discounts.length > 0}
                                                    onChange={e => {
                                                        if (!e.target.checked) {
                                                            setDiscounts([]);
                                                        } else {
                                                            const cls = student?.className || student?.class;
                                                            const preloaded = activeCategories
                                                                .filter(cat => !cat.hasSlabs && cat.amounts?.find(a => a.className === cls))
                                                                .map(cat => ({
                                                                    categoryId: cat._id,
                                                                    categoryName: cat.name,
                                                                    discountAmount: 0
                                                                }));
                                                            setDiscounts(preloaded);
                                                        }
                                                    }}
                                                    className="w-4 h-4 rounded text-amber-600"
                                                />
                                                <span className="text-sm font-semibold text-slate-800">Eligible for Fee Discount</span>
                                            </label>
                                            {discounts.length > 0 && (
                                                <span className="text-xs font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                                                    Total: ₹{discounts.reduce((s, d) => s + (Number(d.discountAmount) || 0), 0).toLocaleString()}
                                                </span>
                                            )}
                                        </div>

                                        {discounts.length > 0 && (
                                            <div className="space-y-2">
                                                <p className="text-xs text-slate-500">Enter the discount amount for each fee category below:</p>
                                                {discounts.map((disc, i) => {
                                                    const cat = activeCategories.find(c => c._id === disc.categoryId);
                                                    const cls = student?.className || student?.class;
                                                    const fullFee = cat?.amounts?.find(a => a.className === cls)?.amount || 0;
                                                    return (
                                                        <div key={disc.categoryId} className="flex items-center gap-3 bg-amber-50 p-3 rounded-lg border border-amber-100">
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-semibold text-slate-800">{disc.categoryName}</p>
                                                                <p className="text-xs text-amber-600 font-medium">Full Fee: ₹{fullFee.toLocaleString()}</p>
                                                            </div>
                                                            <div className="flex items-center gap-2 shrink-0">
                                                                <span className="text-xs text-slate-500">Discount ₹</span>
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    max={fullFee}
                                                                    value={disc.discountAmount || ''}
                                                                    onChange={e => {
                                                                        const val = Math.min(Number(e.target.value) || 0, fullFee);
                                                                        setDiscounts(prev => prev.map((d, idx) =>
                                                                            idx === i ? { ...d, discountAmount: val } : d
                                                                        ));
                                                                    }}
                                                                    placeholder="0"
                                                                    className="w-28 px-2 py-1.5 border border-amber-300 rounded text-sm text-right focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                                                                />
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {discounts.length === 0 && (
                                            <p className="text-xs text-slate-400 italic">Enable the checkbox above to grant a discount on specific fee categories.</p>
                                        )}
                                    </div>
                                </Accordion>

                                {/* Previous Education (Edit) */}

                                <Accordion
                                    title="Previous Education"
                                    icon={Book}
                                    isOpen={openSection === 'education'}
                                    onToggle={() => toggleSection('education')}
                                >
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

                                {/* Health (Edit) */}
                                <Accordion
                                    title="Health Details"
                                    icon={Ban}
                                    isOpen={openSection === 'health'}
                                    onToggle={() => toggleSection('health')}
                                >
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
                            </form>
                        )}
                    </div>

                    {/* Delete Modal */}
                    <ConfirmationModal
                        isOpen={isDeleteModalOpen}
                        onClose={() => setIsDeleteModalOpen(false)}
                        onConfirm={handleConfirmDelete}
                        title="Delete Document"
                        message={`Are you sure you want to delete ${documentToDelete?.name}? This action cannot be undone.`}
                        confirmText="Delete"
                        confirmButtonClass="bg-red-600 hover:bg-red-700"
                    />

                    {/* Right Side: Fee Sidebar (Only clearly visible in View mode) */}
                    {mode === 'view' && (
                        <div className="w-full lg:w-96 shrink-0 lg:sticky lg:top-6 space-y-6">
                            {/* Summary Cards */}
                            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                                <h3 className="font-bold text-slate-800 flex items-center justify-between border-b border-slate-100 pb-3">
                                    <div className="flex items-center gap-2">
                                        <CreditCard size={18} className="text-indigo-600" />
                                        Fee Overview
                                    </div>
                                    <button
                                        onClick={handleDownloadFeeStatement}
                                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                        title="Download Fee Statement"
                                    >
                                        <Download size={16} />
                                    </button>
                                </h3>

                                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                                    <div className="flex justify-between items-end mb-1">
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Annual Fee</p>
                                        <p className="text-[10px] font-medium text-slate-400">2025-26 Session</p>
                                    </div>
                                    <p className="text-2xl font-bold text-slate-900">₹{student?.feeDetails?.totalFee?.toLocaleString()}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Total Paid</p>
                                        <p className="text-lg font-bold text-emerald-700">₹{student?.feeDetails?.paid?.toLocaleString()}</p>
                                    </div>
                                    <div className="bg-rose-50 p-3 rounded-lg border border-rose-100">
                                        <p className="text-[10px] font-bold text-rose-600 uppercase tracking-wider mb-1">Total Balance</p>
                                        <p className="text-lg font-bold text-rose-700">₹{student?.feeDetails?.pending?.toLocaleString()}</p>
                                    </div>
                                </div>

                                <div className="w-full bg-slate-100 rounded-full h-2 mt-2 overflow-hidden">
                                    <div
                                        className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                                        style={{ width: `${Math.min(((student?.feeDetails?.paid || 0) / (student?.feeDetails?.totalFee || 1)) * 100, 100)}%` }}
                                    ></div>
                                </div>

                                {/* Detailed Breakdown */}
                                <div className="pt-2">
                                    <div className="flex items-center justify-between mb-3">
                                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Payments to Make</p>
                                        <span className="text-[10px] font-medium text-slate-400 italic">Expected Annual</span>
                                    </div>
                                    <div className="space-y-3">
                                        {student?.feeDetails?.breakdown?.map(cat => (
                                            <div key={cat.id} className="group">
                                                <div className="flex items-center justify-between text-sm mb-0.5">
                                                    <span className="text-slate-700 font-medium group-hover:text-indigo-600 transition-colors">{cat.name}</span>
                                                    <span className="font-bold text-slate-900">₹{cat.total.toLocaleString()}</span>
                                                </div>
                                                {/* Discount row — shown only if a discount exists for this category */}
                                                {cat.discountAmount > 0 && (
                                                    <div className="flex items-center justify-between text-xs mb-1">
                                                        <span className="text-amber-600 font-medium flex items-center gap-1">
                                                            <span className="inline-block w-2 h-2 rounded-full bg-amber-400" />
                                                            Discount Applied
                                                        </span>
                                                        <span className="font-bold text-amber-600">-₹{cat.discountAmount.toLocaleString()}</span>
                                                    </div>
                                                )}
                                                <div className="flex items-center justify-between">
                                                    <div className="flex gap-2 items-center">
                                                        <div className="w-24 h-1 bg-slate-100 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full ${cat.pending === 0 ? 'bg-emerald-500' : 'bg-indigo-400'}`}
                                                                style={{ width: `${Math.min((cat.paid / (cat.netTotal || cat.total)) * 100, 100)}%` }}
                                                            ></div>
                                                        </div>
                                                        <span className="text-[10px] text-slate-400">{Math.round((cat.paid / (cat.netTotal || cat.total)) * 100)}%</span>
                                                    </div>
                                                    <div className="text-[10px] font-bold">
                                                        {cat.pending > 0 ? (
                                                            <span className="text-rose-600">₹{cat.pending.toLocaleString()} Due</span>
                                                        ) : (
                                                            <span className="text-emerald-600 font-bold uppercase tracking-tight">Fully Paid</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Recent Transactions */}
                            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                <h3 className="font-bold text-slate-800 flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                                    <div className="flex items-center gap-2">
                                        <FileText size={18} className="text-indigo-600" />
                                        Transaction History
                                    </div>
                                    <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">{student?.feeHistory?.length || 0} Total</span>
                                </h3>

                                <div className="space-y-3">
                                    {student?.feeHistory?.slice(0, 5).map((txn, idx) => (
                                        <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-100 hover:border-slate-300 transition-colors">
                                            <div className="flex items-center justify-between mb-1">
                                                <p className="font-bold text-slate-900">₹{txn.amount?.toLocaleString()}</p>
                                                <p className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 uppercase uppercase tracking-tighter">
                                                    {txn.paymentMode || txn.mode || 'Cash'}
                                                </p>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-[10px] text-slate-400 font-mono uppercase tracking-tighter">Receipt No</p>
                                                    <p className="text-[11px] font-bold text-slate-700 font-mono">{txn.receiptNo || 'MANUAL-ENTRY'}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[11px] text-slate-500 font-medium">{new Date(txn.paymentDate || txn.createdAt).toLocaleDateString()}</p>
                                                    <p className="text-[10px] text-slate-400 italic">{txn.feeType || 'Payment'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {student?.feeHistory?.length === 0 && (
                                        <div className="text-center py-6">
                                            <div className="p-3 bg-slate-50 rounded-full w-fit mx-auto mb-3 text-slate-300">
                                                <CreditCard size={24} />
                                            </div>
                                            <p className="text-sm text-slate-500 italic">No payments recorded yet.</p>
                                        </div>
                                    )}
                                </div>
                                {student?.feeHistory?.length > 5 && (
                                    <button
                                        onClick={() => navigate('/admin/receipts', { state: { studentId: id } })}
                                        className="w-full mt-4 py-2 border border-slate-200 text-sm font-bold text-indigo-600 hover:text-indigo-700 hover:bg-slate-50 hover:border-indigo-100 rounded-lg transition-all flex items-center justify-center gap-2"
                                    >
                                        View Full History <ArrowLeft size={14} className="rotate-180" />
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
