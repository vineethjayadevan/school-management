const mongoose = require('mongoose');

async function cleanTestDatabase() {
    try {
        // Hardcoded the correct format for the URI since .env has a syntax error
        const uri = 'mongodb+srv://vineethjay1998_db_user:vineeth_school_management@cluster0.k6cxmia.mongodb.net/test?appName=Cluster0';
        console.log("Connecting to:", uri);
        
        const client = await mongoose.connect(uri);
        console.log('Success! Connected to database:', client.connection.name);
        
        // Let's drop the orders and products collections
        try {
            await client.connection.db.dropCollection('orders');
            console.log('Successfully deleted the "orders" table.');
        } catch (e) {
            console.log('Table "orders" might not exist or already deleted.');
        }
        
        try {
            await client.connection.db.dropCollection('products');
            console.log('Successfully deleted the "products" table.');
        } catch (e) {
            console.log('Table "products" might not exist or already deleted.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Connection failed!', error.message);
        process.exit(1);
    }
}

cleanTestDatabase();
