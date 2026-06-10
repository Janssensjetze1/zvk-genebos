// ─── ZVK Genebos — Badge definities ──────────────────────────────────────────

export const BADGES = [

  // ── BRONS ─────────────────────────────────────────────────────────────────

  {
    id: 'welkom',
    emoji: '✅',
    naam: 'Welkom',
    beschrijving: 'Aangemeld op ZVK Genebos.',
    categorie: 'brons',
    conditie: () => true,
  },
  {
    id: 'routinier',
    emoji: '👟',
    naam: 'Routinier',
    beschrijving: '10 wedstrijden gespeeld voor ZVK Genebos.',
    categorie: 'brons',
    conditie: (s) => s.aantalWedstrijden >= 10,
  },
  {
    id: 'doelzoeker',
    emoji: '⚽',
    naam: 'Doelzoeker',
    beschrijving: '5 doelpunten gescoord over alle seizoenen.',
    categorie: 'brons',
    conditie: (s) => s.aantalGoals >= 5,
  },
  {
    id: 'spelmaker',
    emoji: '🎯',
    naam: 'Spelmaker',
    beschrijving: '5 assists gegeven over alle seizoenen.',
    categorie: 'brons',
    conditie: (s) => s.aantalAssists >= 5,
  },

  // ── ZILVER ────────────────────────────────────────────────────────────────

  {
    id: 'onmisbaar',
    emoji: '📌',
    naam: 'Onmisbaar',
    beschrijving: 'Geen enkele match gemist in een volledig seizoen.',
    categorie: 'zilver',
    conditie: (s) => s.seizoenenVolledigAanwezig >= 1,
  },
  {
    id: 'de_kluis',
    emoji: '🔒',
    naam: 'De Kluis',
    beschrijving: 'Minstens 1 clean sheet meegespeeld.',
    categorie: 'zilver',
    conditie: (s) => s.cleanSheets >= 1,
  },

  // ── GOUD ──────────────────────────────────────────────────────────────────

  {
    id: 'kanonnnier',
    emoji: '💥',
    naam: 'Kanonnnier',
    beschrijving: '15 doelpunten gescoord over alle seizoenen.',
    categorie: 'goud',
    conditie: (s) => s.aantalGoals >= 15,
  },
  {
    id: 'maestro',
    emoji: '🎻',
    naam: 'Maestro',
    beschrijving: '15 assists gegeven over alle seizoenen.',
    categorie: 'goud',
    conditie: (s) => s.aantalAssists >= 15,
  },
  {
    id: 'fort_knox',
    emoji: '🏰',
    naam: 'Fort Knox',
    beschrijving: '5 clean sheets meegespeeld.',
    categorie: 'goud',
    conditie: (s) => s.cleanSheets >= 5,
  },

  // ── PLATINA ───────────────────────────────────────────────────────────────

  {
    id: 'eeuweling',
    emoji: '💫',
    naam: 'Eeuweling',
    beschrijving: '100 wedstrijden gespeeld voor ZVK Genebos.',
    categorie: 'platina',
    conditie: (s) => s.aantalWedstrijden >= 100,
  },
  {
    id: 'centurion',
    emoji: '⚔️',
    naam: 'Centurion',
    beschrijving: '100 doelpunten gescoord over alle seizoenen.',
    categorie: 'platina',
    conditie: (s) => s.aantalGoals >= 100,
  },
  {
    id: 'top_verdediger',
    emoji: '🛡️',
    naam: 'Top Verdediger',
    beschrijving: '10 clean sheets meegespeeld.',
    categorie: 'platina',
    conditie: (s) => s.cleanSheets >= 10,
  },

]

// Metallic/shiny gradients voor verdiende badges
// outerGrad = buitenste hexring, innerGrad = binnenste hex, circleGrad = emoji-cirkel, glow = drop-shadow kleur
export const SHINE = {
  brons: {
    outerGrad:  'linear-gradient(145deg, #f5d0a0 0%, #e8a87c 30%, #c07020 65%, #f0c070 100%)',
    innerGrad:  'linear-gradient(145deg, #d49050 0%, #7a3f0a 100%)',
    circleGrad: 'radial-gradient(circle at 35% 30%, rgba(255,255,255,0.85) 0%, #fff3e0 55%)',
    glow:       'rgba(232,168,100,0.55)',
  },
  zilver: {
    outerGrad:  'linear-gradient(145deg, #ffffff 0%, #ccd8e8 25%, #8aa4bc 55%, #dde8f5 100%)',
    innerGrad:  'linear-gradient(145deg, #8aaabf 0%, #3a5068 100%)',
    circleGrad: 'radial-gradient(circle at 35% 30%, rgba(255,255,255,0.95) 0%, #eceff1 55%)',
    glow:       'rgba(100,140,180,0.45)',
  },
  goud: {
    outerGrad:  'linear-gradient(145deg, #fff8b0 0%, #ffe082 30%, #b06c00 65%, #ffd54f 100%)',
    innerGrad:  'linear-gradient(145deg, #d4a020 0%, #7a4a00 100%)',
    circleGrad: 'radial-gradient(circle at 35% 30%, rgba(255,255,255,0.88) 0%, #fff8e1 55%)',
    glow:       'rgba(255,200,0,0.55)',
  },
  platina: {
    outerGrad:  'linear-gradient(145deg, #e8f6ff 0%, #bae6fd 28%, #0c5080 65%, #90d0f8 100%)',
    innerGrad:  'linear-gradient(145deg, #4090c0 0%, #062840 100%)',
    circleGrad: 'radial-gradient(circle at 35% 30%, rgba(255,255,255,0.92) 0%, #f0f9ff 55%)',
    glow:       'rgba(56,189,248,0.5)',
  },
  legendary: {
    outerGrad:  'linear-gradient(145deg, #ede9fe 0%, #a78bfa 28%, #4c1d95 65%, #c4b5fd 100%)',
    innerGrad:  'linear-gradient(145deg, #8060d0 0%, #2a0870 100%)',
    circleGrad: 'radial-gradient(circle at 35% 30%, rgba(255,255,255,0.88) 0%, #ede9fe 55%)',
    glow:       'rgba(167,139,250,0.6)',
  },
  geheim: {
    outerGrad:  'linear-gradient(145deg, #475569 0%, #334155 50%, #0f172a 100%)',
    innerGrad:  'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)',
    circleGrad: 'radial-gradient(circle at 35% 30%, #2d3f55 0%, #1e293b 55%)',
    glow:       'rgba(0,0,0,0)',
  },
}

// Hulpfunctie: geef alle vrijgespeelde badges terug voor een stats-object
export function berekenBadges(stats) {
  return BADGES.filter(b => {
    try { return b.conditie(stats) }
    catch { return false }
  })
}

// Volgorde van categorieën (van laag naar hoog)
export const CATEGORIE_VOLGORDE = ['brons', 'zilver', 'goud', 'platina', 'legendary', 'geheim']

// Kleuren per categorie
// ro = outer ring, ri = inner hex, rc = circle fill
// lb = card bg, lc = label text, lbo = label border
export const CAT = {
  brons:     { ro: '#e8a87c', ri: '#9a5c1a', rc: '#fff3e0', label: 'Brons',     lb: '#fff7ed', lc: '#c2410c', lbo: '#fed7aa' },
  zilver:    { ro: '#cfd8dc', ri: '#546e7a', rc: '#eceff1', label: 'Zilver',    lb: '#f8fafc', lc: '#475569', lbo: '#cbd5e1' },
  goud:      { ro: '#ffe082', ri: '#b06c00', rc: '#fff8e1', label: 'Goud',      lb: '#fefce8', lc: '#a16207', lbo: '#fde68a' },
  platina:   { ro: '#bae6fd', ri: '#0c4a6e', rc: '#f0f9ff', label: 'Platina',   lb: '#f0f9ff', lc: '#0369a1', lbo: '#7dd3fc' },
  legendary: { ro: '#a78bfa', ri: '#4c1d95', rc: '#ede9fe', label: 'Legendary', lb: '#faf5ff', lc: '#7c3aed', lbo: '#ddd6fe' },
  geheim:    { ro: '#334155', ri: '#0f172a', rc: '#1e293b', label: '???',       lb: '#0f172a', lc: '#94a3b8', lbo: '#1e293b' },
}

export const CATEGORIE_STIJL = {
  brons:     { label: 'Brons',     bg: '#fff7ed', color: '#c2410c', border: '#fed7aa', gradient: 'linear-gradient(135deg, #cd7f32, #e8a87c)', glow: 'rgba(194,65,12,0.3)' },
  zilver:    { label: 'Zilver',    bg: '#f8fafc', color: '#475569', border: '#cbd5e1', gradient: 'linear-gradient(135deg, #94a3b8, #cbd5e1)', glow: 'rgba(100,116,139,0.3)' },
  goud:      { label: 'Goud',      bg: '#fefce8', color: '#a16207', border: '#fde68a', gradient: 'linear-gradient(135deg, #d97706, #fbbf24)', glow: 'rgba(217,119,6,0.4)' },
  platina:   { label: 'Platina',   bg: '#f0f9ff', color: '#0369a1', border: '#7dd3fc', gradient: 'linear-gradient(135deg, #0284c7, #38bdf8)', glow: 'rgba(3,105,161,0.35)' },
  legendary: { label: 'Legendary', bg: '#0f172a', color: '#a78bfa', border: '#4c1d95', gradient: 'linear-gradient(135deg, #7c3aed, #a78bfa, #f472b6)', glow: 'rgba(167,139,250,0.5)' },
  geheim:    { label: '???',       bg: '#0f172a', color: '#475569', border: '#1e293b', gradient: 'linear-gradient(135deg, #1e293b, #334155)', glow: 'rgba(0,0,0,0)' },
}
