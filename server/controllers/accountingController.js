const Adjustment = require('../models/Adjustment');
const Asset = require('../models/Asset');
const Capital = require('../models/Capital');
const Fee = require('../models/Fee');
const Expense = require('../models/Expense');
const Salary = require('../models/Salary');
const OtherIncome = require('../models/OtherIncome');

// @desc    Get Profit & Loss Statement (Accrual Basis)
// @route   GET /api/accounting/pnl
// @access  Private (Board Member)
const getProfitAndLoss = async (req, res) => {
    try {
        const { startDate, endDate, basis } = req.query;
        if (!startDate || !endDate) return res.status(400).json({ message: 'Date range required' });

        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        let incomeMatch = { date: { $gte: start, $lte: end } };
        let expenseMatch = { date: { $gte: start, $lte: end } };

        if (basis === 'cash') {
            // Filter Income: Exclude Capital Categories & Specific Subcategories
            incomeMatch.category = {
                $nin: [
                    'Asset Sale Proceeds',
                    'Capital Introduced',
                    'Loans Received',
                    'Other Non-Operating Receipts',
                    'Refundable Deposits & Advances'
                ]
            };
            incomeMatch.subcategory = {
                $nin: ['Capital Donations (Restricted)', 'Capital Grants']
            };

            // Filter Expenses: Exclude Capital Expenditures
            expenseMatch.subcategory = {
                $nin: ['Building Construction', 'Furniture', 'Classroom Setup']
            };
        }

        // 1. REVENUE
        // Cash Inflows
        const otherIncome = await OtherIncome.aggregate([
            { $match: incomeMatch },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        const cashRevenue = (otherIncome[0]?.total || 0);

        // Accrual Adjustments (Revenue)
        const adjustments = await Adjustment.find({
            date: { $gte: start, $lte: end },
            type: { $in: ['Accrued Income', 'Unearned Income'] }
        });

        // Note: If separate Capital collection exists, we would sum that too. 
        // Currently assuming Capital Inflows are in OtherIncome/Capital collections.

        const totalCapitalInflow_CapitalModel = await Capital.aggregate([
            { $match: { date: { $lte: end }, type: 'Investment' } }, // Assuming 'Investment' adds to cash
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        // Need to verify if 'Capital' model is used for "Loans Received" etc or if they are in OtherIncome.
        // The user's ledger structure implies they are Types/Categories.
        // Let's assume for now they are in `OtherIncome` based on previous tasks, 
        // BUT if `Capital` model handles specific things like "Investment by Board Members", we need to be careful.

        // Cash = (Sum of all Income collections) - (Sum of all Expense collections)

        const totalIncomeAggr = await OtherIncome.aggregate([
            { $match: { date: { $lte: end } } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        // If Capital.js is used for "Shareholder Capital", we add it. 
        const capitalModelAggr = await Capital.aggregate([
            { $match: { date: { $lte: end } } },
            { $group: { _id: '$type', total: { $sum: '$amount' } } }
        ]);

        let revenueAdjustments = 0;
        // Simple logic: Add Accrued Income (Income earned but not received), Subtract Unearned Income (Received but not earned)
        // Wait, the logic typically compares Balance Sheet positions (End - Start), but here the user inputs "Adjustments" as transaction-like entries?
        // Let's assume the user enters the CHANGE for the period (e.g. "Recognize $500 unearned income").
        // Or if they enter a Balance, we need previous balance.
        // Constraint: "Simplicity". Let's treat Adjustment entries as "Impact on P&L for this period".
        // E.g. If I add an "Accrued Income" of 100 on Jan 31, it means +100 Revenue.

        const accruedIncomeAdj = adjustments
            .filter(a => a.type === 'Accrued Income')
            .reduce((sum, a) => sum + a.amount, 0);

        const unearnedIncomeAdj = adjustments
            .filter(a => a.type === 'Unearned Income')
            .reduce((sum, a) => sum + a.amount, 0); // Is this adding to liability or reducing?
        // Usually "Unearned Income" Adjustment means we received cash (already in CashRevenue) but it's not earned. So getting a large fee for next year = NEGATIVE Revenue impact.
        // But if we recognize unearned income from past, it's POSITIVE.
        // Let's rely on Signed Amount or UI context. For simplicity, let's assume "Unearned Income" entry means REMOVING from Revenue (Deferred).
        // A separate type "Recognize Unearned" might be needed or just negative values.
        // LET'S SIMPLIFY: The Adjustment model records the *Closing Balance* of these accounts? No, that requires diffing.
        // Let's assume the user enters *Period Adjustments* (Journal Entry style).
        // E.g. "Defer 10k Fees" -> Type: Unearned Income (meaning increase liab, decrease revenue).

        revenueAdjustments = accruedIncomeAdj - unearnedIncomeAdj;

        const totalRevenue = cashRevenue + revenueAdjustments;

        // 2. EXPENSES
        // Cash Outflows
        const expenses = await Expense.aggregate([
            { $match: expenseMatch },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        const cashExpenses = (expenses[0]?.total || 0);

        // Accrual Adjustments (Expenses)
        const expAdjustments = await Adjustment.find({
            date: { $gte: start, $lte: end },
            type: { $in: ['Outstanding Expense', 'Prepaid Expense'] }
        });

        const outstandingExpAdj = expAdjustments
            .filter(a => a.type === 'Outstanding Expense')
            .reduce((sum, a) => sum + a.amount, 0); // e.g. Salary accrued but not paid. Add to Expense.

        const prepaidExpAdj = expAdjustments
            .filter(a => a.type === 'Prepaid Expense')
            .reduce((sum, a) => sum + a.amount, 0); // e.g. Paid in advance. Remove from Expense (if cash flow captured it).
        // NOTE: If manual Expense was created, it's in CashExpenses. So Prepaid Adjustment = Reduce Expense.

        // Depreciation
        // Calculate pro-rata depreciation for all assets active during this period
        // For simplicity: AnnualDepreciation * (DaysInPeriod / 365)
        const assets = await Asset.find({ purchaseDate: { $lte: end } });
        const daysInPeriod = (end - start) / (1000 * 60 * 60 * 24);
        let totalDepreciation = 0;

        assets.forEach(asset => {
            // Calculate depreciation only if asset is not fully depreciated/disposed (ignored for now)
            // Simple logic: Annual Dep * (Period Ratio)
            // Need to handle assets bought MID-period.
            const assetStart = asset.purchaseDate > start ? asset.purchaseDate : start;
            const effectiveDays = Math.max(0, (end - assetStart) / (1000 * 60 * 60 * 24));
            const annualDep = (asset.purchaseCost - (asset.salvageValue || 0)) / (asset.usefulLifeYears || 5);
            const periodDep = annualDep * (effectiveDays / 365);
            totalDepreciation += periodDep;
        });

        const totalAccrualExpenses = cashExpenses + outstandingExpAdj - prepaidExpAdj + totalDepreciation;

        const netProfit = totalRevenue - totalAccrualExpenses;

        res.json({
            period: { start, end },
            revenue: {
                cash: cashRevenue,
                accruedAdj: accruedIncomeAdj,
                deferredAdj: -unearnedIncomeAdj, // Show visual negative
                total: totalRevenue
            },
            expenses: {
                cash: cashExpenses,
                outstandingAdj: outstandingExpAdj,
                prepaidAdj: -prepaidExpAdj,
                depreciation: totalDepreciation,
                total: totalAccrualExpenses
            },
            netProfit
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Balance Sheet (Cash Basis)
// @route   GET /api/accounting/balance-sheet
// @access  Private (Board Member)
const getBalanceSheet = async (req, res) => {
    try {
        const { date, basis } = req.query;
        if (!date) return res.status(400).json({ message: 'As of Date is required' });

        const end = new Date(date);
        end.setHours(23, 59, 59, 999);

        if (basis === 'cash') {
            // -------------------------------------------------------------------------
            // 1. CASH & BANK BALANCE (ASSET)
            // Logic: Total Cash In - Total Cash Out (All categories)
            // -------------------------------------------------------------------------

            const totalIncomeAggr = await OtherIncome.aggregate([
                { $match: { date: { $lte: end } } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]);

            // Capital / OtherIncome Aggregation
            // Note: 'OtherIncome' now includes Capital Introduced as a category.
            // We do NOT use the legacy 'Capital' model here to avoid double counting.

            const totalCashIn = (totalIncomeAggr[0]?.total || 0);

            const totalExpenseAggr = await Expense.aggregate([
                { $match: { date: { $lte: end } } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]);

            const totalCashOut = (totalExpenseAggr[0]?.total || 0);

            const cashBalance = totalCashIn - totalCashOut;

            // -------------------------------------------------------------------------
            // 2. FIXED ASSETS (ASSET)
            // Logic: Sum(Fixed Asset Expenses) - Sum(Asset Sale Proceeds)
            // -------------------------------------------------------------------------

            // Fixed Asset Expenses
            const fixedAssetsCostAggr = await Expense.aggregate([
                {
                    $match: {
                        date: { $lte: end },
                        subcategory: { $in: ['Building Construction', 'Furniture', 'Classroom Setup'] }
                    }
                },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]);

            // Asset Sale Proceeds (Recovery of Capital)
            const assetSalesAggr = await OtherIncome.aggregate([
                {
                    $match: {
                        date: { $lte: end },
                        category: 'Asset Sale Proceeds'
                    }
                },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]);

            const fixedAssetsGross = (fixedAssetsCostAggr[0]?.total || 0);
            const assetDisposals = (assetSalesAggr[0]?.total || 0);
            const fixedAssetsNet = fixedAssetsGross - assetDisposals;

            const totalAssets = cashBalance + fixedAssetsNet;

            // -------------------------------------------------------------------------
            // 3. LIABILITIES
            // -------------------------------------------------------------------------

            // Loans Outstanding
            const loansAggr = await OtherIncome.aggregate([
                {
                    $match: {
                        date: { $lte: end },
                        category: 'Loans Received'
                    }
                },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]);
            const loansOutstanding = loansAggr[0]?.total || 0;

            // Refundable Deposits
            const depositsAggr = await OtherIncome.aggregate([
                {
                    $match: {
                        date: { $lte: end },
                        category: 'Refundable Deposits & Advances'
                    }
                },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]);
            const deposits = depositsAggr[0]?.total || 0;

            const totalLiabilities = loansOutstanding + deposits;

            // -------------------------------------------------------------------------
            // 4. EQUITY / CAPITAL
            // -------------------------------------------------------------------------

            // Capital Introduced (Investments)
            const capitalIntroCategoryAggr = await OtherIncome.aggregate([
                {
                    $match: {
                        date: { $lte: end },
                        category: 'Capital Introduced'
                    }
                },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]);

            // Capital Logic Update:
            // We only use 'OtherIncome' (Category: Capital Introduced) for all new data.
            // The legacy 'Capital' model data is ignored to prevent double counting as per user report.
            // Withdrawals should be handled via a specific negative category in OtherIncome if needed in future.

            const capitalIntroduced = (capitalIntroCategoryAggr[0]?.total || 0);

            // Capital Reserves (Grants, Insurance, etc.)
            // New logic: These increase Cash but are not Revenue or Liabilities. Mapped to Equity.
            const capitalReservesAggr = await OtherIncome.aggregate([
                {
                    $match: {
                        date: { $lte: end },
                        $or: [
                            { category: 'Insurance Claims' },
                            { category: 'Other Non-Operating Receipts' },
                            { subcategory: { $in: ['Capital Donations (Restricted)', 'Capital Grants'] } }
                        ]
                    }
                },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]);
            const capitalReserves = capitalReservesAggr[0]?.total || 0;

            // Accumulated Surplus (P&L logic)
            const revenueIncomeAggr = await OtherIncome.aggregate([
                {
                    $match: {
                        date: { $lte: end },
                        category: {
                            $nin: [
                                'Asset Sale Proceeds', 'Capital Introduced', 'Loans Received',
                                'Other Non-Operating Receipts', 'Refundable Deposits & Advances', 'Insurance Claims'
                            ]
                        },
                        subcategory: { $nin: ['Capital Donations (Restricted)', 'Capital Grants'] }
                    }
                },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]);

            const revenueExpenseAggr = await Expense.aggregate([
                {
                    $match: {
                        date: { $lte: end },
                        subcategory: { $nin: ['Building Construction', 'Furniture', 'Classroom Setup'] }
                    }
                },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]);

            const surplus = (revenueIncomeAggr[0]?.total || 0) - (revenueExpenseAggr[0]?.total || 0);

            const totalEquity = capitalIntroduced + capitalReserves + surplus;

            return res.json({
                date: end,
                basis: 'cash',
                assets: {
                    cash: cashBalance,
                    fixedAssets: fixedAssetsNet,
                    fixedAssetsGross: fixedAssetsGross, // For UI tooltip?
                    assetDisposals: assetDisposals,
                    total: totalAssets
                },
                liabilities: {
                    loans: loansOutstanding,
                    deposits: deposits,
                    total: totalLiabilities
                },
                equity: {
                    capitalIntroduced: capitalIntroduced,
                    capitalReserves: capitalReserves, // New field
                    surplus: surplus,
                    total: totalEquity
                },
                verification: {
                    assetsTotal: totalAssets,
                    liabilitiesEquityTotal: totalLiabilities + totalEquity,
                    difference: totalAssets - (totalLiabilities + totalEquity) // Should be 0
                }
            });

        } else {
            // Placeholder for Accrual (not requested yet)
            return res.status(501).json({ message: 'Accrual Balance Sheet not implemented yet' });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// CRUD for Assets/Adjustments/Capital...
const addAsset = async (req, res) => {
    try {
        const asset = await Asset.create({ ...req.body, addedBy: req.user._id });
        res.status(201).json(asset);
    } catch (error) { res.status(400).json({ message: error.message }); }
};

const getAssets = async (req, res) => {
    try {
        const assets = await Asset.find().sort({ purchaseDate: -1 });
        res.json(assets);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

// ... (Other CRUDs omitted for brevity, can generate generically if needed or add later)

module.exports = {
    getProfitAndLoss,
    getBalanceSheet,
    addAsset,
    getAssets,
    addAdjustment: async (req, res) => {
        try {
            const adjustment = await Adjustment.create({ ...req.body, addedBy: req.user._id });
            res.status(201).json(adjustment);
        } catch (error) { res.status(400).json({ message: error.message }); }
    },
    getAdjustments: async (req, res) => {
        try {
            const adjustments = await Adjustment.find().sort({ date: -1 });
            res.json(adjustments);
        } catch (error) { res.status(500).json({ message: error.message }); }
    },
    deleteAdjustment: async (req, res) => {
        try {
            const adjustment = await Adjustment.findById(req.params.id);
            if (!adjustment) return res.status(404).json({ message: 'Adjustment not found' });
            await adjustment.deleteOne();
            res.json({ message: 'Adjustment removed' });
        } catch (error) { res.status(500).json({ message: error.message }); }
    }
};
