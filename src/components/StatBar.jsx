export default function StatBar({ name, value, warn = false }) {
  return (
    <div className="stat">
      <div className="stat-top">
        <span>{name}</span>
        <b>{value}</b>
      </div>
      <div className={warn ? 'bar warn' : 'bar'}>
        <i style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </div>
    </div>
  );
}
