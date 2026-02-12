const Settlement = require('../models/Settlement');
const Receivable = require('../models/Receivable');
const Payable = require('../models/Payable');
const Expense = require('../models/Expense'); // Legecy Cash Ledger
const OtherIncome = require('../models/OtherIncome'); // Legacy Cash Ledger

// @desc    Create Settlement (Receipt/Payment)
// @route   POST /api/accrual/settlements
// @access  Private
const createSettlement = async (req, res) => {
    const { date, type, amount, relatedId, paymentMode, description } = req.body;
    // relatedId is either receivableId (for Receipt) or payableId (for Payment)

    const session = await Settlement.startSession();
    session.startTransaction();

    try {
        let settlementData = {
            date,
            type,
            amount,
            paymentMode,
            description,
            recordedBy: req.user._id
        };

        if (type === 'Receipt') {
            // 1. Process Receipt (Clear Receivable)
            const receivable = await Receivable.findById(relatedId).session(session);
            if (!receivable) throw new Error('Receivable not found');

            if (receivable.balance < amount) {
                throw new Error(`Amount exceeds outstanding balance of ${receivable.balance}`);
            }

            // Update Settlement Data
            settlementData.relatedReceivable = receivable._id;

            // Update Receivable
            receivable.paidAmount = (receivable.paidAmount || 0) + Number(amount);
            receivable.balance = receivable.balance - Number(amount);
            receivable.status = receivable.balance === 0 ? 'Paid' : 'Partial';
            await receivable.save({ session });

            // 2. Mirror into Legacy Cash Ledger (OtherIncome)
            // We use a special Category to denote this came from Accrual Settlement
            const otherIncome = new OtherIncome({
                date,
                category: 'Accounts Receivable',
                subcategory: 'Settlement',
                amount,
                description: `Settlement for ${receivable.customer} (Ref: ${receivable._id})`,
                addedBy: req.user._id
            });
            await otherIncome.save({ session });

        } else if (type === 'Payment') {
            // 1. Process Payment (Clear Payable)
            const payable = await Payable.findById(relatedId).session(session);
            if (!payable) throw new Error('Payable not found');

            if (payable.balance < amount) {
                throw new Error(`Amount exceeds outstanding balance of ${payable.balance}`);
            }

            // Update Settlement Data
            settlementData.relatedPayable = payable._id;

            // Update Payable
            payable.paidAmount = (payable.paidAmount || 0) + Number(amount);
            payable.balance = payable.balance - Number(amount);
            payable.status = payable.balance === 0 ? 'Paid' : 'Partial';
            await payable.save({ session });

            // 2. Mirror into Legacy Cash Ledger (Expense)
            const expense = new Expense({
                date,
                category: 'Accounts Payable',
                subcategory: 'Settlement',
                amount,
                description: `Settlement for ${payable.vendor} (Ref: ${payable._id})`,
                addedBy: req.user._id
            });
            await expense.save({ session });
        } else {
            // Handle Capital/Loan types if needed later
        }

        const settlement = new Settlement(settlementData);
        await settlement.save({ session });

        await session.commitTransaction();
        session.endSession();

        res.status(201).json(settlement);
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get All Settlements
// @route   GET /api/accrual/settlements
// @access  Private
const getSettlements = async (req, res) => {
    try {
        const { startDate, endDate, type } = req.query;
        let query = {};

        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }
        if (type) query.type = type;

        const settlements = await Settlement.find(query)
            .sort({ date: -1 })
            .populate('relatedReceivable', 'customer')
            .populate('relatedPayable', 'vendor');

        res.json(settlements);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createSettlement,
    getSettlements
};
