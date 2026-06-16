const cardData = [
  { key: 'totalExpenses', label: 'Total Expenses' },
  { key: 'totalIncome', label: 'Total Income' },
  { key: 'netSavings', label: 'Net Savings' },
  { key: 'savingsRate', label: 'Savings Rate' },
  { key: 'topCategory', label: 'Highest Spending Category' },
  { key: 'transactionCount', label: 'Transactions' }
];

export default function DashboardCards({ summary }) {
  return (
    <section className="cards-grid">
      {cardData.map((card) => (
        <article key={card.key} className="summary-card">
          <h3>{card.label}</h3>
          <p>{summary[card.key]}</p>
        </article>
      ))}
    </section>
  );
}
