// ─── ZVK Genebos — Badge definities ──────────────────────────────────────────

// Een badge is verdiend als (1) conditie(stats) true geeft, OF (2) een admin ze
// handmatig toekende via de tabel player_badges.
//
// Velden:
//   id             — verwijst naar player_badges.badge_id, nooit wijzigen na gebruik
//   naam           — '???' bij een badge die nog geheim moet blijven
//   emoji          — enkel zichtbaar zodra de badge verdiend is
//   categorie      — brons | zilver | goud | platina | legendary | geheim
//   beschrijving   — leeg laten bij een geheime badge
//   conditieTekst  — korte samenvatting, getoond bij een verdiende badge
//   handmatig      — true = enkel toe te kennen door een admin
//   placeholder    — true = naam en beschrijving blijven verborgen
//   conditie(stats) — stats komen uit src/lib/badgeStats.js

export const geheim = (id, categorie) => ({
  id,
  naam: '???',
  emoji: '❓',
  categorie,
  beschrijving: '',
  conditieTekst: '',
  placeholder: true,
  conditie: () => false,
})

// Kleine helper zodat elke drempel-badge er hetzelfde uitziet
const drempel = ({ id, naam, emoji, categorie, beschrijving, conditieTekst, veld, min }) => ({
  id, naam, emoji, categorie, beschrijving, conditieTekst,
  conditie: s => (s[veld] ?? 0) >= min,
})

export const BADGES = [
  // ─── Brons ───────────────────────────────────────────────────
  drempel({
    id: 'vijf-wedstrijden', naam: 'Vaste Waarde', emoji: '⚽', categorie: 'brons',
    beschrijving: 'Je speelde vijf wedstrijden mee voor ZVK Genebos.',
    conditieTekst: '5 wedstrijden gespeeld',
    veld: 'aantalWedstrijden', min: 5,
  }),
  drempel({
    id: 'eerste-goal', naam: 'De Eerste', emoji: '🎉', categorie: 'brons',
    beschrijving: 'Je eerste doelpunt voor de ploeg zit erin.',
    conditieTekst: '1 goal gescoord',
    veld: 'aantalGoals', min: 1,
  }),
  drempel({
    id: 'tien-goals', naam: 'Netjesvinder', emoji: '🕸️', categorie: 'brons',
    beschrijving: 'Tien keer de weg naar het doel gevonden.',
    conditieTekst: '10 goals gescoord',
    veld: 'aantalGoals', min: 10,
  }),
  drempel({
    id: 'eerste-assist', naam: 'Gulle Gever', emoji: '🎁', categorie: 'brons',
    beschrijving: 'Je legde er eentje klaar voor een ploegmaat.',
    conditieTekst: '1 assist gegeven',
    veld: 'aantalAssists', min: 1,
  }),
  drempel({
    id: 'tien-assists', naam: 'Aangever', emoji: '👉', categorie: 'brons',
    beschrijving: 'Tien keer de laatste pass gegeven.',
    conditieTekst: '10 assists gegeven',
    veld: 'aantalAssists', min: 10,
  }),
  drempel({
    id: 'propere-lei', naam: 'Propere Lei', emoji: '🧼', categorie: 'brons',
    beschrijving: 'Je speelde een wedstrijd waarin de tegenstander niet scoorde.',
    conditieTekst: '1 keer de nul gehouden',
    veld: 'cleanSheets', min: 1,
  }),

  // ─── Zilver ──────────────────────────────────────────────────
  drempel({
    id: 'zilver-1', naam: 'Vaste Klant', emoji: '🪑', categorie: 'zilver',
    beschrijving: 'Vijftien wedstrijden meegespeeld. Ze rekenen op je.',
    conditieTekst: '15 wedstrijden gespeeld',
    veld: 'aantalWedstrijden', min: 15,
  }),
  drempel({
    id: 'zilver-2', naam: 'Sluipschutter', emoji: '🎯', categorie: 'zilver',
    beschrijving: 'Vijfentwintig doelpunten op je naam.',
    conditieTekst: '25 goals gescoord',
    veld: 'aantalGoals', min: 25,
  }),
  drempel({
    id: 'zilver-3', naam: 'Spelverdeler', emoji: '🧠', categorie: 'zilver',
    beschrijving: 'Vijfentwintig assists. Jij ziet de pass die niemand ziet.',
    conditieTekst: '25 assists gegeven',
    veld: 'aantalAssists', min: 25,
  }),
  drempel({
    id: 'de-muur', naam: 'De Muur', emoji: '🧱', categorie: 'zilver',
    beschrijving: 'Vijf wedstrijden waarin de tegenstander droog bleef staan.',
    conditieTekst: '5 keer de nul gehouden',
    veld: 'cleanSheets', min: 5,
  }),

  // ─── Goud ────────────────────────────────────────────────────
  drempel({
    id: 'goud-1', naam: 'Clublegende', emoji: '🏛️', categorie: 'goud',
    beschrijving: 'Dertig wedstrijden voor ZVK Genebos. Een legende.',
    conditieTekst: '30 wedstrijden gespeeld',
    veld: 'aantalWedstrijden', min: 30,
  }),
  drempel({
    id: 'goud-2', naam: 'Bommenwerper', emoji: '💣', categorie: 'goud',
    beschrijving: 'Vijftig doelpunten. De tegenstander kent je naam.',
    conditieTekst: '50 goals gescoord',
    veld: 'aantalGoals', min: 50,
  }),
  drempel({
    id: 'dirigent', naam: 'Dirigent', emoji: '🎼', categorie: 'goud',
    beschrijving: 'Vijftig assists. Jij bepaalt het tempo.',
    conditieTekst: '50 assists gegeven',
    veld: 'aantalAssists', min: 50,
  }),
  drempel({
    id: 'kluis-van-genebos', naam: 'Kluis van Genebos', emoji: '🔒', categorie: 'goud',
    beschrijving: 'Tien wedstrijden zonder tegendoelpunt met jou op het veld.',
    conditieTekst: '10 keer de nul gehouden',
    veld: 'cleanSheets', min: 10,
  }),

  // ─── Platina ─────────────────────────────────────────────────
  drempel({
    id: 'platina-1', naam: 'Genebos-monument', emoji: '🗿', categorie: 'platina',
    beschrijving: 'Zestig wedstrijden. Je hoort bij het meubilair.',
    conditieTekst: '60 wedstrijden gespeeld',
    veld: 'aantalWedstrijden', min: 60,
  }),
  drempel({
    id: 'platina-2', naam: 'Doelpuntenmachine', emoji: '🏭', categorie: 'platina',
    beschrijving: 'Honderd doelpunten voor de ploeg.',
    conditieTekst: '100 goals gescoord',
    veld: 'aantalGoals', min: 100,
  }),
  drempel({
    id: 'platina-3', naam: 'Architect', emoji: '📐', categorie: 'platina',
    beschrijving: 'Honderd assists. Half de goals van de club zijn van jouw hand.',
    conditieTekst: '100 assists gegeven',
    veld: 'aantalAssists', min: 100,
  }),
  drempel({
    id: 'onneembaar', naam: 'Onneembaar', emoji: '🏰', categorie: 'platina',
    beschrijving: 'Twintig wedstrijden waarin er achteraan niets doorkwam.',
    conditieTekst: '20 keer de nul gehouden',
    veld: 'cleanSheets', min: 20,
  }),

  // ─── Legendary ─────────────────────────────────────────────
  drempel({
    id: 'onsterfelijk', naam: 'Onsterfelijk', emoji: '♾️', categorie: 'legendary',
    beschrijving: 'Honderd wedstrijden voor ZVK Genebos.',
    conditieTekst: '100 wedstrijden gespeeld',
    veld: 'aantalWedstrijden', min: 100,
  }),
  {
    id: 'gouden-schoen',
    naam: 'Gouden Schoen',
    emoji: '👟',
    categorie: 'legendary',
    beschrijving: 'Beste speler van het seizoen.',
    conditieTekst: '',
    handmatig: true,
    conditie: () => false,
  },
]

// Badges die enkel een admin kan toekennen (beheerscherm)
export const HANDMATIGE_BADGES = BADGES.filter(b => b.handmatig)

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
