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

// Holografische aurora-gradients voor verdiende badges
// Gestapelde radiale gradiënten creëren het zachte kleur-mesh effect (zie referentie-afbeelding)
// Bovenste laag = gloss-highlight, daarna kleur-blobs, onderste laag = basiskleur
export const SHINE = {
  brons: {
    // Warm aurora: goud, koper, perzik, rose-gold
    outerGrad: [
      'linear-gradient(135deg, rgba(255,255,255,0.50) 0%, rgba(255,255,255,0.08) 28%, transparent 48%)',
      'radial-gradient(ellipse at 18% 28%, #ffe8c0 0%, transparent 55%)',
      'radial-gradient(ellipse at 82% 70%, #f4956a 0%, transparent 55%)',
      'radial-gradient(ellipse at 52% 88%, #ffd080 0%, transparent 52%)',
      'linear-gradient(145deg, #f5c078 0%, #c86820 100%)',
    ].join(','),
    innerGrad:  'linear-gradient(145deg, #c87228 0%, #7a3c06 100%)',
    circleGrad: 'radial-gradient(circle at 35% 28%, rgba(255,255,255,0.95) 0%, #fff3e0 50%)',
    glow:       'rgba(220,140,60,0.55)',
  },
  zilver: {
    // Koele aurora: zilver, ijsblauw, lila, wit
    outerGrad: [
      'linear-gradient(135deg, rgba(255,255,255,0.60) 0%, rgba(255,255,255,0.10) 30%, transparent 50%)',
      'radial-gradient(ellipse at 18% 28%, #e8f4ff 0%, transparent 52%)',
      'radial-gradient(ellipse at 80% 22%, #d0d8ff 0%, transparent 50%)',
      'radial-gradient(ellipse at 65% 80%, #e4d8ff 0%, transparent 52%)',
      'linear-gradient(145deg, #dce8f5 0%, #8aa8c8 100%)',
    ].join(','),
    innerGrad:  'linear-gradient(145deg, #80a0bc 0%, #384e64 100%)',
    circleGrad: 'radial-gradient(circle at 35% 28%, rgba(255,255,255,0.98) 0%, #eceff1 50%)',
    glow:       'rgba(100,148,196,0.45)',
  },
  goud: {
    // Rijke goud aurora: geel, amber, champagne, warm groen-goud
    outerGrad: [
      'linear-gradient(135deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.08) 28%, transparent 48%)',
      'radial-gradient(ellipse at 18% 28%, #fffde0 0%, transparent 52%)',
      'radial-gradient(ellipse at 82% 65%, #ffa820 0%, transparent 55%)',
      'radial-gradient(ellipse at 48% 85%, #f0e060 0%, transparent 52%)',
      'linear-gradient(145deg, #ffe860 0%, #c88000 100%)',
    ].join(','),
    innerGrad:  'linear-gradient(145deg, #c08808 0%, #7a4600 100%)',
    circleGrad: 'radial-gradient(circle at 35% 28%, rgba(255,255,255,0.95) 0%, #fff8e1 50%)',
    glow:       'rgba(210,160,0,0.58)',
  },
  platina: {
    // Ijzige aurora — exact als de referentie-afbeelding: ijsblauw, mint, lila
    outerGrad: [
      'linear-gradient(135deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.08) 28%, transparent 48%)',
      'radial-gradient(ellipse at 15% 35%, #c8e8ff 0%, transparent 52%)',
      'radial-gradient(ellipse at 82% 58%, #d8c8ff 0%, transparent 55%)',
      'radial-gradient(ellipse at 50% 88%, #b8f0e0 0%, transparent 52%)',
      'linear-gradient(145deg, #d8f0ff 0%, #78b8e0 100%)',
    ].join(','),
    innerGrad:  'linear-gradient(145deg, #3880b8 0%, #063858 100%)',
    circleGrad: 'radial-gradient(circle at 35% 28%, rgba(255,255,255,0.98) 0%, #e8f8ff 50%)',
    glow:       'rgba(56,184,248,0.50)',
  },
  legendary: {
    // Magische aurora: violet, roze, magenta, diep paars
    outerGrad: [
      'linear-gradient(135deg, rgba(255,255,255,0.50) 0%, rgba(255,255,255,0.08) 28%, transparent 48%)',
      'radial-gradient(ellipse at 18% 28%, #f8e0ff 0%, transparent 52%)',
      'radial-gradient(ellipse at 82% 70%, #c898ff 0%, transparent 55%)',
      'radial-gradient(ellipse at 50% 85%, #ffb8e8 0%, transparent 52%)',
      'linear-gradient(145deg, #e8d0ff 0%, #8030d0 100%)',
    ].join(','),
    innerGrad:  'linear-gradient(145deg, #7838c0 0%, #280868 100%)',
    circleGrad: 'radial-gradient(circle at 35% 28%, rgba(255,255,255,0.95) 0%, #ede9fe 50%)',
    glow:       'rgba(160,100,255,0.60)',
  },
  geheim: {
    outerGrad:  'linear-gradient(145deg, #475569 0%, #334155 50%, #0f172a 100%)',
    innerGrad:  'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)',
    circleGrad: 'radial-gradient(circle at 35% 28%, #2d3f55 0%, #1e293b 55%)',
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
