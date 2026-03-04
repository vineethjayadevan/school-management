/**
 * importHistoricalStudents.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Imports students from a CSV file into the DB, linking them to the current
 * active Academic Year and recording their previous year into academicHistory.
 *
 * USAGE:
 *   node server/scripts/importHistoricalStudents.js <path-to-csv>
 *
 * EXAMPLE:
 *   node server/scripts/importHistoricalStudents.js ./server/scripts/students_2026.csv
 *
 * CSV RULES:
 *   - First row must be the header (column names exactly as listed below)
 *   - Dates can be DD-MM-YYYY or YYYY-MM-DD (both work)
 *   - If a field is blank, leave the cell empty (don't write "N/A" or "-")
 *   - Save as CSV UTF-8 from Excel
 *   - Aadhar numbers: format the column as TEXT in Excel before typing to avoid scientific notation
 *
 * RUN FROM PROJECT ROOT (school-management folder):
 *   node server/scripts/importHistoricalStudents.js server/scripts/students_template.csv
 * ─────────────────────────────────────────────────────────────────────────────
 */

const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Student = require('../models/Student');
const AcademicYear = require('../models/AcademicYear');

// ─── CSV Parser (no external deps) ───────────────────────────────────────────
function parseCSV(filePath) {
    const raw = fs.readFileSync(filePath, 'utf-8');
    // Normalize line endings
    const lines = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(l => l.trim());

    if (lines.length < 2) throw new Error('CSV must have a header row and at least one data row.');

    // Parse header
    const headers = parseCSVLine(lines[0]);

    // Parse data rows — skip empty rows and junk rows (dots, commas only)
    return lines.slice(1).map((line, idx) => {
        const values = parseCSVLine(line);
        const row = {};
        headers.forEach((h, i) => {
            row[h.trim()] = (values[i] || '').trim();
        });
        row._rowNum = idx + 2;
        return row;
    }).filter(row => row.admissionNo && /[a-zA-Z0-9]/.test(row.admissionNo));
}

// Handles quoted fields with commas inside
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
            inQuotes = !inQuotes;
        } else if (ch === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += ch;
        }
    }
    result.push(current);
    return result;
}
// ─────────────────────────────────────────────────────────────────────────────

// Parses both DD-MM-YYYY (Indian) and YYYY-MM-DD dates
function parseDate(val) {
    if (!val) return undefined;
    // Indian format: DD-MM-YYYY or DD/MM/YYYY
    const indianMatch = val.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/);
    if (indianMatch) {
        const [, d, m, y] = indianMatch;
        return new Date(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`);
    }
    // ISO format: YYYY-MM-DD
    const isoMatch = val.match(/^\d{4}-\d{2}-\d{2}/);
    if (isoMatch) return new Date(val);
    return undefined;
}

// Excel converts long numbers to scientific notation (e.g. 5.72607E+11)
// This converts them back to a plain integer string
function fixNumericString(val) {
    if (!val) return '';
    if (/^[\d.]+[eE][+\-]?\d+$/.test(val)) {
        // Scientific notation — convert to integer
        return String(Math.round(Number(val)));
    }
    return val;
}

const importStudents = async () => {
    // Validate CLI argument
    const csvPath = process.argv[2];
    if (!csvPath) {
        console.error('\n❌ Usage: node importHistoricalStudents.js <path-to-csv>\n');
        console.error('   Example: node server/scripts/importHistoricalStudents.js ./server/scripts/students_2026.csv\n');
        process.exit(1);
    }
    const resolvedPath = path.resolve(csvPath);
    if (!fs.existsSync(resolvedPath)) {
        console.error(`\n❌ File not found: ${resolvedPath}\n`);
        process.exit(1);
    }

    console.log(`\n📁 Reading CSV: ${resolvedPath}`);
    const rows = parseCSV(resolvedPath);
    console.log(`📋 Found ${rows.length} student row(s) to process.\n`);

    // Connect to DB
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected.\n');

    // Get the active academic year (this is the year they're being enrolled INTO)
    const activeYear = await AcademicYear.findOne({ isActive: true });
    if (!activeYear) {
        console.error('❌ No active Academic Year found in DB. Set one first.');
        process.exit(1);
    }
    console.log(`📅 Enrolling students into: ${activeYear.name}\n`);
    console.log('─'.repeat(60));

    // Cache all AcademicYears to avoid repeated DB calls
    const allYears = await AcademicYear.find({});
    const yearByName = {};
    allYears.forEach(y => { yearByName[y.name] = y._id; });

    let createdCount = 0, skippedCount = 0, errorCount = 0;

    for (const row of rows) {
        const row_label = `Row ${row._rowNum} | ${row.name} (${row.admissionNo})`;
        try {
            // ── Validate required fields ────────────────────────────────────
            const requiredFields = ['admissionNo', 'name', 'className', 'section', 'applicationNo', 'submissionDate'];
            const missing = requiredFields.filter(f => !row[f]);
            if (missing.length > 0) {
                console.warn(`⚠️  Skipped ${row_label} — Missing: ${missing.join(', ')}`);
                skippedCount++;
                continue;
            }

            // Need at least one parent/contact
            if (!row.fatherMobile && !row.motherMobile) {
                console.warn(`⚠️  Skipped ${row_label} — Must provide fatherMobile or motherMobile`);
                skippedCount++;
                continue;
            }

            // ── Skip if already exists ──────────────────────────────────────
            const existing = await Student.findOne({ admissionNo: row.admissionNo });
            if (existing) {
                console.warn(`⚠️  Skipped ${row_label} — Admission No already exists`);
                skippedCount++;
                continue;
            }

            // ── Build academicHistory from previous year cols ────────────────
            const academicHistory = [];
            if (row.previousYearName && row.previousClassName) {
                const prevYearId = yearByName[row.previousYearName];
                if (!prevYearId) {
                    console.warn(`   ⚠️  Note: AcademicYear "${row.previousYearName}" not found in DB. History saved without year link.`);
                }
                academicHistory.push({
                    academicYear: prevYearId || undefined,
                    className: row.previousClassName,
                    section: row.previousSection || row.section,
                    promotionStatus: row.previousStatus || 'Promoted',
                    resultStatus: (row.previousStatus || 'Promoted') === 'Promoted' ? 'Pass'
                        : (row.previousStatus === 'Detained' ? 'Fail' : 'N/A'),
                    remarks: `Historical import — studied in ${row.previousYearName}`,
                    recordedAt: new Date()
                });
            }

            // ── Derive auto-fields ──────────────────────────────────────────
            const guardian = row.fatherName || row.motherName || 'Parent';
            const primaryPhone = row.fatherMobile || row.motherMobile;
            const email = row.fatherEmail || row.motherEmail || '';

            // ── Build transportation object ─────────────────────────────────
            const transportMode = row.transportMode || 'Walking';
            const transportation = {
                mode: ['School Bus', 'Private', 'Walking'].includes(transportMode) ? transportMode : 'Walking',
                routeNumber: row.routeNumber || '',
                pickupPoint: row.pickupPoint || '',
                dropPoint: row.dropPoint || ''
            };

            // ── Build simple address fallback ───────────────────────────────
            const address = row.address || '';

            // ── Normalise enums ─────────────────────────────────────────────
            const validGenders = ['Male', 'Female', 'Other'];
            const gender = validGenders.includes(row.gender) ? row.gender : '';

            const validCategories = ['General', 'SC', 'ST', 'OBC', 'Others'];
            const category = validCategories.includes(row.category) ? row.category : '';

            const validBloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
            const bloodGroup = validBloodGroups.includes(row.bloodGroup) ? row.bloodGroup : '';

            // ── Create student ──────────────────────────────────────────────
            const student = await Student.create({
                admissionNo: row.admissionNo,
                applicationNo: row.applicationNo,
                name: row.name,
                className: row.className,
                section: row.section,
                rollNo: row.rollNo || 'Not Assigned',
                gender,
                bloodGroup,
                dob: parseDate(row.dob),
                submissionDate: parseDate(row.submissionDate) || new Date(),
                placeOfBirth: row.placeOfBirth || '',
                nationality: row.nationality || 'Indian',
                religion: row.religion || '',
                caste: row.caste || '',
                category,
                aadharNo: fixNumericString(row.aadharNo) || '',

                // Parent details
                guardian,
                primaryPhone,
                email,
                fatherName: row.fatherName || '',
                fatherMobile: row.fatherMobile || '',
                fatherEmail: row.fatherEmail || '',
                fatherOccupation: row.fatherOccupation || '',
                motherName: row.motherName || '',
                motherMobile: row.motherMobile || '',
                motherEmail: row.motherEmail || '',
                motherOccupation: row.motherOccupation || '',

                // Address
                address,

                // Previous schooling
                previousSchool: row.previousSchool || '',
                previousClass: row.previousClass || '',

                // Transport
                transportation,
                conveyanceSlab: Number(row.conveyanceSlab) || 0,

                // Academic tracking
                currentAcademicYear: activeYear._id,
                promotionStatus: 'Active',
                studentStatus: 'Active',
                isActive: true,
                feesStatus: 'Pending',
                academicHistory,
            });

            const histTag = academicHistory.length > 0
                ? ` | History: ${row.previousClassName} (${row.previousYearName}) → ${row.previousStatus || 'Promoted'}`
                : '';
            console.log(`✅ Created: ${student.name} (${student.admissionNo}) → ${student.className}-${student.section}${histTag}`);
            createdCount++;

        } catch (err) {
            console.error(`❌ Error on ${row_label}: ${err.message}`);
            errorCount++;
        }
    }

    console.log('\n' + '─'.repeat(60));
    console.log(`📊 Import Complete:`);
    console.log(`   ✅ Created : ${createdCount}`);
    console.log(`   ⚠️  Skipped : ${skippedCount}`);
    console.log(`   ❌ Errors  : ${errorCount}`);
    console.log('─'.repeat(60) + '\n');
    process.exit(0);
};

importStudents().catch(err => {
    console.error('Fatal:', err);
    process.exit(1);
});
