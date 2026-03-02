import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Generates a PDF attendance report for a class.
 */
export const downloadAttendancePDF = (data, reportName = 'Attendance_Report', title = 'Class Attendance Report') => {
    if (!data || !data.dates || !data.students) return;

    const { dates, students } = data;
    const doc = new jsPDF('l', 'mm', 'a4'); // Landscape for better fit

    // Brand Colors
    const primaryColor = [79, 70, 229]; // Indigo 600

    // Header
    doc.setFontSize(20);
    doc.setTextColor(...primaryColor);
    doc.text('STEM Global Public School', 14, 15);

    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(title, 14, 25);

    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

    // Table Data
    const headers = [['Roll No', 'Name', ...dates.map(d => d.split('-').slice(1).join('/'))]]; // Use Short dates MM/DD

    const rows = students.map(student => [
        student.rollNo || '-',
        student.name,
        ...dates.map(date => student.attendance[date] || '-')
    ]);

    autoTable(doc, {
        startY: 35,
        head: headers,
        body: rows,
        theme: 'grid',
        styles: { fontSize: 7, cellPadding: 1.5 },
        headStyles: { fillColor: primaryColor, textColor: 255, fontStyle: 'bold' },
        columnStyles: {
            0: { cellWidth: 15 },
            1: { cellWidth: 40, fontStyle: 'bold' }
        },
        didParseCell: (data) => {
            if (data.section === 'body' && data.column.index >= 2) {
                if (data.cell.text[0] === 'Present') {
                    data.cell.styles.textColor = [22, 163, 74]; // Emerald 600
                } else if (data.cell.text[0] === 'Absent') {
                    data.cell.styles.textColor = [220, 38, 38]; // Rose 600
                    data.cell.styles.fontStyle = 'bold';
                } else if (data.cell.text[0] === 'Late') {
                    data.cell.styles.textColor = [217, 119, 6]; // Amber 600
                }
            }
        }
    });

    // Save
    doc.save(`${reportName}.pdf`);
};
