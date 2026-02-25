const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Student = require('../models/Student');
const AcademicYear = require('../models/AcademicYear');

const { getPromotionPreview, executePromotion } = require('../controllers/promotionController');

async function testPromotionLogic() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        // 1. Setup Data
        const currentYear = await AcademicYear.findOne({ name: '2024-2025' });
        const nextYear = await AcademicYear.findOne({ name: '2025-2026' });

        if (!currentYear || !nextYear) {
            console.error("Missing academic years");
            process.exit(1);
        }

        // 2. Fetch our test students from Grade 1
        const testStudents = await Student.find({ className: 'Grade 1', name: /^Test Student/ });
        console.log(`Found ${testStudents.length} test students in Grade 1`);

        if (testStudents.length < 2) {
            console.error("Not enough test students seeded.");
            process.exit(1);
        }

        // Reset their state in case of previous runs
        for (let s of testStudents) {
            s.className = 'Grade 1';
            s.currentAcademicYear = currentYear._id;
            s.academicHistory = [];
            await s.save();
        }
        console.log('Reset test students state to Grade 1');

        // ==== SIMULATE WIZARD EXECUTION 1: Grade 1 -> Grade 2 ====
        console.log('\n--- Executing Grade 1 -> Grade 2 ---');

        // Simulating the payload the frontend would send
        const req1 = {
            body: {
                currentYearId: currentYear._id,
                nextYearId: nextYear._id,
                classMappings: {
                    'Grade 1': { toClass: 'Grade 2', isGraduating: false }
                },
                // Student 1: Detain. Student 2: Skip. Others: Promote.
                studentsToProcess: testStudents.map((s, index) => {
                    if (index === 0) return { studentId: s._id, action: 'Detain', remarks: 'Failed Math' };
                    if (index === 1) return { studentId: s._id, action: 'Skip', remarks: '' };
                    return { studentId: s._id, action: 'Promote', remarks: '' };
                }).filter(s => s.action !== 'Skip') // Frontend filters out skips
            },
            user: { _id: new mongoose.Types.ObjectId() }
        };

        const res1 = {
            status: (code) => ({
                json: (data) => console.log('Response 1:', code, data.message)
            })
        };

        await executePromotion(req1, res1);

        // ==== VERIFY STEP 1 RESULTS ====
        const s1_after = await Student.findById(testStudents[0]._id);
        const s2_skipped = await Student.findById(testStudents[1]._id);
        const s3_promoted = await Student.findById(testStudents[2]._id);

        console.log('\nVerification after Step 1:');
        console.log(`Student 1 (Detained): Class -> ${s1_after.className}, History -> ${s1_after.academicHistory.length > 0 ? s1_after.academicHistory[0].promotionStatus : 'None'}`);
        console.log(`Student 2 (Skipped): Class -> ${s2_skipped.className}, History length -> ${s2_skipped.academicHistory.length}`);
        console.log(`Student 3 (Promoted): Class -> ${s3_promoted.className}, History -> ${s3_promoted.academicHistory.length > 0 ? s3_promoted.academicHistory[0].promotionStatus : 'None'}`);


        // ==== SIMULATE WIZARD EXECUTION 2: Grade 2 -> Grade 3 ====
        console.log('\n--- Executing Grade 2 -> Grade 3 (Testing Double Promotion Safety) ---');

        // Fetch whoever is in Grade 2 *right now* (which includes our newly promoted test students)
        const grade2Students = await Student.find({ className: 'Grade 2' });

        const req2 = {
            body: {
                currentYearId: currentYear._id,
                nextYearId: nextYear._id,
                classMappings: {
                    'Grade 2': { toClass: 'Grade 3', isGraduating: false }
                },
                // Attempt to promote everyone currently in Grade 2
                studentsToProcess: grade2Students.map(s => ({ studentId: s._id, action: 'Promote', remarks: '' }))
            },
            user: { _id: new mongoose.Types.ObjectId() }
        };

        const res2 = {
            status: (code) => ({
                json: (data) => console.log('Response 2:', code, data.message)
            })
        };

        await executePromotion(req2, res2);

        // ==== VERIFY STEP 2 RESULTS ====
        // Student 3 should STILL be in Grade 2, because their currentAcademicYear is nextYearId
        const s3_final = await Student.findById(testStudents[2]._id);
        console.log('\nVerification after Step 2 (Double Promotion Check):');
        console.log(`Student 3 (Should be protected): Class -> ${s3_final.className}, History length -> ${s3_final.academicHistory.length}`);

        if (s3_final.className === 'Grade 2' && s3_final.academicHistory.length === 1) {
            console.log('\nSUCCESS! Double promotion bug is verified fixed.');
        } else {
            console.log('\nFAILED. Student was double promoted.');
        }


    } catch (err) {
        console.error(err);
    } finally {
        mongoose.disconnect();
    }
}

testPromotionLogic();
