require("dotenv").config();
const mongoose = require("mongoose");

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const db = mongoose.connection.db;
    const start = new Date("2026-02-22T00:00:00.000Z");
    const end = new Date("2026-02-22T23:59:59.999Z");

    const query = {
        $or: [
            { date: { $gte: start, $lte: end } },
            { createdAt: { $gte: start, $lte: end } },
        ],
    };

    const r1 = await db.collection("receivables").deleteMany(query);
    console.log(`🗑  Deleted from receivables:  ${r1.deletedCount} document(s)`);

    const r2 = await db.collection("otherincomes").deleteMany(query);
    console.log(`🗑  Deleted from otherincomes: ${r2.deletedCount} document(s)`);

    console.log("\n✅  All 22-02-2026 entries fully cleaned up!");
    await mongoose.disconnect();
});
