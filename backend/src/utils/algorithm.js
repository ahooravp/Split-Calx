// We export these functions so our routes can use them!

function getNetBalances(expenses) {
    const balances = {};

    expenses.forEach(receipt => {
        const payer = receipt.payerId;
        
        // Add the total amount to the payer's balance (they are owed this money)
        balances[payer] = (balances[payer] || 0) + receipt.totalAmount;

        // Subtract what everyone owes from their balances
        receipt.splits.forEach(split => {
            const borrower = split.userId;
            balances[borrower] = (balances[borrower] || 0) - split.amountOwed;
        });
    });

    // Clean up any tiny decimals caused by JavaScript floating point math
    for (let user in balances) {
        balances[user] = Math.round(balances[user] * 100) / 100;
    }

    return balances;
}

function simplifyDebts(netBalances) {
    const debtors = [];   
    const creditors = []; 

    for (const [userId, balance] of Object.entries(netBalances)) {
        if (balance < 0) {
            debtors.push({ userId, amount: Math.abs(balance) });
        } else if (balance > 0) {
            creditors.push({ userId, amount: balance });
        }
    }

    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    const transactions = [];
    let i = 0; 
    let j = 0; 

    while (i < debtors.length && j < creditors.length) {
        const debtor = debtors[i];
        const creditor = creditors[j];

        const settlementAmount = Math.min(debtor.amount, creditor.amount);

        transactions.push({
            from: debtor.userId,
            to: creditor.userId,
            amount: settlementAmount
        });

        debtor.amount -= settlementAmount;
        creditor.amount -= settlementAmount;

        if (debtor.amount < 0.01) i++;
        if (creditor.amount < 0.01) j++;
    }

    return transactions;
}

module.exports = { getNetBalances, simplifyDebts };