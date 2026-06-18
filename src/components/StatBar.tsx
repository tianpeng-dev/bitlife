export function StatBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="stat-bar">
      <div className="stat-bar__label">
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <div className="stat-bar__track">
        <div className="stat-bar__fill" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
