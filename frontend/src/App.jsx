import { useMemo, useState } from 'react';
import Header from './components/Header.jsx';
import CSVUpload from './components/CSVUpload.jsx';
import DashboardCards from './components/DashboardCards.jsx';
import TransactionTable from './components/TransactionTable.jsx';
import PieChartView from './components/PieChartView.jsx';
import TrendChart from './components/TrendChart.jsx';
import SavingsChart from './components/SavingsChart.jsx';
import AIInsights from './components/AIInsights.jsx';
import { categories } from './utils/constants.js';
import { getSummaryMetrics, getChartData, getInsightsText } from './utils/analytics.js';

function App() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const onUploadSuccess = (items) => {
    setSuccessMessage('CSV uploaded and parsed successfully.');
    setErrorMessage('');
    setTransactions(items);
  };

  const onError = (message) => {
    setErrorMessage(message);
    setSuccessMessage('');
  };

  const handleCategorize = async (items) => {
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('Categorizing transactions...');
    try {
      const response = await fetch('/api/categorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions: items })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to categorize transactions.');
      }
      setTransactions(data.transactions);
      setSuccessMessage('AI categorization completed successfully.');
      setErrorMessage('');
    } catch (error) {
      setErrorMessage(error.message);
      setSuccessMessage('');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (index, category) => {
    const updated = transactions.map((item, idx) =>
      idx === index ? { ...item, category } : item
    );
    setTransactions(updated);
  };

  const summary = useMemo(() => getSummaryMetrics(transactions), [transactions]);
  const charts = useMemo(() => getChartData(transactions), [transactions]);
  const insights = useMemo(() => getInsightsText(charts.categoryTotals, summary), [charts.categoryTotals, summary]);

  return (
    <div className="app-shell">
      <Header />
      <main>
        <CSVUpload
          onSuccess={onUploadSuccess}
          onError={onError}
          onCategorize={handleCategorize}
          loading={loading}
          transactions={transactions}
        />

        {errorMessage && <div className="alert alert-error">{errorMessage}</div>}
        {successMessage && <div className="alert alert-success">{successMessage}</div>}

        {transactions.length > 0 && (
          <>
            <DashboardCards summary={summary} />
            <div className="dashboard-grid">
              <PieChartView data={charts.categoryTotals} />
              <TrendChart data={charts.monthlyTotals} />
              <SavingsChart data={charts.savingsData} />
            </div>
            <AIInsights text={insights} />
            <TransactionTable
              transactions={transactions}
              categories={categories}
              onCategoryChange={handleCategoryChange}
            />
          </>
        )}
      </main>
    </div>
  );
}

export default App;
