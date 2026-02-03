const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../server/.env') });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');
    } catch (err) {
        console.error('Connection Error:', err);
        process.exit(1);
    }
};

const feeSchema = new mongoose.Schema({
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
    feeType: String,
    amount: Number,
    paymentDate: Date,
    status: String,
    receiptNo: String,
}, { timestamps: true });

const Fee = mongoose.model('Fee', feeSchema);

const deleteRecentFees = async () => {
    await connectDB();

    try {
        // Find last 5 fees to see what's going on
        const recentFees = await Fee.find().sort({ createdAt: -1 }).limit(5);

        console.log('--- Recent 5 Transactions ---');
        recentFees.forEach(f => {
            console.log(`ID: ${f._id} | Amount: ${f.amount} | Type: ${f.feeType} | Date: ${f.createdAt}`);
        });

        if (recentFees.length < 2) {
            console.log('Not enough records to delete 2.');
            process.exit(0);
        }

        // The user specifically asked to delete "two entries"
        const idsToDelete = [recentFees[0]._id, recentFees[1]._id];

        console.log(`Deleting Fees: ${idsToDelete.join(', ')}`);

        await Fee.deleteMany({ _id: { $in: idsToDelete } });

        console.log('Successfully deleted 2 records.');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
};

deleteRecentFees();
