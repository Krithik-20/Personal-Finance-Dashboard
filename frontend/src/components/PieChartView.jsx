import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = ['#4f46e5', '#0ea5e9', '#22c55e', '#f97316', '#e11d48', '#14b8a6', '#f59e0b', '#7c3aed', '#0f766e', '#ef4444', '#8b5cf6', '#64748b'];

export default function PieChartView({ data }) {
  const chartData = Object.entries(data).map(([name, amount]) => ({ name, value: amount })).filter((entry) => entry.value > 0);

  return (
    <section className="chart-card">
      <div className="panel-heading">
        <h2>Expense by Category</h2>
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <PieChart>
          <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4}>
            {chartData.map((entry, index) => (
              <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => [`$${value.toFixed(2)}`, 'Amount']} />
          <Legend verticalAlign="bottom" height={36} />
        </PieChart>
      </ResponsiveContainer>
    </section>
  );
}
