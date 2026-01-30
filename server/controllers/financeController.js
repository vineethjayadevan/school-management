const Expense = require('../models/Expense');
const OtherIncome = require('../models/OtherIncome');
const Fee = require('../models/Fee');

// @desc    Get Financial Summary (Income vs Expense)
// @route   GET /api/finance/summary
// @access  Private (Board Member/Admin)
const getFinancialSummary = async (req, res) => {
    try {
        // 1. Calculate Total Fee Income (Only 'Paid' status)
        const feeIncomeAgg = await Fee.aggregate([
            { $match: { status: 'Paid' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const totalFeeIncome = feeIncomeAgg.length > 0 ? feeIncomeAgg[0].total : 0;

        // 2. Calculate Total Other Income
        const otherIncomeAgg = await OtherIncome.aggregate([
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const totalOtherIncome = otherIncomeAgg.length > 0 ? otherIncomeAgg[0].total : 0;

        // 3. Calculate Total Expenses
        const expenseAgg = await Expense.aggregate([
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const totalExpenses = expenseAgg.length > 0 ? expenseAgg[0].total : 0;

        const totalIncome = totalFeeIncome + totalOtherIncome;
        const netBalance = totalIncome - totalExpenses;

        res.json({
            totalIncome,
            totalFeeIncome,
            totalOtherIncome,
            totalExpenses,
            netBalance
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get All Expenses
// @route   GET /api/finance/expenses
// @access  Private
const getExpenses = async (req, res) => {
    try {
        const expenses = await Expense.find().sort({ date: -1 }).populate('addedBy', 'name');
        res.json(expenses);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add New Expense
// @route   POST /api/finance/expenses
// @access  Private
const addExpense = async (req, res) => {
    const { title, amount, category, description, date, receiptUrl } = req.body;

    try {
        const expense = new Expense({
            title,
            amount,
            category,
            description,
            date,
            receiptUrl,
            addedBy: req.user._id
        });

        const createdExpense = await expense.save();
        res.status(201).json(createdExpense);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete Expense
// @route   DELETE /api/finance/expenses/:id
// @access  Private
const deleteExpense = async (req, res) => {
    try {
        const expense = await Expense.findById(req.params.id);

        if (expense) {
            await expense.deleteOne();
            res.json({ message: 'Expense removed' });
        } else {
            res.status(404).json({ message: 'Expense not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get All Other Income
// @route   GET /api/finance/income
// @access  Private
const getOtherIncome = async (req, res) => {
    try {
        const income = await OtherIncome.find().sort({ date: -1 }).populate('addedBy', 'name');
        res.json(income);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add Other Income
// @route   POST /api/finance/income
// @access  Private
const addOtherIncome = async (req, res) => {
    const { title, amount, source, description, date } = req.body;

    try {
        const income = new OtherIncome({
            title,
            amount,
            source,
            description,
            date,
            addedBy: req.user._id
        });

        const createdIncome = await income.save();
        res.status(201).json(createdIncome);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete Other Income
// @route   DELETE /api/finance/income/:id
// @access  Private
const deleteOtherIncome = async (req, res) => {
    try {
        const income = await OtherIncome.findById(req.params.id);

        if (income) {
            await income.deleteOne();
            res.json({ message: 'Income record removed' });
        } else {
            res.status(404).json({ message: 'Income record not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getFinancialSummary,
    getExpenses,
    addExpense,
    deleteExpense,
    getOtherIncome,
    addOtherIncome,
    deleteOtherIncome
};
