export default function Field({ label, value }) {
  return (
    <div className="field">
      <span className="label">{label}</span>
      {value ? <p>{value}</p> : <p className="none">Not recorded.</p>}
    </div>
  );
}
