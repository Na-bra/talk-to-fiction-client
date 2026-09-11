import Meter from './Meter.jsx';
import { RELATIONSHIP_AXES } from '../lib/format.js';

/** The four relationship axes. `deltas` is the last turn's change, if any. */
export default function Relationship({ relationship = {}, deltas }) {
  return (
    <div>
      {RELATIONSHIP_AXES.map(({ key, label, caution }) => (
        <Meter
          key={key}
          label={label}
          value={relationship?.[key] ?? 0}
          caution={caution}
          delta={deltas?.[key]}
        />
      ))}
    </div>
  );
}
