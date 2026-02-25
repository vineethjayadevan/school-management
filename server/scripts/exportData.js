/**
 * exportData.js
 * -------------
 * Exports ALL collections from the MongoDB URI in .env to a local backup JSON file.
 * Uses EJSON to preserve MongoDB types (ObjectId, Date, etc.)
 *
 * Usage:
 *   1. Set MONGO_URI in .env to the SOURCE database (e.g., Atlas)
 *   2. Run: node scripts/exportData.js
 *
 * Output: server/backup/db-backup.json
 */

require("dotenv").config();
const mongoose = require("mongoose");
const { EJSON } = require("bson");
const fs = require("fs");
const path = require("path");

const MONGO_URI = process.env.MONGO_URI;
const BACKUP_DIR = path.join(__dirname, "../backup");
const BACKUP_FILE = path.join(BACKUP_DIR, "db-backup.json");

if (!MONGO_URI) {
    console.error("❌  MONGO_URI not found in .env file.");
    process.exit(1);
}

async function exportData() {
    console.log("🔗  Connecting to source database...");
    await mongoose.connect(MONGO_URI);
    console.log("✅  Connected!\n");

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();

    if (collections.length === 0) {
        console.log("⚠️  No collections found in the database.");
        await mongoose.disconnect();
        return;
    }

    console.log(`📦  Found ${collections.length} collection(s):`);
    collections.forEach((c) => console.log(`   - ${c.name}`));
    console.log();

    const backup = {};

    for (const col of collections) {
        const name = col.name;
        const docs = await db.collection(name).find({}).toArray();
        backup[name] = docs;
        console.log(`   ✔ Exported: ${name} (${docs.length} documents)`);
    }

    // Ensure backup directory exists
    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    // Use EJSON to preserve ObjectId, Date, and other MongoDB types
    fs.writeFileSync(BACKUP_FILE, EJSON.stringify(backup, null, 2));

    console.log(`\n✅  Backup saved to: ${BACKUP_FILE}`);
    console.log(`📊  Total collections: ${Object.keys(backup).length}`);
    console.log(
        `📄  Total documents: ${Object.values(backup).reduce((sum, col) => sum + col.length, 0)}`
    );

    await mongoose.disconnect();
    console.log("\n🔌  Disconnected. Export complete!");
}

exportData().catch((err) => {
    console.error("❌  Export failed:", err.message);
    mongoose.disconnect();
    process.exit(1);
});
