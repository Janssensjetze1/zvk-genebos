// Klein embleem voor een ploeg: het clublogo voor ZVK, een rondje met de
// beginletter voor de anderen, zodat de namen altijd netjes uitlijnen.
export default function PloegLogo({ team, grootte = 22, opDonker = false }) {
  if (team?.is_zvk) {
    return (
      <img
        src="/logo.png"
        alt=""
        aria-hidden="true"
        style={{ width: grootte, height: grootte, objectFit: 'contain', flexShrink: 0 }}
      />
    )
  }
  return (
    <span
      aria-hidden="true"
      style={{
        width: grootte, height: grootte, borderRadius: '50%', flexShrink: 0,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        fontSize: Math.round(grootte * 0.45), fontWeight: 700,
        background: opDonker ? 'rgba(255,255,255,0.12)' : 'var(--z-lijn-zacht)',
        color: opDonker ? 'rgba(255,255,255,0.75)' : 'var(--z-tekst-3)',
      }}
    >
      {(team?.name ?? '?').charAt(0).toUpperCase()}
    </span>
  )
}
