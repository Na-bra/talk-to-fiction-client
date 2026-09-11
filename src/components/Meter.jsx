/**
 * A 0–100 bar. `caution` axes (suspicion, fear) fill in a warmer tone, and a
 * rise on them reads as bad news in the delta.
 */
export default function Meter({ label, value = 0, caution = false, delta }) {
  const width = Math.max(0, Math.min(100, value));
  const good = delta > 0 !== caution;
  return (
    <div className={`meter ${caution ? 'meter-caution' : ''}`}>
      <div className="meter-top">
        <span className="meter-label">{label}</span>
        <span className="meter-end">
          {delta ? (
            <span className={`meter-delta ${good ? 'is-good' : 'is-bad'}`} key={`${value}${delta}`}>
              {delta > 0 ? '+' : '−'}
              {Math.abs(delta)}
            </span>
          ) : null}
          <span className="meter-value">{value}</span>
        </span>
      </div>
      <div
        className="meter-track"
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
      >
        <span className="meter-fill" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}
