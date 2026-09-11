import { useState } from 'react';
import Icon from './Icon.jsx';

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
    <div className="trait-picker">
      {suggested.length > 0 && (
        <div className="chips" role="group" aria-label="Suggested traits">
          {suggested.map((trait) => {
            const on = selected.includes(trait);
            return (
              <button
                key={trait}
                type="button"
                className="chip chip-lg"
                aria-pressed={on}
                onClick={() => toggle(trait)}
              >
                {on && <Icon name="check" />}
                {trait}
              </button>
            );
          })}
        </div>
      )}

      {extras.length > 0 && (
        <div className="chips" role="group" aria-label="Your own traits">
          {extras.map((trait) => (
            <button
              key={trait}
              type="button"
              className="chip chip-lg is-on"
              onClick={() => toggle(trait)}
              aria-label={`Remove ${trait}`}
            >
              {trait}
              <Icon name="close" />
            </button>
          ))}
        </div>
      )}

      <div className="trait-add">
        <label className="sr-only" htmlFor="trait-custom">
          Add your own trait
        </label>
        <div className="input-affix trailing">
          <input
            id="trait-custom"
            type="text"
            className="input"
            value={custom}
            placeholder="Add your own trait, then press Enter"
            onChange={(event) => setCustom(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                addCustom();
              }
            }}
          />
          <button
            type="button"
            className="icon-btn icon-btn-sm"
            onClick={addCustom}
            disabled={!custom.trim()}
            aria-label="Add trait"
          >
            <Icon name="plus" />
          </button>
        </div>
        <p className="field-hint">
          {selected.length ? `${selected.length} selected` : 'None selected yet.'}
        </p>
      </div>
    </div>
  );
}
