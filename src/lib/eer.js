// Eretekens van het seizoen: goud voor de topscorer, paars voor de
// assistenkoning. De waarde komt uit useTopscorer().eer(spelerId):
// 'topscorer' | 'assistkoning' | 'beide' | null
//
// Is iemand allebei, dan blijft de ring goud en krijgt hij twee kroontjes —
// het eerste met een gouden gloed, het tweede met een paarse.

export const RING_KLASSE = {
  topscorer: 'topscorer-ring',
  assistkoning: 'assistkoning-ring',
  beide: 'topscorer-ring',
}

export const VLAK_KLASSE = {
  topscorer: 'topscorer-vlak',
  assistkoning: 'assistkoning-vlak',
  beide: 'topscorer-vlak',
}

export const EER_TITEL = {
  topscorer: 'Topscorer van het seizoen',
  assistkoning: 'Assistenkoning van het seizoen',
  beide: 'Topscorer én assistenkoning van het seizoen',
}

export const KROON_GLOED = {
  goud: 'drop-shadow(0 1px 2px rgba(0,0,0,0.25)) drop-shadow(0 0 4px rgba(245,158,11,0.9))',
  paars: 'drop-shadow(0 1px 2px rgba(0,0,0,0.25)) drop-shadow(0 0 4px rgba(139,92,246,0.9))',
}

export function kronenVoor(eer) {
  if (eer === 'beide') return ['goud', 'paars']
  if (eer === 'topscorer') return ['goud']
  if (eer === 'assistkoning') return ['paars']
  return []
}
