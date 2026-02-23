import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateSalaryReceipt = (profile, record) => {
    try {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;

        // Header
        doc.setFontSize(22);
        doc.setTextColor(79, 70, 229); // Indigo-600
        doc.text('Salary Receipt', pageWidth / 2, 20, { align: 'center' });

        doc.setDrawColor(226, 232, 240); // Slate-200
        doc.line(20, 25, pageWidth - 20, 25);

        // School Info
        doc.setFontSize(12);
        doc.setTextColor(100, 116, 139); // Slate-500
        doc.text('STEM GPS School', 20, 35);
        doc.text('Academic Management System', 20, 42);

        // Receipt Metadata
        doc.setFontSize(10);
        const recordId = record._id || 'TEMP';
        doc.text(`Receipt No: SAL-${recordId.toString().slice(-6).toUpperCase()}`, pageWidth - 20, 35, { align: 'right' });
        doc.text(`Date: ${new Date().toLocaleDateString()}`, pageWidth - 20, 42, { align: 'right' });

        // Teacher Details Section
        doc.setFontSize(14);
        doc.setTextColor(30, 41, 59); // Slate-800
        doc.text('Employee Details', 20, 60);

        doc.setFontSize(10);
        doc.setTextColor(71, 85, 105); // Slate-600
        const details = [
            ['Employee Name:', profile.name],
            ['Employee ID:', profile.employeeId || 'N/A'],
            ['Username:', profile.username || 'N/A'],
            ['Role:', profile.role],
            ['Voucher for Month:', record.month]
        ];

        autoTable(doc, {
            startY: 65,
            margin: { left: 20 },
            theme: 'plain',
            body: details,
            styles: { fontSize: 10, cellPadding: 2 },
            columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 } }
        });

        // Payment Summary Section
        const summaryY = doc.lastAutoTable.finalY + 15;
        doc.setFontSize(14);
        doc.setTextColor(30, 41, 59);
        doc.text('Payment Summary', 20, summaryY);

        const paymentTable = [
            ['Description', 'Detail'],
            ['Basic Salary', `Rs. ${profile.salary?.toLocaleString() || '0'}`],
            ['Payment Mode', record.paymentMode || 'Cash'],
            ['Payment Date', record.paymentDate ? new Date(record.paymentDate).toLocaleDateString() : 'N/A'],
            ['Status', record.status]
        ];

        autoTable(doc, {
            startY: summaryY + 5,
            margin: { left: 20 },
            head: [paymentTable[0]],
            body: paymentTable.slice(1),
            theme: 'striped',
            headStyles: { fillStyle: 'f', fillColor: [79, 70, 229], textColor: [255, 255, 255] },
            styles: { fontSize: 10 }
        });

        // Total Amount Highlight
        const totalY = doc.lastAutoTable.finalY + 10;
        doc.setFillColor(248, 250, 252); // Slate-50
        doc.rect(pageWidth - 90, totalY, 70, 20, 'F');

        doc.setFontSize(12);
        doc.setTextColor(30, 41, 59);
        doc.setFont('helvetica', 'bold');
        doc.text('Net Paid:', pageWidth - 85, totalY + 13);
        doc.setTextColor(79, 70, 229);
        doc.text(`Rs. ${record.amount.toLocaleString()}`, pageWidth - 25, totalY + 13, { align: 'right' });

        // Footer
        const footerY = doc.internal.pageSize.height - 30;
        doc.setDrawColor(226, 232, 240);
        doc.line(20, footerY, pageWidth - 20, footerY);

        doc.setFontSize(9);
        doc.setTextColor(148, 163, 184); // Slate-400
        doc.setFont('helvetica', 'normal');
        doc.text('This is a computer-generated document and does not require a physical signature.', pageWidth / 2, footerY + 10, { align: 'center' });

        const safeMonth = record.month.replace(/[^a-z0-9]/gi, '_');
        doc.save(`Salary_Receipt_${safeMonth}.pdf`);
    } catch (error) {
        console.error("Error generating PDF:", error);
        alert("Failed to generate PDF. Error: " + error.message);
    }
};
