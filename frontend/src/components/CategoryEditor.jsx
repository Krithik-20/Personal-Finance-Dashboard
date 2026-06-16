export default function CategoryEditor({ value, categories, onChange }) {
  return (
    <select className="category-select" value={value} onChange={(event) => onChange(event.target.value)}>
      {categories.map((category) => (
        <option key={category} value={category}>{category}</option>
      ))}
    </select>
  );
}
