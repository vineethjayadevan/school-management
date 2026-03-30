const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const OtherIncome = require('./models/OtherIncome');

async function extractUserNames() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const incomes = await OtherIncome.find({ category: 'Capital Introduced' });
        
        let mapping = {};

        incomes.forEach(inc => {
            if (inc.addedBy && inc.description && inc.subcategory === 'Investment by Board Members') {
                const userId = inc.addedBy.toString();
                // Assumes format is something like "Investment by Shaji" or "Investement by Shaji"
                const match = inc.description.match(/Investe?ment by (.+)/i);
                
                if (match && match[1]) {
                    const name = match[1].trim();
                    mapping[userId] = name;
                }
            }
        });

        console.log("--- Extracted User ID to Name Map ---");
        for (const [id, name] of Object.entries(mapping)) {
            console.log(`User ID: ${id}  ->  Name: ${name}`);
        }
        
        process.exit(0);
    } catch (e) {
        console.error("Error:", e);
        process.exit(1);
    }
}
extractUserNames();
