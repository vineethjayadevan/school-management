const Settlement = require('../models/Settlement');
const Receivable = require('../models/Receivable');
const Payable = require('../models/Payable');
const Expense = require('../models/Expense'); // Legecy Cash Ledger
const OtherIncome = require('../models/OtherIncome'); // Legacy Cash Ledger

// @desc    Create Settlement (Receipt/Payment)
// @route   POST /api/accrual/settlements
// @access  Private
const createSettlement = async (req, res) => {
    const { date, type, amount, relatedId, paymentMode, description, documentType, documentNumber, category, subcategory } = req.body;
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
            recordedBy: req.user._id,
            documentType,
            documentNumber,
            category,
            subcategory
        };

        if (type === 'Receipt') {
            // 1. Process Receipt (Clear Receivable)
            const receivable = await Receivable.findById(relatedId).populate('source').session(session);
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
            // Use Original Category/Subcategory from the AccrualRevenue Source
            const originalCategory = receivable.source?.category || 'Accounts Receivable';
            const originalSubcategory = receivable.source?.subcategory || 'Settlement';

            const otherIncome = new OtherIncome({
                date,
                category: originalCategory,
                subcategory: originalSubcategory,
                amount,
                description: `Settlement for ${receivable.customer} (Ref: ${receivable._id}) - ${description || ''} ${documentNumber ? `[Receipt: ${documentNumber}]` : ''}`,
                addedBy: req.user._id
            });
            await otherIncome.save({ session });

        } else if (type === 'Payment') {
            // Validation: Must have Receipt Number OR Voucher
            // If documentType is Receipt, documentNumber is mandatory.
            // If documentType is Voucher, we assume it's created as a voucher, number might be optional or auto-generated logic could apply, but user said "voucher option".
            // Let's enforce selection.
            if (!documentType) {
                throw new Error('Please select either Receipt or Voucher option');
            }
            if (documentType === 'Receipt' && !documentNumber) {
                throw new Error('Receipt Number is mandatory when Receipt option is selected');
            }

            // 1. Process Payment (Clear Payable)
            const payable = await Payable.findById(relatedId).populate('source').session(session);
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
            // Use Original Category/Subcategory from the AccrualExpense Source
            const originalCategory = payable.source?.category || 'Accounts Payable';
            const originalSubcategory = payable.source?.subcategory || 'Settlement';

            const expense = new Expense({
                date,
                category: originalCategory,
                subcategory: originalSubcategory,
                amount,
                description: `Settlement for ${payable.vendor} (Ref: ${payable._id}) - ${description || ''} [${documentType}: ${documentNumber || 'N/A'}]`,
                addedBy: req.user._id
            });
            await expense.save({ session });
        } else if (type === 'Capital Injection') {
            // Capital Injection Logic (Money In)
            // No related Receivable, just record the inflow into Other Income as Equity

            // 1. Mirror into Legacy Cash Ledger (OtherIncome)
            const otherIncome = new OtherIncome({
                date,
                category: req.body.category || 'Equity',
                subcategory: req.body.subcategory || 'Capital Injection',
                amount,
                description: `Capital Injection - ${description || ''} ${documentNumber ? `[Receipt: ${documentNumber}]` : ''}`,
                addedBy: req.user._id
            });
            await otherIncome.save({ session });
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
        const { startDate, endDate, type, recordedBy } = req.query;
        let query = {};

        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }
        if (type) query.type = type;
        if (recordedBy) query.recordedBy = recordedBy;

        const settlements = await Settlement.find(query)
            .sort({ date: -1 })
            .populate('relatedReceivable', 'customer')
            .populate('relatedPayable', 'vendor')
            .populate('recordedBy', 'name');

        res.json(settlements);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createSettlement,
    getSettlements
};
