import CategoryEditor from './CategoryEditor.jsx';

export default function TransactionTable({ transactions, categories, onCategoryChange }) {
  return (
    <section className="transactions-panel">
      <div className="panel-heading">
        <h2>Transactions</h2>
      </div>
      <div className="table-responsive">
        <table className="transactions-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Amount</th>
              <th>Category</th>
              <th>Reason</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx, index) => (
              <tr key={`${tx.date}-${tx.description}-${tx.amount}-${index}`}>
                <td>{tx.date}</td>
                <td>{tx.description || 'Unknown merchant'}</td>
                <td className={tx.amount < 0 ? 'negative' : 'positive'}>{tx.amount.toFixed(2)}</td>
                <td>
                  <CategoryEditor
                    value={tx.category || 'Other'}
                    categories={categories}
                    onChange={(value) => onCategoryChange(index, value)}
                  />
                </td>
                <td>{tx.reason || 'AI suggested category'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
