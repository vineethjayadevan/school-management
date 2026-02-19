const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
// const SchoolInfo = require('../utils/schoolInfo'); // Removed invalid import

/**
 * Generates a PDF salary slip.
 * @param {Object} salary - The salary transaction object (populated with staff)
 * @returns {Promise<Buffer>} - Resolves with the PDF buffer
 */
const generateSalarySlip = (salary) => {
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
        const logoPath = path.join(__dirname, '../../public/images/logo1.jpeg');
        if (fs.existsSync(logoPath)) {
            try {
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

        // Badge
        const badgeText = "SALARY SLIP";
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

        // --- Staff Details Grid ---
        const leftColX = margin;
        const rightColX = pageWidth - margin - 200;

        // Row 1
        doc.fillColor('#94a3b8').fontSize(8).font('Helvetica-Bold').text("RECEIPT NO", leftColX, currentY);
        doc.text("DATE", rightColX, currentY, { align: 'right', width: 200 });
        currentY += 12;

        const receiptNo = `SAL-${salary._id.toString().slice(-6).toUpperCase()}`;
        const paymentDate = new Date(salary.paymentDate || Date.now()).toLocaleDateString();

        doc.fillColor('#0f172a').fontSize(12).font('Courier-Bold').text(receiptNo, leftColX, currentY);
        doc.font('Helvetica-Bold').text(paymentDate, rightColX, currentY, { align: 'right', width: 200 });
        currentY += 30;

        // Row 2
        doc.fillColor('#94a3b8').fontSize(8).font('Helvetica-Bold').text("STAFF NAME", leftColX, currentY);
        doc.text("DESIGNATION", rightColX, currentY, { align: 'right', width: 200 });
        currentY += 12;

        doc.fillColor('#0f172a').fontSize(12).font('Helvetica-Bold').text(salary.staff.name, leftColX, currentY);
        doc.font('Helvetica').fontSize(11).text(salary.staff.role || salary.staff.category, rightColX, currentY, { align: 'right', width: 200 });
        currentY += 16;

        // Month of Salary
        doc.fillColor('#64748b').fontSize(9).font('Helvetica');
        const salaryMonth = new Date(salary.month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        doc.text(`Salary Month: ${salaryMonth}`, leftColX, currentY);
        currentY += 30;

        // --- Table ---
        const tableTop = currentY;
        const col1X = margin + 10;
        const col2X = margin + 250;
        const col3X = pageWidth - margin - 100;

        const rowHeight = 25;

        // Header
        doc.rect(margin, currentY, contentWidth, rowHeight).fill('#f8fafc');
        doc.fillColor('#64748b').fontSize(8).font('Helvetica-Bold');
        doc.text("DESCRIPTION", col1X, currentY + 8);
        doc.text("MODE", col2X, currentY + 8);
        doc.text("AMOUNT", col3X, currentY + 8, { align: 'right', width: 90 });
        currentY += rowHeight;

        // Row
        doc.fillColor('#0f172a').fontSize(9).font('Helvetica');
        doc.rect(margin, currentY, contentWidth, rowHeight + 10).strokeColor('#f1f5f9').stroke();

        doc.text("Monthly Salary Payment", col1X, currentY + 10);
        doc.text(salary.paymentMode || 'Cash', col2X, currentY + 10);
        const amountStr = `Rs. ${Number(salary.amount).toLocaleString('en-IN')}`;
        doc.font('Helvetica-Bold').text(amountStr, col3X, currentY + 10, { align: 'right', width: 90 });
        currentY += rowHeight + 10;

        // Total
        doc.rect(margin, currentY, contentWidth, rowHeight).fill('#f8fafc');
        doc.fillColor('#0f172a').fontSize(9).font('Helvetica-Bold');
        doc.text("Total Paid", col2X + 50, currentY + 8, { align: 'right', width: 100 });
        doc.fillColor('#4f46e5').fontSize(11).font('Helvetica-Bold');
        doc.text(amountStr, col3X, currentY + 7, { align: 'right', width: 90 });

        currentY += rowHeight + 50;

        // --- Footer ---
        const signX = pageWidth - margin - 150;
        const signY = currentY;

        doc.font('Courier-Oblique').fontSize(14).fillColor('#cbd5e1');
        doc.text("Authorized Signatory", signX, signY - 25, { width: 150, align: 'center' });

        doc.moveTo(signX, signY).lineTo(signX + 150, signY).strokeColor('#cbd5e1').lineWidth(1).stroke();
        doc.fillColor('#64748b').fontSize(8).font('Helvetica-Bold');
        doc.text("PRINCIPAL / ACCOUNTANT", signX, signY + 5, { width: 150, align: 'center' });

        doc.end();
    });
};

module.exports = { generateSalarySlip };
