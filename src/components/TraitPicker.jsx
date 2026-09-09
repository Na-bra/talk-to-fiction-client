import { useState } from 'react';

export default function TraitPicker({ suggested = [], selected = [], onChange }) {
  const [custom, setCustom] = useState('');

  const toggle = (trait) =>
    onChange(selected.includes(trait) ? selected.filter((t) => t !== trait) : [...selected, trait]);

  const addCustom = () => {
    const trait = custom.trim();
    if (trait && !selected.includes(trait)) onChange([...selected, trait]);
    setCustom('');
  };

  const extras = selected.filter((trait) => !suggested.includes(trait));

  return (
    <>
      <div className="traits">
        {suggested.map((trait) => (
          <button
            key={trait}
            type="button"
            className={`trait pick ${selected.includes(trait) ? 'on' : ''}`}
            onClick={() => toggle(trait)}
          >
            {trait}
          </button>
        ))}
        {extras.map((trait) => (
          <button key={trait} type="button" className="trait pick on" onClick={() => toggle(trait)}>
            {trait} ×
          </button>
        ))}
      </div>
      <div className="secret-row" style={{ marginTop: 10 }}>
        <input
          type="text"
          value={custom}
          placeholder="Add a custom trait"
          onChange={(event) => setCustom(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              addCustom();
            }
          }}
        />
        <button type="button" className="btn btn-sm" onClick={addCustom}>
          Add
        </button>
      </div>
    </>
  );
}
