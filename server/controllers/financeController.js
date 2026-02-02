const Expense = require('../models/Expense');
const OtherIncome = require('../models/OtherIncome');
const Fee = require('../models/Fee');
const IncomeCategory = require('../models/IncomeCategory');
const ExpenseCategory = require('../models/ExpenseCategory');

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

// @desc    Get All Expenses (Filtered)
// @route   GET /api/finance/expenses
// @access  Private
const getExpenses = async (req, res) => {
    try {
        const { userId, category, subcategory, startDate, endDate } = req.query;

        let query = {};

        // User Restriction (or Filter)
        if (userId) {
            query.addedBy = userId;
        }

        // Category Filter
        if (category) {
            query.category = category;
        }

        // Subcategory Filter
        if (subcategory) {
            query.subcategory = subcategory;
        }

        // Date Filter
        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                query.date.$lte = end;
            }
        }

        const expenses = await Expense.find(query).sort({ date: -1, createdAt: -1 }).populate('addedBy', 'name');
        res.json(expenses);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add New Expense
// @route   POST /api/finance/expenses
// @access  Private
const addExpense = async (req, res) => {
    const { title, amount, category, subcategory, description, date, receiptUrl, referenceType, referenceNo } = req.body;

    try {
        const expense = new Expense({
            title: title || `${category} - ${subcategory}`,
            amount,
            category,
            subcategory,
            description,
            date,
            receiptUrl,
            referenceType,
            referenceNo,
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

// @desc    Get All Other Income (Filtered)
// @route   GET /api/finance/income
// @access  Private
const getOtherIncome = async (req, res) => {
    try {
        const { userId, category, startDate, endDate } = req.query;

        let query = {};

        // User Restriction (or Filter)
        if (userId) {
            query.addedBy = userId;
        }

        // Category Filter
        if (category) {
            query.category = category;
        }

        // Date Filter
        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                query.date.$lte = end;
            }
        }

        // Populate is not strictly needed for category string, but kept for user consistency
        const income = await OtherIncome.find(query).sort({ date: -1, createdAt: -1 }).populate('addedBy', 'name');
        res.json(income);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add Other Income
// @route   POST /api/finance/income
// @access  Private
const addOtherIncome = async (req, res) => {
    const { category, amount, description, date, receiptNo } = req.body;

    try {
        const income = new OtherIncome({
            category,
            amount,
            description,
            date,
            receiptNo,
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

// @desc    Get All Income Categories
// @route   GET /api/finance/categories
// @access  Private
const getIncomeCategories = async (req, res) => {
    try {
        const categories = await IncomeCategory.find({ isActive: true });
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add New Income Category
// @route   POST /api/finance/categories
// @access  Private (Admin/Board)
const addIncomeCategory = async (req, res) => {
    const { name, description } = req.body;
    try {
        const category = await IncomeCategory.create({ name, description });
        res.status(201).json(category);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get All Expense Categories
// @route   GET /api/finance/expense-categories
// @access  Private
const getExpenseCategories = async (req, res) => {
    try {
        const categories = await ExpenseCategory.find({ isActive: true });
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add New Expense Category
// @route   POST /api/finance/expense-categories
// @access  Private (Admin/Board)
const addExpenseCategory = async (req, res) => {
    const { name, subcategories, description } = req.body;
    try {
        const category = await ExpenseCategory.create({ name, subcategories, description });
        res.status(201).json(category);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update Expense
// @route   PUT /api/finance/expenses/:id
// @access  Private
const updateExpense = async (req, res) => {
    const { title, amount, category, subcategory, description, date, receiptUrl, referenceType, referenceNo } = req.body;

    try {
        const expense = await Expense.findById(req.params.id);

        if (expense) {
            // Check if user is the one who added it
            if (expense.addedBy.toString() !== req.user._id.toString()) {
                res.status(401);
                throw new Error('Not authorized to edit this record');
            }

            expense.title = title || expense.title;
            expense.amount = amount || expense.amount;
            expense.category = category || expense.category;
            expense.subcategory = subcategory || expense.subcategory;
            expense.description = description || expense.description;
            expense.date = date || expense.date;
            expense.receiptUrl = receiptUrl || expense.receiptUrl;
            expense.referenceType = referenceType || expense.referenceType;
            expense.referenceNo = referenceNo || expense.referenceNo;

            const updatedExpense = await expense.save();
            res.json(updatedExpense);
        } else {
            res.status(404).json({ message: 'Expense not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update Other Income
// @route   PUT /api/finance/income/:id
// @access  Private
const updateOtherIncome = async (req, res) => {
    const { category, amount, description, date, receiptNo } = req.body;

    try {
        const income = await OtherIncome.findById(req.params.id);

        if (income) {
            // Check if user is the one who added it
            if (income.addedBy.toString() !== req.user._id.toString()) {
                res.status(401);
                throw new Error('Not authorized to edit this record');
            }

            income.category = category || income.category;
            income.amount = amount || income.amount;
            income.description = description || income.description;
            income.date = date || income.date;
            income.receiptNo = receiptNo || income.receiptNo;

            const updatedIncome = await income.save();
            res.json(updatedIncome);
        } else {
            res.status(404).json({ message: 'Income record not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get Filtered Transactions (Income & Expenses)
// @route   GET /api/finance/transactions
// @access  Private
const getTransactions = async (req, res) => {
    try {
        const { startDate, endDate, type, userId, category, subcategory } = req.query;

        let query = {};

        // Date Filter
        if (startDate || endDate) {
            query.date = {};
            if (startDate) query.date.$gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                query.date.$lte = end;
            }
        }

        // User Filter
        if (userId) {
            query.addedBy = userId;
        }

        // Category Filter
        if (category) {
            query.category = category;
        }

        let expenses = [];
        let income = [];

        // Fetch Date based on Type
        // If 'subcategory' is present, it only applies to Expenses.
        // If 'subcategory' is present, Income should return nothing (as it has no subcategories).
        // Therefore, we only run Income query if NO subcategory is specified.

        if (!type || type === 'all' || type === 'expense') {
            const expenseQuery = { ...query };
            if (subcategory) {
                expenseQuery.subcategory = subcategory;
            }
            expenses = await Expense.find(expenseQuery).populate('addedBy', 'name');
        }

        if ((!type || type === 'all' || type === 'income') && !subcategory) {
            // Income query uses base query (with category) but no subcategory
            income = await OtherIncome.find(query).populate('addedBy', 'name');
        }

        // Add 'type' field and merge
        const expensesWithType = expenses.map(e => ({ ...e.toObject(), type: 'expense' }));
        const incomeWithType = income.map(i => ({ ...i.toObject(), type: 'income' }));

        const combined = [...expensesWithType, ...incomeWithType].sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            if (dateA.getTime() !== dateB.getTime()) {
                return dateB - dateA;
            }
            // Tie-breaker: createdAt
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

        res.json(combined);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Shareholder Data (Net Worth, Share Value, Members)
// @route   GET /api/finance/shareholders
// @access  Private (Board Member)
// @desc    Get Shareholder Data (Net Worth, Share Value, Members)
// @route   GET /api/finance/shareholders
// @access  Private (Board Member)
const getShareholdersData = async (req, res) => {
    try {
        // 1. Calculate Net Worth
        const feeIncomeAgg = await Fee.aggregate([
            { $match: { status: 'Paid' } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const totalFeeIncome = feeIncomeAgg.length > 0 ? feeIncomeAgg[0].total : 0;

        const otherIncomeAgg = await OtherIncome.aggregate([
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const totalOtherIncome = otherIncomeAgg.length > 0 ? otherIncomeAgg[0].total : 0;

        const expenseAgg = await Expense.aggregate([
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const totalExpenses = expenseAgg.length > 0 ? expenseAgg[0].total : 0;

        const totalIncome = totalFeeIncome + totalOtherIncome;
        const netWorth = totalIncome - totalExpenses;

        // 2. Get Individual Investments & Total Capital
        // Aggregate amounts where category is 'Investment by board members'
        const investmentAgg = await OtherIncome.aggregate([
            { $match: { category: 'Investment by board members' } },
            { $group: { _id: '$addedBy', totalInvested: { $sum: '$amount' } } }
        ]);

        const totalCapitalInvested = investmentAgg.reduce((acc, curr) => acc + curr.totalInvested, 0);

        // 3. Calculate Operational Income (Fees + Non-Investment Income)
        // We essentially take Total Income (Fee + Other) and subtract Capital
        const totalIncomeReceived = totalIncome - totalCapitalInvested;

        // 4. Verify Net Worth Logic (Should match user formula)
        // NET WORTH = Total Capital Invested + Total Income Received - Total Expenses Paid
        const calculatedNetWorth = totalCapitalInvested + totalIncomeReceived - totalExpenses;

        // 5. Get Board Members
        const shareholdersDoc = await require('../models/User').find({ role: 'board_member' }).select('-password');
        const totalShareholders = shareholdersDoc.length;

        // 6. Calculate Share Value
        const shareValue = totalShareholders > 0 ? (calculatedNetWorth / totalShareholders) : 0;

        // 7. Create Investment Map
        const investmentMap = {};
        investmentAgg.forEach(item => {
            if (item._id) investmentMap[item._id.toString()] = item.totalInvested;
        });

        // 8. Enhance Shareholder Data
        const shareholders = shareholdersDoc.map(member => {
            const invested = investmentMap[member._id.toString()] || 0;
            return {
                ...member.toObject(),
                investedAmount: invested
            };
        });

        res.json({
            netWorth: calculatedNetWorth,
            components: {
                capitalInvested: totalCapitalInvested,
                incomeReceived: totalIncomeReceived,
                expensesPaid: totalExpenses
            },
            totalShareholders,
            shareValue,
            shareholders
        });

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
    deleteOtherIncome,
    getIncomeCategories,
    addIncomeCategory,
    getExpenseCategories,
    addExpenseCategory,
    updateExpense,
    updateOtherIncome,
    getTransactions,
    getShareholdersData
};
