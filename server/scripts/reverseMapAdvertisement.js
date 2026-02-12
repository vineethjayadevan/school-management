const mongoose = require('mongoose');
const Expense = require('../models/Expense');
const AccrualExpense = require('../models/AccrualExpense');
const Payable = require('../models/Payable');
const Settlement = require('../models/Settlement');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const reverseMapAdvertisement = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // 1. Fetch Source Data
            const expenses = await Expense.find({
                category: 'Advertisement & Marketing',
                subcategory: 'Advertisement'
            }).session(session);

            console.log(`Found ${expenses.length} expenses to migrate.`);

            for (const expense of expenses) {
                // Default Vendor Logic
                const vendor = 'Cash Purchase';

                // console.log(`Migrating: "${expense.title}" -> Vendor: "${vendor}"`);

                // A. AccrualExpense
                const accrualExpense = new AccrualExpense({
                    date: expense.date,
                    vendor: vendor,
                    category: expense.category,
                    subcategory: expense.subcategory,
                    amount: expense.amount,
                    dueDate: expense.date,
                    description: expense.title,
                    addedBy: expense.addedBy
                });
                await accrualExpense.save({ session });

                // B. Payable
                const payable = new Payable({
                    source: accrualExpense._id,
                    vendor: vendor,
                    amount: expense.amount,
                    paidAmount: expense.amount,
                    balance: 0,
                    status: 'Paid',
                    dueDate: expense.date,
                    description: expense.title
                });
                await payable.save({ session });

                // Link Payable
                accrualExpense.linkedPayable = payable._id;
                await accrualExpense.save({ session });

                // C. Settlement (No duplicate Expense creation)
                const settlement = new Settlement({
                    date: expense.date,
                    type: 'Payment',
                    relatedPayable: payable._id,
                    amount: expense.amount,
                    paymentMode: 'Cash',
                    description: expense.title,
                    documentType: expense.referenceType || 'Voucher',
                    documentNumber: expense.referenceNo,
                    recordedBy: expense.addedBy
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

reverseMapAdvertisement();
