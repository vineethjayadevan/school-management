import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Generates a comprehensive student profile PDF.
 * Ported from StudentDetails.jsx.
 */
export const generateStudentProfilePDF = async (student) => {
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
            doc.addImage(img, 'JPEG', 160, 15, 35, 35);
            doc.setDrawColor(79, 70, 229); // Indigo 600
            doc.setLineWidth(0.5);
            doc.rect(160, 15, 35, 35);
        } catch (error) {
            console.warn("Skipping photo in PDF:", error);
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

    let finalY = 55;

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
    doc.line(14, finalY, 196, finalY);
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
        body: parentBody,
        theme: 'striped',
        headStyles: { fillColor: [100, 116, 139] }
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
        headStyles: { fillColor: [239, 68, 68] }
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
        headStyles: { fillColor: [249, 115, 22] }
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
            headStyles: { fillColor: [13, 148, 136] }
        });
        finalY = doc.lastAutoTable.finalY + 10;
    }

    // Save
    doc.save(`Profile_${student.name}_${student.admissionNo}.pdf`);
};

/**
 * Generates a student fee statement PDF.
 * Ported from StudentDetails.jsx.
 */
export const generateFeeStatementPDF = (student) => {
    if (!student) return;
    const doc = new jsPDF();
    const primaryColor = [79, 70, 229];

    // Header
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
    finalY = doc.lastAutoTable.finalY + 10;

    // 3. Category-wise Breakdown
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('Fee Breakdown (Category-wise)', 14, finalY);
    finalY += 5;

    autoTable(doc, {
        startY: finalY,
        head: [['Fee Category', 'Annual Total', 'Paid', 'Pending', 'Status']],
        body: (student.feeDetails?.breakdown || []).map(cat => [
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
