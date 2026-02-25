/**
 * importData.js
 * -------------
 * Imports ALL collections from the local backup JSON file into the MongoDB URI in .env.
 * Uses EJSON to correctly restore MongoDB types (ObjectId, Date, etc.)
 * ⚠️  WARNING: This will DROP existing collections before restoring (clean import).
 *
 * Usage:
 *   1. Run exportData.js first to generate the backup
 *   2. Change MONGO_URI in .env to the TARGET database (e.g., local or new Atlas)
 *   3. Run: node scripts/importData.js
 *
 * Input: server/backup/db-backup.json
 */

require("dotenv").config();
const mongoose = require("mongoose");
const { EJSON } = require("bson");
const fs = require("fs");
const path = require("path");

const MONGO_URI = process.env.MONGO_URI;
const BACKUP_FILE = path.join(__dirname, "../backup/db-backup.json");

if (!MONGO_URI) {
    console.error("❌  MONGO_URI not found in .env file.");
    process.exit(1);
}

if (!fs.existsSync(BACKUP_FILE)) {
    console.error(`❌  Backup file not found at: ${BACKUP_FILE}`);
    console.error("    Please run exportData.js first.");
    process.exit(1);
}

async function importData() {
    console.log("📂  Reading backup file...");
    // Use EJSON.parse to correctly restore ObjectId, Date, and other MongoDB types
    const backup = EJSON.parse(fs.readFileSync(BACKUP_FILE, "utf-8"));
    const collectionNames = Object.keys(backup);

    if (collectionNames.length === 0) {
        console.log("⚠️  Backup file is empty. Nothing to import.");
        return;
    }

    console.log(`📦  Found ${collectionNames.length} collection(s) in backup:`);
    collectionNames.forEach((c) => console.log(`   - ${c} (${backup[c].length} docs)`));
    console.log();

    console.log("🔗  Connecting to target database...");
    await mongoose.connect(MONGO_URI);
    console.log("✅  Connected!\n");

    const db = mongoose.connection.db;
    let totalInserted = 0;

    for (const name of collectionNames) {
        const docs = backup[name];

        // Drop existing collection for a clean restore
        try {
            await db.collection(name).drop();
            console.log(`   🗑  Dropped existing: ${name}`);
        } catch (e) {
            // Collection may not exist — that's fine
        }

        if (docs.length > 0) {
            await db.collection(name).insertMany(docs);
            totalInserted += docs.length;
            console.log(`   ✔ Imported: ${name} (${docs.length} documents)`);
        } else {
            console.log(`   ⚠️  Skipped: ${name} (0 documents)`);
        }
    }

    console.log(`\n✅  Import complete!`);
    console.log(`📊  Total collections restored: ${collectionNames.length}`);
    console.log(`📄  Total documents inserted: ${totalInserted}`);

    await mongoose.disconnect();
    console.log("\n🔌  Disconnected. Import complete!");
}

importData().catch((err) => {
    console.error("❌  Import failed:", err.message);
    mongoose.disconnect();
    process.exit(1);
});
