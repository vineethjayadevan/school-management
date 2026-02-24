import jsPDF from 'jspdf';
import { SCHOOL_INFO } from './schoolInfo';

// ─── helpers ──────────────────────────────────────────────────────────────────
const fmt = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const fmtLong = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
};

// Draw a clean two-column field row
const drawRow = (doc, sno, label, value, y, margin, pageWidth, isShaded) => {
    const rowH = 9;
    const col1 = margin;
    const col2 = margin + 12;
    const col3 = margin + 100;

    if (isShaded) {
        doc.setFillColor(248, 249, 252);
        doc.rect(col1, y, pageWidth - margin * 2, rowH, 'F');
    }

    doc.setDrawColor(220, 220, 230);
    doc.setLineWidth(0.2);
    doc.rect(col1, y, pageWidth - margin * 2, rowH);

    // Serial no
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 120, 140);
    doc.text(String(sno), col1 + 4, y + 5.8);

    // Label
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(50, 50, 70);
    doc.text(label, col2, y + 5.8);

    // Value
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 30, 60);
    // Wrap if too long
    const maxW = pageWidth - margin * 2 - (col3 - col1) - 4;
    const lines = doc.splitTextToSize(String(value || '—'), maxW);
    doc.text(lines[0], col3, y + 5.8); // Only first line in row (all values are short)

    return y + rowH;
};

// ─── main export ──────────────────────────────────────────────────────────────
export const generateTC = async (student, tcData) => {
    try {
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const PW = doc.internal.pageSize.width;
        const PH = doc.internal.pageSize.height;
        const M = 14; // margin

        // ── COLORS ──────────────────────────────────────────────
        const INDIGO = [63, 81, 181];
        const DARK = [30, 30, 60];
        const GRAY = [100, 100, 120];
        const LIGHT = [200, 205, 220];

        // ── OUTER PAGE BORDER (double) ───────────────────────────
        doc.setDrawColor(...INDIGO);
        doc.setLineWidth(1.5);
        doc.rect(M - 6, M - 6, PW - (M - 6) * 2, PH - (M - 6) * 2);
        doc.setLineWidth(0.4);
        doc.rect(M - 3, M - 3, PW - (M - 3) * 2, PH - (M - 3) * 2);

        let y = M + 2;

        // ── HEADER BLOCK: Logo LEFT + School info RIGHT ───────────
        const headerH = 22;
        const logoSize = 18;

        let logoLoaded = false;
        try {
            const img = await new Promise((resolve, reject) => {
                const image = new Image();
                image.crossOrigin = 'Anonymous';
                image.onload = () => resolve(image);
                image.onerror = () => reject();
                image.src = '/images/logo.webp';
            });
            doc.addImage(img, 'WEBP', M, y + (headerH - logoSize) / 2, logoSize, logoSize);
            logoLoaded = true;
        } catch { /* skip logo silently */ }

        // School name & contact — centred in remaining space
        const textStartX = logoLoaded ? M + logoSize + 4 : M;
        const textAreaW = PW - textStartX - M;
        const textCentreX = textStartX + textAreaW / 2;

        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...INDIGO);
        doc.text(SCHOOL_INFO.name.toUpperCase(), textCentreX, y + 7, { align: 'center' });

        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...GRAY);
        doc.text(SCHOOL_INFO.address, textCentreX, y + 13, { align: 'center' });
        doc.text(
            `Ph: ${SCHOOL_INFO.phone}   |   ${SCHOOL_INFO.email}   |   ${SCHOOL_INFO.website}`,
            textCentreX, y + 18, { align: 'center' }
        );

        y += headerH + 3;

        // ── TITLE BAR ────────────────────────────────────────────
        doc.setFillColor(...INDIGO);
        doc.rect(M - 1, y, PW - (M - 1) * 2, 9, 'F');
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text('TRANSFER CERTIFICATE', PW / 2, y + 6.2, { align: 'center' });
        y += 9;

        // ── SUB-TITLE ────────────────────────────────────────────
        doc.setFillColor(235, 237, 250);
        doc.rect(M - 1, y, PW - (M - 1) * 2, 6, 'F');
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(...GRAY);
        doc.text('Duplicate copy will not be issued without proper authority', PW / 2, y + 4.2, { align: 'center' });
        y += 6;

        // ── TC NO + DATE (top right strip) ───────────────────────
        y += 4;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...DARK);
        doc.text(`TC No:  ${tcData.tcNo || '—'}`, M, y);
        doc.text(`Date of Issue:  ${fmtLong(tcData.issueDate || new Date())}`, PW - M, y, { align: 'right' });
        y += 5;

        // ── THIN SEPARATOR ───────────────────────────────────────
        doc.setDrawColor(...LIGHT);
        doc.setLineWidth(0.4);
        doc.line(M, y, PW - M, y);
        y += 5;

        // ── CERTIFY PARA ─────────────────────────────────────────
        const parentName = student.fatherName || student.motherName || student.guardianName || '—';
        const relation = student.fatherName ? 'S/o' : (student.motherName ? 'D/o' : 'Ward of');
        const certText =
            `This is to certify that ${student.name}, ${relation} ${parentName}, ` +
            `bearing Admission No. ${student.admissionNo}, was a bonafide student of this institution ` +
            `and the following particulars as recorded in the school register are correct.`;

        doc.setFontSize(9.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...DARK);
        const certLines = doc.splitTextToSize(certText, PW - M * 2);
        doc.text(certLines, M, y);
        y += certLines.length * 5 + 5;

        // ── FIELDS TABLE ─────────────────────────────────────────
        const className = student.className || '—';
        const section = student.section || '';

        const fields = [
            ['1.', 'Admission Number', student.admissionNo || '—'],
            ['2.', 'Date of Birth', fmtLong(student.dob)],
            ['3.', 'Nationality', student.nationality || 'Indian'],
            ['4.', 'Religion', student.religion || '—'],
            ['5.', 'Category / Caste', `${student.category || '—'} / ${student.caste || '—'}`],
            ['6.', 'Class last studied', section ? `${className} — Sec. ${section}` : className],
            ['7.', 'Date of Admission', fmtLong(student.submissionDate)],
            ['8.', 'Date of Application for T.C.', fmtLong(tcData.applicationDate)],
            ['9.', 'Last Date of Attendance', fmtLong(tcData.lastDateAttended)],
            ['10.', 'Reason for Leaving', tcData.reasonForLeaving || '—'],
            ['11.', 'Whether eligible for promotion', tcData.isTCPromoted ? 'Yes' : 'No'],
            ['12.', 'Conduct & Character', tcData.conduct || 'Good'],
            ['13.', 'Fees paid up to date', student.feesStatus === 'Paid' ? 'Yes — Cleared' : 'Pending'],
        ];

        // Column header
        doc.setFillColor(...INDIGO);
        doc.rect(M, y, PW - M * 2, 7, 'F');
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text('No.', M + 4, y + 5);
        doc.text('Particulars', M + 16, y + 5);
        doc.text('Details', M + 100, y + 5);
        y += 7;

        fields.forEach(([sno, label, value], i) => {
            y = drawRow(doc, sno, label, value, y, M, PW, i % 2 === 0);
        });

        y += 6;

        // ── REMARKS ──────────────────────────────────────────────
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...DARK);
        doc.text('Remarks:', M, y);

        doc.setFont('helvetica', 'normal');
        const remarkText = tcData.remarks || 'NIL';
        const remarkLines = doc.splitTextToSize(remarkText, PW - M * 2 - 25);
        doc.text(remarkLines, M + 22, y);
        y += Math.max(remarkLines.length * 5, 5) + 8;

        // ── SEPARATOR ────────────────────────────────────────────
        doc.setDrawColor(...LIGHT);
        doc.setLineWidth(0.3);
        doc.line(M, y, PW - M, y);
        y += 4;

        // ── DECLARATION ──────────────────────────────────────────
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(...GRAY);
        const decl = 'Certified that the above information is true to the best of my knowledge and belief.';
        doc.text(decl, PW / 2, y, { align: 'center' });
        y += 5;

        // ── SIGNATURE BLOCK ───────────────────────────────────────
        // Place signatures snug to the bottom if space allows
        const sigY = Math.max(y + 8, PH - 48);

        const sigs = [
            { title: 'Class Teacher', sub: 'Name & Signature', x: M },
            { title: 'Prepared By', sub: 'Name & Signature', x: PW / 2 - 22 },
            { title: 'Principal', sub: 'Signature & Seal', x: PW - M - 44 },
        ];

        const sigW = 44;
        sigs.forEach(({ title, sub, x }) => {
            // Box
            doc.setDrawColor(...LIGHT);
            doc.setLineWidth(0.3);
            doc.setFillColor(250, 250, 255);
            doc.rect(x, sigY, sigW, 22, 'FD');

            // Title
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...INDIGO);
            doc.text(title, x + sigW / 2, sigY + 5, { align: 'center' });

            // Signature line
            doc.setDrawColor(180, 180, 200);
            doc.line(x + 5, sigY + 16, x + sigW - 5, sigY + 16);

            // Sub label
            doc.setFontSize(7);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...GRAY);
            doc.text(sub, x + sigW / 2, sigY + 20, { align: 'center' });
        });

        // ── FOOTER ───────────────────────────────────────────────
        const footY = PH - M + 2;
        doc.setDrawColor(...LIGHT);
        doc.setLineWidth(0.3);
        doc.line(M - 1, footY - 5, PW - M + 1, footY - 5);

        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...GRAY);
        doc.text(
            'This is a computer-generated Transfer Certificate.  Any tampering or alteration renders this document null and void.',
            PW / 2, footY, { align: 'center' }
        );

        // ── SAVE ─────────────────────────────────────────────────
        const safeName = (student.name || 'Student').replace(/[^a-zA-Z0-9]/g, '_');
        doc.save(`TC_${safeName}_${student.admissionNo}.pdf`);

    } catch (err) {
        console.error('TC generation error:', err);
        alert('Failed to generate TC PDF. Please try again.\n\n' + err.message);
    }
};
