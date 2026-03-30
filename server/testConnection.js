const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function checkConnection() {
    try {
        console.log("URI in use:", process.env.MONGO_URI);
        const client = await mongoose.connect(process.env.MONGO_URI);
        console.log('Success! Connected to database:', client.connection.name);
        
        // Let's drop the orders and products collections if the connection is successful.
        try {
            await client.connection.db.dropCollection('orders');
            console.log('Successfully dropped collection: orders');
        } catch (e) {
            console.log('Orders collection not dropped (might not exist):', e.message);
        }
        
        try {
            await client.connection.db.dropCollection('products');
            console.log('Successfully dropped collection: products');
        } catch (e) {
            console.log('Products collection not dropped (might not exist):', e.message);
        }

        process.exit(0);
    } catch (error) {
        console.error('Connection failed! The URI is likely malformed.', error.message);
        process.exit(1);
    }
}

checkConnection();
