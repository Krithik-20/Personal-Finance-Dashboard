const formatCurrency = (value) => `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const getSummaryMetrics = (transactions) => {
  const totalIncome = transactions
    .filter((tx) => tx.amount > 0)
    .reduce((sum, tx) => sum + tx.amount, 0);
  const totalExpenses = transactions
    .filter((tx) => tx.amount < 0)
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
  const netSavings = totalIncome - totalExpenses;
  const savingsRate = totalIncome === 0 ? 0 : Math.round((netSavings / totalIncome) * 100);
  const categoryTotals = transactions.reduce((acc, tx) => {
    const category = tx.category || 'Other';
    acc[category] = (acc[category] || 0) + Math.abs(tx.amount);
    return acc;
  }, {});
  const topCategory = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Other';

  return {
    totalExpenses: formatCurrency(totalExpenses),
    totalIncome: formatCurrency(totalIncome),
    netSavings: formatCurrency(netSavings),
    savingsRate: `${savingsRate}%`,
    topCategory,
    transactionCount: transactions.length
  };
};

export const getChartData = (transactions) => {
  const categoryTotals = transactions.reduce((acc, tx) => {
    const category = tx.category || 'Other';
    acc[category] = (acc[category] || 0) + Math.abs(tx.amount);
    return acc;
  }, {});

  const monthlyTotals = transactions.reduce((acc, tx) => {
    const [year, month] = tx.date.split('-');
    const monthKey = `${year}-${month}`;
    acc[monthKey] = (acc[monthKey] || 0) + Math.abs(tx.amount);
    return acc;
  }, {});

  const savingsData = Object.entries(monthlyTotals).map(([month, amount]) => ({ month, savings: Math.max(0, amount * 0.25) }));

  return {
    categoryTotals,
    monthlyTotals: Object.entries(monthlyTotals).map(([month, amount]) => ({ month, amount })),
    savingsData
  };
};

export const getInsightsText = (categoryTotals, summary) => {
  const total = Object.values(categoryTotals).reduce((sum, value) => sum + value, 0);
  const sorted = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
  if (!sorted.length) {
    return 'Upload transactions to view smart AI insights and spending patterns.';
  }
  const [top, second] = sorted;
  const pieces = [`Most spending occurred in ${top[0]} (${Math.round((top[1] / total) * 100)}%).`];
  if (second) {
    pieces.push(`${second[0]} was the second largest category.`);
  }
  pieces.push('Monitor category updates to keep your budget on track.');
  return pieces.join(' ');
};
