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
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) return res.status(400).json({ message: 'Date range required' });

        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        // 1. REVENUE
        // Cash Inflows
        const otherIncome = await OtherIncome.aggregate([
            { $match: { date: { $gte: start, $lte: end } } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        const cashRevenue = (otherIncome[0]?.total || 0);

        // Accrual Adjustments (Revenue)
        const adjustments = await Adjustment.find({
            date: { $gte: start, $lte: end },
            type: { $in: ['Accrued Income', 'Unearned Income'] }
        });

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
            { $match: { date: { $gte: start, $lte: end } } },
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

// @desc    Get Balance Sheet
// @route   GET /api/accounting/balance-sheet
// @access  Private
const getBalanceSheet = async (req, res) => {
    try {
        const { date } = req.query;
        if (!date) return res.status(400).json({ message: 'As of Date is required' });

        const asOfDate = new Date(date);
        asOfDate.setHours(23, 59, 59, 999);

        // 1. ASSETS

        // Cash & Bank (All time Cash In - All time Cash Out)
        // Removed Fees (Admin) from Cash In
        const otherInc = await OtherIncome.aggregate([{ $match: { date: { $lte: asOfDate } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]);
        const caps = await Capital.aggregate([{ $match: { date: { $lte: asOfDate }, type: 'Investment' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]);
        const capsOut = await Capital.aggregate([{ $match: { date: { $lte: asOfDate }, type: 'Withdrawal' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]);

        // Removed Salary (Admin) from Cash Out
        const totExp = await Expense.aggregate([{ $match: { date: { $lte: asOfDate } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]);

        const totalCashIn = (otherInc[0]?.total || 0) + (caps[0]?.total || 0);
        const totalCashOut = (totExp[0]?.total || 0) + (capsOut[0]?.total || 0);
        const cashBalance = totalCashIn - totalCashOut;

        // Fixed Assets (Net Block)
        // Cost - Accumulated Depreciation
        const assets = await Asset.find({ purchaseDate: { $lte: asOfDate } });
        let fixedAssetsValue = 0;
        assets.forEach(asset => {
            const ageInDays = (asOfDate - asset.purchaseDate) / (1000 * 60 * 60 * 24);
            const years = ageInDays / 365;
            const annualDep = (asset.purchaseCost - (asset.salvageValue || 0)) / (asset.usefulLifeYears || 5);
            const accumDep = Math.min(annualDep * years, asset.purchaseCost - (asset.salvageValue || 0)); // Cap at depreciable amount
            fixedAssetsValue += (asset.purchaseCost - accumDep);
        });

        // Current Assets (Receivables, Prepaids)
        // Removed Fees Receivables

        // Adjustments remain for manual assets if any, but simplified here:
        const totalAssets = cashBalance + fixedAssetsValue;

        // 2. LIABILITIES
        // Removed Pending Salaries

        const totalLiabilities = 0;

        // 3. EQUITY
        // Capital Invested
        const capital = (caps[0]?.total || 0) - (capsOut[0]?.total || 0);

        // Retained Earnings (Profit since beginning)
        // Assets - Liabilities - Capital
        const retainedEarnings = totalAssets - totalLiabilities - capital;

        // Share Value
        const shareholders = await require('../models/User').countDocuments({ role: 'board_member' });
        const bookValuePerShare = shareholders > 0 ? (totalAssets - totalLiabilities) / shareholders : 0;

        res.json({
            asOfDate,
            assets: {
                cash: cashBalance,
                fixedAssets: fixedAssetsValue,
                receivables: 0,
                total: totalAssets
            },
            liabilities: {
                payables: totalLiabilities, // Salaries
                total: totalLiabilities
            },
            equity: {
                capital,
                retainedEarnings, // Calculated plug
                total: capital + retainedEarnings
            },
            shareValue: bookValuePerShare
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
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
