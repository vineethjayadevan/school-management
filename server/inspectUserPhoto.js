const mongoose = require('mongoose');
const User = require('./models/User');
const Staff = require('./models/Staff');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function checkUser() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const user = await User.findOne({ email: 'jayadevanv@mystemgps.com' });
        if (!user) {
            console.log("User not found!");
            process.exit(1);
        }
        console.log("Found User:", JSON.stringify(user, null, 2));
        
        if (user.profileId) {
             const staff = await Staff.findById(user.profileId);
             console.log("Linked Staff:", staff ? "Found!" : "Not found in Staff table");
             if (staff) {
                  console.log("Staff Avatar field:", staff.avatar);
             }
        } else {
             console.log("No profileId linked to this user.");
        }
        
        process.exit(0);
    } catch (e) {
        console.error(e.message);
        process.exit(1);
    }
}
checkUser();
