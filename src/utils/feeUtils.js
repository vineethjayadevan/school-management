/**
 * Utility functions for fee calculations
 */

export const getFeeStructure = (className) => {
    // This could also be moved here from mockData/feeStructure if we want a single source of truth
    // keeping it simple for now and just focusing on conveyance
    return {
        tuition: 20000,
        materials: 6500
    };
};

/**
 * Calculates a detailed fee breakdown for a student based on their history and active categories.
 * Ported from StudentDetails.jsx for reusability.
 */
export const calculateDetailedFeeBreakdown = (student, feeHistory, activeCategories) => {
    const monthlyConveyance = student.monthlyConveyanceFee ? Number(student.monthlyConveyanceFee) : 0;
    let totalFeeComputed = 0;
    let totalPaidComputed = 0;

    const feeDetails = {
        paid: 0,
        pending: 0,
        totalFee: 0,
        monthlyConveyance: monthlyConveyance,
        breakdown: []
    };

    // Calculate paid per category from history breakdown
    const categoryPaid = {};
    feeHistory.forEach(txn => {
        let txnAmountLeft = txn.amount || 0;
        if (txn.breakdown && txn.breakdown.length > 0) {
            txn.breakdown.forEach(item => {
                let normalizedName = item.feeType?.trim().toLowerCase();
                if (normalizedName) {
                    if (normalizedName.startsWith('vehicle fee')) {
                        normalizedName = 'vehicle fee';
                    }
                    categoryPaid[normalizedName] = (categoryPaid[normalizedName] || 0) + item.amount;
                }
            });
        } else if (txn.feeType || txn.type) {
            let normalizedName = (txn.feeType || txn.type).trim().toLowerCase();
            if (normalizedName.startsWith('vehicle fee')) {
                normalizedName = 'vehicle fee';
            }
            categoryPaid[normalizedName] = (categoryPaid[normalizedName] || 0) + txnAmountLeft;
        }
        totalPaidComputed += (txn.amount || 0);
    });

    const currentClassName = student.className || student.class;
    const studentDiscounts = student.discounts || [];

    activeCategories.forEach(category => {
        const normalizedCatName = category.name.trim().toLowerCase();
        let annualTotal = 0;
        let monthlyAmount = 0;

        if (category.name === 'Conveyance' || category.name === 'Vehicle Fee') {
            return; // Skip, will handle vehicle fee separately
        }
        
        const classSpecific = category.amounts?.find(a => a.className === currentClassName);
        annualTotal = classSpecific ? classSpecific.amount : (category.baseAmount || 0);
        monthlyAmount = annualTotal / (category.months || 10);

        if (annualTotal > 0) {
            const discountEntry = studentDiscounts.find(d =>
                d.categoryId?.toString() === category._id?.toString() ||
                d.categoryName?.toLowerCase() === normalizedCatName
            );
            const discountAmt = discountEntry?.discountAmount || 0;
            const netTotal = Math.max(0, annualTotal - discountAmt);

            totalFeeComputed += netTotal;
            const paidForCat = categoryPaid[normalizedCatName] || 0;
            const pendingForCat = Math.max(0, netTotal - paidForCat);

            feeDetails.breakdown.push({
                id: category._id,
                name: category.name,
                type: category.type,
                total: annualTotal,
                discountAmount: discountAmt,
                netTotal: netTotal,
                paid: paidForCat,
                pending: pendingForCat,
                monthly: monthlyAmount,
                months: category.months || 10
            });
        }
    });

    if (monthlyConveyance > 0) {
        const annualTotal = monthlyConveyance * 10;
        const discountEntry = studentDiscounts.find(d => d.categoryName === 'Vehicle Fee');
        const discountAmt = discountEntry?.discountAmount || 0;
        const netTotal = Math.max(0, annualTotal - discountAmt);
        
        totalFeeComputed += netTotal;
        const paidForCat = categoryPaid['vehicle fee'] || categoryPaid['conveyance'] || 0;
        const pendingForCat = Math.max(0, netTotal - paidForCat);

        feeDetails.breakdown.push({
            id: 'vehicle-fee',
            name: 'Vehicle Fee',
            type: 'Vehicle',
            total: annualTotal,
            discountAmount: discountAmt,
            netTotal: netTotal,
            paid: paidForCat,
            pending: pendingForCat,
            monthly: monthlyConveyance,
            months: 10
        });
    }

    feeDetails.paid = totalPaidComputed;
    feeDetails.totalFee = totalFeeComputed;
    feeDetails.pending = Math.max(0, totalFeeComputed - totalPaidComputed);

    return feeDetails;
};
