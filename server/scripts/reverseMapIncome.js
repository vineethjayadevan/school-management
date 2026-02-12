const mongoose = require('mongoose');
const OtherIncome = require('../models/OtherIncome');
const AccrualRevenue = require('../models/AccrualRevenue');
const Receivable = require('../models/Receivable');
const Settlement = require('../models/Settlement');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const reverseMapIncome = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // 1. Fetch Source Data (Exclude 'Capital Introduced')
            // Using a case-insensitive regex or just $ne to be safe, but based on previous check, exact string 'Capital Introduced' works.
            const incomes = await OtherIncome.find({
                category: { $ne: 'Capital Introduced' }
            }).session(session);

            console.log(`Found ${incomes.length} income entries to migrate.`);

            for (const income of incomes) {
                const customer = 'Cash Receipt';

                // A. AccrualRevenue
                const accrualRevenue = new AccrualRevenue({
                    date: income.date,
                    customer: customer,
                    category: income.category,
                    subcategory: income.subcategory,
                    amount: income.amount,
                    dueDate: income.date,
                    description: income.description || income.title, // 'title' might be undefined based on schema, 'description' is there
                    addedBy: income.addedBy
                });
                await accrualRevenue.save({ session });

                // B. Receivable (Fully Paid)
                const receivable = new Receivable({
                    source: accrualRevenue._id,
                    customer: customer,
                    amount: income.amount,
                    paidAmount: income.amount,
                    balance: 0,
                    status: 'Paid',
                    dueDate: income.date,
                    description: income.description || income.title
                });
                await receivable.save({ session });

                // Link Receivable to Revenue
                accrualRevenue.linkedReceivable = receivable._id;
                await accrualRevenue.save({ session });

                // C. Settlement (Receipt)
                const settlement = new Settlement({
                    date: income.date,
                    type: 'Receipt',
                    relatedReceivable: receivable._id,
                    amount: income.amount,
                    paymentMode: 'Cash',
                    description: income.description || income.title,
                    recordedBy: income.addedBy
                });
                await settlement.save({ session });
            }

            await session.commitTransaction();
            console.log('Migration completed successfully.');
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

reverseMapIncome();
