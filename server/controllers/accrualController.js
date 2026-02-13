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
        // Prevent 304 Not Modified
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('Surrogate-Control', 'no-store');

        const { startDate, endDate, customer, category, subcategory, search, userId } = req.query;
        let query = {};

        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }

        if (category) query.category = category;
        if (subcategory) query.subcategory = subcategory;
        if (userId) query.addedBy = userId;

        if (search) {
            query.$or = [
                { customer: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { category: { $regex: search, $options: 'i' } }
            ];
        } else if (customer) {
            query.customer = { $regex: customer, $options: 'i' };
        }

        const entries = await AccrualRevenue.find(query).sort({ date: -1 }).populate('addedBy', 'name');
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
        // Prevent 304 Not Modified
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('Surrogate-Control', 'no-store');

        const { startDate, endDate, vendor, category, subcategory, search, userId } = req.query;
        let query = {};

        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) query.date.$lte = new Date(endDate);
        }

        if (category) query.category = category;
        if (subcategory) query.subcategory = subcategory;
        if (userId) query.addedBy = userId;

        if (search) {
            query.$or = [
                { vendor: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { category: { $regex: search, $options: 'i' } }
            ];
        } else if (vendor) {
            query.vendor = { $regex: vendor, $options: 'i' };
        }

        const entries = await AccrualExpense.find(query).sort({ date: -1 }).populate('addedBy', 'name');
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
// @desc    Get Accrual Balance Sheet
// @route   GET /api/accrual/balance-sheet
// @access  Private
const getAccrualBalanceSheet = async (req, res) => {
    try {
        const { endDate } = req.query;
        let dateQuery = {};
        if (endDate) {
            dateQuery.date = { $lte: new Date(endDate) };
        }

        // --- 1. ASSETS ---

        // A. Cash / Bank Balance (Liquid Assets) - FROM SETTLEMENTS
        // Cash = (Receipts + Capital Injections + Loan Movements) - Payments
        // Assumption: Loan Movement is positive (Money In). Check if negative handling is needed.
        const Settlement = require('../models/Settlement');

        const cashInAgg = await Settlement.aggregate([
            {
                $match: {
                    ...dateQuery,
                    type: { $in: ['Receipt', 'Capital Injection', 'Loan Movement'] }
                }
            },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const cashIn = cashInAgg.length > 0 ? cashInAgg[0].total : 0;

        const cashOutAgg = await Settlement.aggregate([
            {
                $match: {
                    ...dateQuery,
                    type: 'Payment'
                }
            },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const cashOut = cashOutAgg.length > 0 ? cashOutAgg[0].total : 0;

        const cashBalance = cashIn - cashOut;

        // B. Accounts Receivable (Unpaid Invoices)
        // Sum of 'balance' field in Receivables
        const arAgg = await Receivable.aggregate([
            // We ideally should snapshot this as of endDate, but 'balance' is current.
            // For true historical BS, we'd need a transaction ledger for AR. 
            // For now, assuming "As of Now" or ignoring date filter for balance if strict history not supported.
            // However, to be consistent with request, we'll just take current outstanding.
            { $match: { balance: { $gt: 0 } } },
            { $group: { _id: null, total: { $sum: '$balance' } } }
        ]);
        const accountsReceivable = arAgg.length > 0 ? arAgg[0].total : 0;

        // C. Fixed Assets (Long-term Assets)
        // From AccrualExpense where category is Asset-type
        const ASSET_CATEGORIES = [
            'Building', 'Furniture', 'Equipment', 'Computers', 'Vehicles',
            'Infrastructure', 'Land', 'Fixed Assets', 'Assets'
        ];

        const fixedAssetsAgg = await AccrualExpense.aggregate([
            {
                $match: {
                    ...dateQuery,
                    category: { $in: ASSET_CATEGORIES }
                }
            },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const fixedAssets = fixedAssetsAgg.length > 0 ? fixedAssetsAgg[0].total : 0;

        const totalAssets = cashBalance + accountsReceivable + fixedAssets;


        // --- 2. LIABILITIES ---

        // A. Accounts Payable (Unpaid Bills)
        const apAgg = await Payable.aggregate([
            { $match: { balance: { $gt: 0 } } },
            { $group: { _id: null, total: { $sum: '$balance' } } }
        ]);
        const accountsPayable = apAgg.length > 0 ? apAgg[0].total : 0;

        // B. Loans (External Debt)
        // From Settlement where type = 'Loan Movement'
        const loansAgg = await Settlement.aggregate([
            {
                $match: {
                    ...dateQuery,
                    type: 'Loan Movement'
                }
            },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const totalLoans = loansAgg.length > 0 ? loansAgg[0].total : 0;

        const totalLiabilities = accountsPayable + totalLoans;


        // --- 3. EQUITY ---

        // A. Capital (Introduction)
        // From Settlement where type = 'Capital Injection'
        const capitalAgg = await Settlement.aggregate([
            {
                $match: {
                    ...dateQuery,
                    type: 'Capital Injection'
                }
            },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const totalCapital = capitalAgg.length > 0 ? capitalAgg[0].total : 0;

        // B. Retained Earnings
        // Lifetime Revenue - Lifetime Expense (Accrual)
        const totalRevenueAgg = await AccrualRevenue.aggregate([
            { $match: dateQuery },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const totalRevenue = totalRevenueAgg.length > 0 ? totalRevenueAgg[0].total : 0;

        const totalExpenseAgg = await AccrualExpense.aggregate([
            { $match: dateQuery },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const totalExpense = totalExpenseAgg.length > 0 ? totalExpenseAgg[0].total : 0;

        const retainedEarnings = totalRevenue - totalExpense;

        const totalEquity = totalCapital + retainedEarnings;

        // Validation Check
        // Assets = Liabilities + Equity
        const validationParams = {
            assets: totalAssets,
            liabilitiesAndEquity: totalLiabilities + totalEquity,
            difference: totalAssets - (totalLiabilities + totalEquity)
        };

        res.json({
            assets: {
                cash: cashBalance,
                accountsReceivable: accountsReceivable,
                fixedAssets: fixedAssets,
                total: totalAssets
            },
            liabilities: {
                accountsPayable: accountsPayable,
                loans: totalLoans,
                total: totalLiabilities
            },
            equity: {
                capital: totalCapital,
                retainedEarnings: retainedEarnings,
                total: totalEquity
            },
            validation: validationParams
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
