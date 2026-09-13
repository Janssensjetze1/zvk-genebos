import { EER_TITEL, KROON_GLOED, kronenVoor } from '../lib/eer'

// Eén of twee kroontjes: goud voor de topscorer, paars voor de assistenkoning.
export default function EerKronen({ eer, grootte = 14, style }) {
  const kronen = kronenVoor(eer)
  if (kronen.length === 0) return null

  return (
    <span
      title={EER_TITEL[eer]}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: Math.round(grootte * 0.1),
        lineHeight: 1, pointerEvents: 'none', ...style,
      }}
    >
      {kronen.map(kleur => (
        <span key={kleur} style={{ fontSize: grootte, lineHeight: 1, filter: KROON_GLOED[kleur] }}>👑</span>
      ))}
    </span>
  )
}
