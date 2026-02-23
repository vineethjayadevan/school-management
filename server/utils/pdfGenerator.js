const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generates a PDF receipt for a fee payment, matching the frontend design.
 * @param {Object} fee - The fee transaction object
 * @param {Object} student - The student object
 * @returns {Promise<Buffer>} - Resolves with the PDF buffer
 */
const generateFeeReceipt = (fee, student) => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const buffers = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
            const pdfData = Buffer.concat(buffers);
            resolve(pdfData);
        });

        doc.on('error', (err) => {
            reject(err);
        });

        // --- Constants & Setup ---
        const pageWidth = doc.page.width;
        const pageHeight = doc.page.height;
        const margin = 50;
        const contentWidth = pageWidth - (margin * 2);

        const schoolInfo = {
            name: "STEM Global Public School",
            address: "Kollannoor-Kappur Palakkad District",
            phone: "9746402501 | stemnoreply@mystemgps.com"
        };

        // --- Header Section ---
        let currentY = 50;

        // Logo
        // Try to load logo. Using public/images/logo1.jpeg as fallback/primary for PDF
        const logoPath = path.join(__dirname, '../../public/images/logo1.jpeg');
        if (fs.existsSync(logoPath)) {
            try {
                // Center the logo block (Logo + Text) visually?
                // Just placing logo at top left of header area
                doc.image(logoPath, margin + 40, currentY, { width: 45 });
            } catch (e) {
                console.warn('Could not embed logo:', e);
            }
        }

        // School Name (Centered)
        doc.font('Helvetica-Bold').fontSize(20).text(schoolInfo.name, 0, currentY + 10, { align: 'center' });
        currentY += 35;

        // Address
        doc.font('Helvetica').fontSize(10).fillColor('#64748b').text(schoolInfo.address, 0, currentY, { align: 'center' });
        currentY += 15;

        // Phone / Email
        doc.text(schoolInfo.phone, 0, currentY, { align: 'center' });
        currentY += 25;

        // "Fee Receipt / E-Challan" Badge (simulated)
        // Draw rounded rectangle background
        const badgeText = "FEE RECEIPT / E-CHALLAN";
        const badgeWidth = 200;
        const badgeHeight = 20;
        const badgeX = (pageWidth - badgeWidth) / 2;

        doc.roundedRect(badgeX, currentY, badgeWidth, badgeHeight, 10)
            .fill('#f1f5f9'); // slate-100

        doc.fillColor('#475569') // slate-600
            .fontSize(10)
            .font('Helvetica-Bold')
            .text(badgeText, badgeX, currentY + 5, { width: badgeWidth, align: 'center' });

        currentY += 40;

        // Divider Line
        doc.moveTo(margin, currentY)
            .lineTo(pageWidth - margin, currentY)
            .strokeColor('#e2e8f0') // slate-200
            .lineWidth(1)
            .stroke();

        currentY += 20;

        // --- Details Grid ---
        const leftColX = margin;
        const rightColX = pageWidth - margin - 200; // Alignment for right column content

        // Row 1: Receipt No & Date
        doc.fillColor('#94a3b8').fontSize(8).font('Helvetica-Bold').text("RECEIPT NO", leftColX, currentY);
        doc.text("DATE", rightColX, currentY, { align: 'right', width: 200 });
        currentY += 12;

        doc.fillColor('#0f172a').fontSize(12).font('Courier-Bold').text(fee.receiptNo || 'PENDING', leftColX, currentY);
        const paymentDate = new Date(fee.paymentDate || fee.date || Date.now()).toLocaleDateString();
        doc.font('Helvetica-Bold').text(paymentDate, rightColX, currentY, { align: 'right', width: 200 }); // Assuming width 200
        currentY += 30;

        // Row 2: Student & Parent
        doc.fillColor('#94a3b8').fontSize(8).font('Helvetica-Bold').text("STUDENT NAME", leftColX, currentY);
        doc.text("PARENT / GUARDIAN", rightColX, currentY, { align: 'right', width: 200 });
        currentY += 12;

        doc.fillColor('#0f172a').fontSize(12).font('Helvetica-Bold').text(student.name, leftColX, currentY);
        const parentName = student.guardian || student.fatherName || 'N/A';
        doc.font('Helvetica').fontSize(11).text(parentName, rightColX, currentY, { align: 'right', width: 200 });
        currentY += 16; // Spacing for next lines

        // Extra details
        doc.fillColor('#64748b').fontSize(9).font('Helvetica');
        const studentDetails = `${student.className || student.class} - ${student.section} | Roll: ${student.rollNo || '-'}`;
        doc.text(studentDetails, leftColX, currentY);

        const parentPhone = student.primaryPhone || student.phone || '-';
        doc.text(parentPhone, rightColX, currentY, { align: 'right', width: 200 });
        currentY += 12;

        doc.text(`ID: ${student.admissionNo}`, leftColX, currentY);
        currentY += 30;


        // --- Fee Table ---
        const tableTop = currentY;
        const col1X = margin + 10;
        const col2X = margin + 250;
        const col3X = pageWidth - margin - 100; // Amount column (right aligned area)

        const rowHeight = 25;

        // Table Header
        doc.rect(margin, currentY, contentWidth, rowHeight).fill('#f8fafc'); // slate-50 header bg
        doc.fillColor('#64748b').fontSize(8).font('Helvetica-Bold');

        // Vertically center text in header row (approx +8 y)
        doc.text("FEE DESCRIPTION", col1X, currentY + 8);
        doc.text("MODE", col2X, currentY + 8);
        doc.text("AMOUNT", col3X, currentY + 8, { align: 'right', width: 90 });

        currentY += rowHeight;

        // Table Body Rows
        doc.fillColor('#0f172a').fontSize(9).font('Helvetica');

        const breakdown = fee.breakdown || [{ feeType: fee.feeType || fee.type || 'Fee Payment', amount: fee.amount }];

        // Draw a border for all items combined
        const totalRowsHeight = breakdown.length * rowHeight;
        doc.rect(margin, currentY, contentWidth, totalRowsHeight + 10).strokeColor('#f1f5f9').stroke(); // Light border

        breakdown.forEach((item, index) => {
            const itemType = item.feeType || 'Fee Payment';
            doc.text(itemType, col1X, currentY + 10);

            // Only show mode on the first item for clarity, or show on all
            if (index === 0) {
                doc.text(fee.paymentMode || fee.mode || 'Cash', col2X, currentY + 10);
            }

            const itemAmountStr = `Rs. ${Number(item.amount).toLocaleString('en-IN')}`;
            doc.font('Helvetica-Bold').text(itemAmountStr, col3X, currentY + 10, { align: 'right', width: 90 });
            doc.font('Helvetica'); // reset to normal for next row if any

            currentY += rowHeight;
        });

        currentY += 10; // Add the padding at the bottom of the bounding box

        // Table Footer (Total)
        doc.rect(margin, currentY, contentWidth, rowHeight).fill('#f8fafc');

        doc.fillColor('#0f172a').fontSize(9).font('Helvetica-Bold');
        doc.text("Total Paid", col1X, currentY + 8); // Should actually be right aligned usually, but frontend has "Total Paid" colSpan 2
        // Let's align "Total Paid" closer to Amount or keep left
        // Frontend: colSpan=2, text-right. So it puts "Total Paid" in middle column effectively?
        // Let's put it aligned to right of the first 2 columns space.
        doc.text("Total Paid", col2X + 50, currentY + 8, { align: 'right', width: 100 }); // Approx position

        doc.fillColor('#4f46e5').fontSize(11).font('Helvetica-Bold'); // Indigo-600
        const amountStr = `Rs. ${Number(fee.amount).toLocaleString('en-IN')}`;
        doc.text(amountStr, col3X, currentY + 7, { align: 'right', width: 90 });

        currentY += rowHeight + 40;


        // --- Footer Notes & Signature ---
        const footerY = 650; // Pin to bottom area if desired, or just flow
        // The design has it at bottom usually. Let's use currentY if enough space, else new page?
        // currentY is likely around 350-400 now.

        // Notes
        const notesX = margin;
        const notesWidth = 250;

        doc.fillColor('#94a3b8').fontSize(7).font('Helvetica'); // slate-400
        doc.text("* This is a computer generated receipt.", notesX, currentY);
        currentY += 10;
        doc.text("* Fees once paid are not refundable.", notesX, currentY);
        currentY += 10;
        doc.text("* Cheque payments subject to realization.", notesX, currentY);

        // Signature (Right side, aligned with notes top)
        const signX = pageWidth - margin - 150;
        const signY = currentY - 20; // Align with top of notes approx

        // "Authorized Signatory" placeholder style
        doc.save(); // Save context
        // Try to simulate "Correction/Signature" style or just text
        doc.font('ZapfDingbats').fontSize(20).fillColor('#cbd5e1').text(' ', signX, signY - 30); // Placeholder icon? No.

        doc.font('Courier-Oblique').fontSize(14).fillColor('#cbd5e1'); // opacity-50ish color
        doc.text("Authorized Signatory", signX, signY - 25, { width: 150, align: 'center' });
        doc.restore();

        // Line
        doc.moveTo(signX, signY).lineTo(signX + 150, signY).strokeColor('#cbd5e1').lineWidth(1).stroke();

        doc.fillColor('#64748b').fontSize(8).font('Helvetica-Bold');
        doc.text("CASHIER SIGNATURE", signX, signY + 5, { width: 150, align: 'center' });

        // End Document
        doc.end();
    });
};

module.exports = { generateFeeReceipt };
