export default function AIInsights({ text }) {
  return (
    <section className="insights-card">
      <div className="panel-heading">
        <h2>AI Insights</h2>
      </div>
      <p>{text}</p>
    </section>
  );
}
