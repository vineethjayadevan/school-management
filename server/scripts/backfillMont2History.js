/**
 * backfillMont2History.js
 * ─────────────────────────────────────────────────────────────────────────────
 * One-time script: For all students currently in Mont 2 who have NO academic
 * history, add a history entry for the previous year (2025-2026, Mont 1, Promoted).
 *
 * Run from project root:
 *   node server/scripts/backfillMont2History.js
 * ─────────────────────────────────────────────────────────────────────────────
 */

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Student = require('../models/Student');
const AcademicYear = require('../models/AcademicYear');

const run = async () => {
    console.log('\n🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected.\n');

    // Resolve the previous academic year (2025-2026)
    const prevYear = await AcademicYear.findOne({ name: '2025-2026' });
    if (!prevYear) {
        console.warn('⚠️  AcademicYear "2025-2026" not found in DB. History will be saved without year reference.\n');
    } else {
        console.log(`📅 Previous Year resolved: ${prevYear.name} (${prevYear._id})\n`);
    }

    // Find all Mont 2 students
    const mont2Students = await Student.find({ className: 'Mont 2' });
    console.log(`🔍 Found ${mont2Students.length} student(s) in Mont 2.\n`);
    console.log('─'.repeat(60));

    let updatedCount = 0;
    let skippedCount = 0;

    for (const student of mont2Students) {
        // Skip if they already have academic history (don't double-add)
        if (student.academicHistory && student.academicHistory.length > 0) {
            console.log(`⚠️  Skipped: ${student.name} (${student.admissionNo}) — already has history`);
            skippedCount++;
            continue;
        }

        // Add historical entry: was in Mont 1 during 2025-2026, Promoted
        student.academicHistory = [{
            academicYear: prevYear ? prevYear._id : undefined,
            className: 'Mont 1',
            section: student.section || 'A',
            promotionStatus: 'Promoted',
            resultStatus: 'Pass',
            remarks: 'Backfilled: promoted from Mont 1 (2025-2026)',
            recordedAt: new Date()
        }];

        // Also set previousClass field for reference
        student.previousClass = 'Mont 1';

        await student.save();
        console.log(`✅ Updated: ${student.name} (${student.admissionNo}) — Added Mont 1 history (2025-2026 → Promoted)`);
        updatedCount++;
    }

    console.log('\n' + '─'.repeat(60));
    console.log(`📊 Done:`);
    console.log(`   ✅ Updated : ${updatedCount}`);
    console.log(`   ⚠️  Skipped : ${skippedCount} (already had history)`);
    console.log('─'.repeat(60) + '\n');

    process.exit(0);
};

run().catch(err => {
    console.error('Fatal:', err);
    process.exit(1);
});
