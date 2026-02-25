/**
 * findBoardEntries.js
 * -------------------
 * Finds all board portal entries made on 22-02-2026 across relevant collections.
 * Run: node scripts/findBoardEntries.js
 */

require("dotenv").config();
const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGO_URI;

const BOARD_COLLECTIONS = [
    "accrualrevenues",
    "accrualexpenses",
    "capitals",
    "receivables",
    "payables",
    "otherincomes",
    "settlements",
    "expenses",
];

const TARGET_DATE_START = new Date("2026-02-22T00:00:00.000Z");
const TARGET_DATE_END = new Date("2026-02-22T23:59:59.999Z");

async function findEntries() {
    console.log("🔗  Connecting to database...");
    await mongoose.connect(MONGO_URI);
    console.log("✅  Connected!\n");

    const db = mongoose.connection.db;
    let found = false;

    for (const name of BOARD_COLLECTIONS) {
        const docs = await db.collection(name).find({
            $or: [
                { date: { $gte: TARGET_DATE_START, $lte: TARGET_DATE_END } },
                { createdAt: { $gte: TARGET_DATE_START, $lte: TARGET_DATE_END } },
            ],
        }).toArray();

        if (docs.length > 0) {
            found = true;
            console.log(`\n📂 Collection: ${name.toUpperCase()} (${docs.length} entry/entries)`);
            docs.forEach((doc, i) => {
                console.log(`\n  Entry #${i + 1}:`);
                console.log(`    _id        : ${doc._id}`);
                console.log(`    date       : ${doc.date || doc.createdAt}`);
                console.log(`    Amount     : ${doc.amount ?? doc.totalAmount ?? "N/A"}`);
                console.log(`    Description: ${doc.description || doc.notes || doc.category || "N/A"}`);
                console.log(`    Type       : ${doc.type || "N/A"}`);
                console.log(`    RecordedBy : ${doc.recordedBy || doc.createdBy || "N/A"}`);
            });
        }
    }

    if (!found) {
        console.log("⚠️  No entries found on 22-02-2026 in any board collection.");
    }

    await mongoose.disconnect();
    console.log("\n🔌  Disconnected.");
}

findEntries().catch((err) => {
    console.error("❌  Error:", err.message);
    mongoose.disconnect();
    process.exit(1);
});
