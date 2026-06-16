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
const API_URL = import.meta.env.VITE_API_URL;

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

 const handleCategorize = async (items) => {
  setLoading(true);
  setErrorMessage('');
  setSuccessMessage('Categorizing transactions...');

  try {
    const response = await fetch(`${API_URL}/api/categorize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
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
}

export default App;
