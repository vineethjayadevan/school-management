/**
 * deleteBoardEntry.js
 * -------------------
 * Deletes the "Receipt for Jayaraj" entries dated 22-02-2026 from:
 *  - accrualrevenues
 *  - settlements
 *
 * Run: node scripts/deleteBoardEntry.js
 */

require("dotenv").config();
const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGO_URI;

async function deleteEntries() {
    console.log("🔗  Connecting to database...");
    await mongoose.connect(MONGO_URI);
    console.log("✅  Connected!\n");

    const db = mongoose.connection.db;

    const TARGET_DATE_START = new Date("2026-02-22T00:00:00.000Z");
    const TARGET_DATE_END = new Date("2026-02-22T23:59:59.999Z");

    // Delete from accrualrevenues
    const accrualResult = await db.collection("accrualrevenues").deleteMany({
        $or: [
            { date: { $gte: TARGET_DATE_START, $lte: TARGET_DATE_END } },
            { createdAt: { $gte: TARGET_DATE_START, $lte: TARGET_DATE_END } },
        ],
    });
    console.log(`🗑  Deleted from accrualrevenues: ${accrualResult.deletedCount} document(s)`);

    // Delete from settlements
    const settlementResult = await db.collection("settlements").deleteMany({
        $or: [
            { date: { $gte: TARGET_DATE_START, $lte: TARGET_DATE_END } },
            { createdAt: { $gte: TARGET_DATE_START, $lte: TARGET_DATE_END } },
        ],
    });
    console.log(`🗑  Deleted from settlements: ${settlementResult.deletedCount} document(s)`);

    console.log("\n✅  Done! Both entries for 22-02-2026 have been deleted.");

    await mongoose.disconnect();
    console.log("🔌  Disconnected.");
}

deleteEntries().catch((err) => {
    console.error("❌  Error:", err.message);
    mongoose.disconnect();
    process.exit(1);
});
