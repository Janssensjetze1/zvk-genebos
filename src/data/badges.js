// ─── ZVK Genebos — Badge definities ──────────────────────────────────────────

export const BADGES = [
  {
    id: 'welkom',
    emoji: '✅',
    naam: 'Welkom',
    beschrijving: 'Aangemeld op ZVK Genebos.',
    categorie: 'brons',
    conditie: () => true,
  },
]

// Hulpfunctie: geef alle vrijgespeelde badges terug voor een stats-object
export function berekenBadges(stats) {
  return BADGES.filter(b => {
    try { return b.conditie(stats) }
    catch { return false }
  })
}

// Volgorde van categorieën (van laag naar hoog)
export const CATEGORIE_VOLGORDE = ['brons', 'zilver', 'goud', 'legendary', 'geheim']

// Kleuren per categorie
// ro = outer ring, ri = inner hex, rc = circle fill
// lb = card bg, lc = label text, lbo = label border
export const CAT = {
  brons:     { ro: '#e8a87c', ri: '#9a5c1a', rc: '#fff3e0', label: 'Brons',     lb: '#fff7ed', lc: '#c2410c', lbo: '#fed7aa' },
  zilver:    { ro: '#cfd8dc', ri: '#546e7a', rc: '#eceff1', label: 'Zilver',    lb: '#f8fafc', lc: '#475569', lbo: '#cbd5e1' },
  goud:      { ro: '#ffe082', ri: '#b06c00', rc: '#fff8e1', label: 'Goud',      lb: '#fefce8', lc: '#a16207', lbo: '#fde68a' },
  legendary: { ro: '#a78bfa', ri: '#4c1d95', rc: '#ede9fe', label: 'Legendary', lb: '#faf5ff', lc: '#7c3aed', lbo: '#ddd6fe' },
  geheim:    { ro: '#334155', ri: '#0f172a', rc: '#1e293b', label: '???',       lb: '#0f172a', lc: '#94a3b8', lbo: '#1e293b' },
}

export const CATEGORIE_STIJL = {
  brons:     { label: 'Brons',     bg: '#fff7ed', color: '#c2410c', border: '#fed7aa', gradient: 'linear-gradient(135deg, #cd7f32, #e8a87c)', glow: 'rgba(194,65,12,0.3)' },
  zilver:    { label: 'Zilver',    bg: '#f8fafc', color: '#475569', border: '#cbd5e1', gradient: 'linear-gradient(135deg, #94a3b8, #cbd5e1)', glow: 'rgba(100,116,139,0.3)' },
  goud:      { label: 'Goud',      bg: '#fefce8', color: '#a16207', border: '#fde68a', gradient: 'linear-gradient(135deg, #d97706, #fbbf24)', glow: 'rgba(217,119,6,0.4)' },
  legendary: { label: 'Legendary', bg: '#0f172a', color: '#a78bfa', border: '#4c1d95', gradient: 'linear-gradient(135deg, #7c3aed, #a78bfa, #f472b6)', glow: 'rgba(167,139,250,0.5)' },
  geheim:    { label: '???',       bg: '#0f172a', color: '#475569', border: '#1e293b', gradient: 'linear-gradient(135deg, #1e293b, #334155)', glow: 'rgba(0,0,0,0)' },
}
