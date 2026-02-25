require("dotenv").config();
const mongoose = require("mongoose");

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const db = mongoose.connection.db;
    const start = new Date("2026-02-22T00:00:00.000Z");
    const end = new Date("2026-02-22T23:59:59.999Z");
    const cols = ["receivables", "payables", "settlements", "expenses", "otherincomes"];

    for (const name of cols) {
        const docs = await db.collection(name).find({
            $or: [
                { date: { $gte: start, $lte: end } },
                { createdAt: { $gte: start, $lte: end } },
            ],
        }).toArray();

        if (docs.length > 0) {
            console.log(`\n== ${name.toUpperCase()} (${docs.length}) ==`);
            docs.forEach((d) =>
                console.log(JSON.stringify({
                    _id: d._id,
                    date: d.date || d.createdAt,
                    amount: d.amount,
                    description: d.description || d.notes || d.category,
                    type: d.type,
                    party: d.party || d.partyName,
                    reference: d.reference || d.referenceNumber,
                }, null, 2))
            );
        }
    }

    await mongoose.disconnect();
});
