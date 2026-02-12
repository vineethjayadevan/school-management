const AccrualRevenue = require('../models/AccrualRevenue');
const AccrualExpense = require('../models/AccrualExpense');
const Receivable = require('../models/Receivable');
const Payable = require('../models/Payable');

// @desc    Create Revenue Entry (and corresponding Receivable)
// @route   POST /api/accrual/revenue
// @access  Private
const createRevenue = async (req, res) => {
    const { date, customer, student, category, subcategory, amount, dueDate, description } = req.body;

    const session = await AccrualRevenue.startSession();
    session.startTransaction();

    try {
        // 1. Create Revenue Record
        const revenue = new AccrualRevenue({
            date,
            customer,
            student,
            category,
            subcategory,
            amount,
            dueDate,
            description,
            addedBy: req.user._id
        });

        const savedRevenue = await revenue.save({ session });

        // 2. Create Receivable Record
        const receivable = new Receivable({
            source: savedRevenue._id,
            customer: customer,
            amount: amount,
            balance: amount, // Initially full amount
            paidAmount: 0,
            dueDate: dueDate,
            status: 'Unpaid',
            description: `Receivable for ${category}`
        });

        const savedReceivable = await receivable.save({ session });

        // 3. Link Receivable back to Revenue
        savedRevenue.linkedReceivable = savedReceivable._id;
        await savedRevenue.save({ session });

        await session.commitTransaction();
        session.endSession();

        res.status(201).json({ revenue: savedRevenue, receivable: savedReceivable });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create Expense Entry (and corresponding Payable)
// @route   POST /api/accrual/expense
// @access  Private
const createExpense = async (req, res) => {
    const { date, vendor, category, subcategory, amount, dueDate, description } = req.body;

    const session = await AccrualExpense.startSession();
    session.startTransaction();

    try {
        // 1. Create Expense Record
        const expense = new AccrualExpense({
            date,
            vendor,
            category,
            subcategory,
            amount,
            dueDate,
            description,
            addedBy: req.user._id
        });

        const savedExpense = await expense.save({ session });

        // 2. Create Payable Record
        const payable = new Payable({
            source: savedExpense._id,
            vendor: vendor,
            amount: amount,
            balance: amount, // Initially full amount
            paidAmount: 0,
            dueDate: dueDate,
            status: 'Unpaid',
            description: `Payable for ${category}`
        });

        const savedPayable = await payable.save({ session });

        // 3. Link Payable back to Expense
        savedExpense.linkedPayable = savedPayable._id;
        await savedExpense.save({ session });

        await session.commitTransaction();
        session.endSession();

        res.status(201).json({ expense: savedExpense, payable: savedPayable });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Revenue Entries
// @route   GET /api/accrual/revenue
// @access  Private
const getRevenueEntries = async (req, res) => {
    try {
        const { startDate, endDate, customer } = req.query;
        let query = {};

        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }
        if (customer) {
            query.customer = { $regex: customer, $options: 'i' };
        }

        const entries = await AccrualRevenue.find(query).sort({ date: -1 });
        res.json(entries);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Expense Entries
// @route   GET /api/accrual/expense
// @access  Private
const getExpenseEntries = async (req, res) => {
    try {
        const { startDate, endDate, vendor } = req.query;
        let query = {};

        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }
        if (vendor) {
            query.vendor = { $regex: vendor, $options: 'i' };
        }

        const entries = await AccrualExpense.find(query).sort({ date: -1 });
        res.json(entries);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Receivables
// @route   GET /api/accrual/receivables
// @access  Private
const getReceivables = async (req, res) => {
    try {
        const { status, customer } = req.query;
        let query = {};

        if (status) query.status = status;
        if (customer) query.customer = { $regex: customer, $options: 'i' };

        const receivables = await Receivable.find(query).sort({ dueDate: 1 });
        res.json(receivables);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Payables
// @route   GET /api/accrual/payables
// @access  Private
const getPayables = async (req, res) => {
    try {
        const { status, vendor } = req.query;
        let query = {};

        if (status) query.status = status;
        if (vendor) query.vendor = { $regex: vendor, $options: 'i' };

        const payables = await Payable.find(query).sort({ dueDate: 1 });
        res.json(payables);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// @desc    Get Accrual Profit & Loss
// @route   GET /api/accrual/pnl
// @access  Private
const getAccrualProfitAndLoss = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let dateQuery = {};

        if (startDate || endDate) {
            dateQuery.date = {};
            if (startDate) dateQuery.date.$gte = new Date(startDate);
            if (endDate) dateQuery.date.$lte = new Date(endDate);
        }

        // 1. Calculate Total Revenue (Grouped by Category)
        const revenueAgg = await AccrualRevenue.aggregate([
            { $match: dateQuery },
            { $group: { _id: '$category', total: { $sum: '$amount' } } }
        ]);

        // 2. Calculate Total Expenses (Grouped by Category)
        const expenseAgg = await AccrualExpense.aggregate([
            { $match: dateQuery },
            { $group: { _id: '$category', total: { $sum: '$amount' } } }
        ]);

        const totalRevenue = revenueAgg.reduce((sum, item) => sum + item.total, 0);
        const totalExpenses = expenseAgg.reduce((sum, item) => sum + item.total, 0);
        const netProfit = totalRevenue - totalExpenses;

        res.json({
            dateRange: { startDate, endDate },
            revenue: {
                total: totalRevenue,
                breakdown: revenueAgg.map(r => ({ category: r._id, amount: r.total }))
            },
            expenses: {
                total: totalExpenses,
                breakdown: expenseAgg.map(e => ({ category: e._id, amount: e.total }))
            },
            netProfit
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Accrual Balance Sheet
// @route   GET /api/accrual/balance-sheet
// @access  Private
const getAccrualBalanceSheet = async (req, res) => {
    try {
        // ASSETS
        // 1. Cash / Bank Balance
        // We calculate this similarly to the "Net Worth" logic in financeController
        // Cash = Total Receipts (OtherIncome) - Total Payments (Expense)
        // Note: Since Settlements mirror to these, they are included.
        // We need to import Expense and OtherIncome models here.
        const Expense = require('../models/Expense');
        const OtherIncome = require('../models/OtherIncome');

        const otherIncomeAgg = await OtherIncome.aggregate([
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const totalReceipts = otherIncomeAgg.length > 0 ? otherIncomeAgg[0].total : 0;

        const expenseAgg = await Expense.aggregate([
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const totalPayments = expenseAgg.length > 0 ? expenseAgg[0].total : 0;

        const cashBalance = totalReceipts - totalPayments;

        // 2. Accounts Receivable (Unpaid Invoices)
        // Sum of 'balance' field in Receivables
        const arAgg = await Receivable.aggregate([
            { $match: { balance: { $gt: 0 } } },
            { $group: { _id: null, total: { $sum: '$balance' } } }
        ]);
        const accountsReceivable = arAgg.length > 0 ? arAgg[0].total : 0;

        // LIABILITIES
        // 1. Accounts Payable (Unpaid Bills)
        // Sum of 'balance' field in Payables
        const apAgg = await Payable.aggregate([
            { $match: { balance: { $gt: 0 } } },
            { $group: { _id: null, total: { $sum: '$balance' } } }
        ]);
        const accountsPayable = apAgg.length > 0 ? apAgg[0].total : 0;

        // EQUITY
        // 1. Capital (Investments)
        // Filter OtherIncome for 'Investment by board members'
        const capitalAgg = await OtherIncome.aggregate([
            { $match: { category: 'Investment by board members' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const totalCapital = capitalAgg.length > 0 ? capitalAgg[0].total : 0;

        // 2. Retained Earnings (Net Profit Life-to-Date)
        // Revenue (Accrual) - Expense (Accrual)
        const totalAccrualRevenueAgg = await AccrualRevenue.aggregate([
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const totalAccrualRevenue = totalAccrualRevenueAgg.length > 0 ? totalAccrualRevenueAgg[0].total : 0;

        const totalAccrualExpenseAgg = await AccrualExpense.aggregate([
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const totalAccrualExpense = totalAccrualExpenseAgg.length > 0 ? totalAccrualExpenseAgg[0].total : 0;

        const retainedEarnings = totalAccrualRevenue - totalAccrualExpense;

        // Note: In a perfect double-entry system, Assets = Liabilities + Equity.
        // Due to the hybrid nature (Cash from Legacy, AR/AP from Accrual), there might be an "Opening Balance Equity" or "Adjustment" needed to balance.
        // For now, we calculate them independently and check if they balance.

        // Let's refine Retained Earnings to balance the sheet?
        // Assets = Cash + AR
        // Liabilities = AP
        // Equity = Assets - Liabilities = (Cash + AR) - AP
        // Break down Equity into Capital + Retained Earnings.
        // So Retained Earnings = (Cash + AR) - AP - Capital.

        // This 'Plug' approach ensures the Balance Sheet balances, which is often preferred in simple systems over showing a discrepancy.
        const totalAssets = cashBalance + accountsReceivable;
        const totalLiabilities = accountsPayable;
        const totalEquity = totalAssets - totalLiabilities;
        const calculatedRetainedEarnings = totalEquity - totalCapital;

        res.json({
            assets: {
                cash: cashBalance,
                accountsReceivable: accountsReceivable,
                total: totalAssets
            },
            liabilities: {
                accountsPayable: accountsPayable,
                total: totalLiabilities
            },
            equity: {
                capital: totalCapital,
                retainedEarnings: calculatedRetainedEarnings, // Using the plug method to ensure balance
                total: totalEquity
            }
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createRevenue,
    createExpense,
    getRevenueEntries,
    getExpenseEntries,
    getReceivables,
    getPayables,
    getAccrualProfitAndLoss,
    getAccrualBalanceSheet
};
