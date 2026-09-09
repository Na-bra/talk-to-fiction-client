import StatBar from './StatBar.jsx';

export default function Relationship({ relationship = {} }) {
  return (
    <>
      <StatBar name="Trust" value={relationship.trust ?? 0} />
      <StatBar name="Friendship" value={relationship.friendship ?? 0} />
      <StatBar name="Suspicion" value={relationship.suspicion ?? 0} warn />
      <StatBar name="Fear" value={relationship.fear ?? 0} warn />
    </>
  );
}
