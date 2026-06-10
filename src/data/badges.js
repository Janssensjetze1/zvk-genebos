// ─── ZVK Genebos — Badge definities ──────────────────────────────────────────
//
// Elke badge heeft:
//   id          unieke sleutel (string)
//   emoji       icoon
//   naam        weergavenaam
//   beschrijving wat de gebruiker ziet
//   categorie   'brons' | 'zilver' | 'goud' | 'legendary' | 'geheim'
//   conditie    functie(stats) => boolean
//
// stats-object dat meegegeven wordt aan elke conditie:
//   stats.aantalWedstrijden           totaal gespeelde wedstrijden (ooit)
//   stats.aantalWedstrijdenRij        huidige reeks opeenvolgende wedstrijden
//   stats.maxWedstrijdenRij           langste reeks ooit
//   stats.aantalGoals                 totaal goals (ooit)
//   stats.aantalAssists               totaal assists (ooit)
//   stats.aantalSeizoenen             aantal seizoenen actief
//   stats.seizoenGoals                goals dit seizoen
//   stats.topScorerSeizoenen          aantal seizoenen topscorer geweest
//   stats.hattricks                   aantal wedstrijden met 3+ goals
//   stats.hattrickMetAssist           wedstrijden met hattrick én minstens 1 assist
//   stats.maxGoalsInWedstrijd         meeste goals in één wedstrijd (ooit)
//   stats.maxAssistsInWedstrijd       meeste assists in één wedstrijd (ooit)
//   stats.wedstrijdenMetGoalEnAssist  wedstrijden met minstens 1 goal én 1 assist
//   stats.seizoenenMetGoal            seizoenen met minstens 1 goal
//   stats.seizonenVolledigAanwezig    seizoenen waarbij elke wedstrijd aanwezig
//   stats.grootsteWinstMarge          grootste doelpuntenverschil in gewonnen wedstrijd
//   stats.accountLeeftijdDagen        dagen sinds registratie
//   stats.gewonnenOpVerjaardag        boolean — ooit gewonnen op eigen verjaardag
//   stats.nachtbraker                 boolean — ooit ingelogd tussen 2u-5u
//   stats.nooitGespeeld               boolean — nooit een wedstrijd gespeeld

export const BADGES = [

  // ── BRONS ─────────────────────────────────────────────────────────────────
  // Bereikbaar voor iedereen — eerste stappen

  {
    id: 'debuut',
    emoji: '🎽',
    naam: 'Debuut',
    beschrijving: 'Je eerste wedstrijd gespeeld voor ZVK Genebos.',
    categorie: 'brons',
    conditie: (s) => s.aantalWedstrijden >= 1,
  },
  {
    id: 'eerste_goal',
    emoji: '⚽',
    naam: 'Eerste goal',
    beschrijving: 'Je eerste doelpunt ooit gescoord.',
    categorie: 'brons',
    conditie: (s) => s.aantalGoals >= 1,
  },
  {
    id: 'eerste_assist',
    emoji: '🤝',
    naam: 'Eerste assist',
    beschrijving: 'Je eerste assist ooit gegeven.',
    categorie: 'brons',
    conditie: (s) => s.aantalAssists >= 1,
  },
  {
    id: 'vaste_waarde',
    emoji: '📅',
    naam: 'Vaste waarde',
    beschrijving: '5 wedstrijden aanwezig geweest.',
    categorie: 'brons',
    conditie: (s) => s.aantalWedstrijden >= 5,
  },
  {
    id: 'op_dreef',
    emoji: '🎯',
    naam: 'Op dreef',
    beschrijving: '3 goals gescoord in één seizoen.',
    categorie: 'brons',
    conditie: (s) => s.seizoenGoals >= 3,
  },

  // ── ZILVER ────────────────────────────────────────────────────────────────
  // Vraagt consistentie en inzet

  {
    id: 'hattrick',
    emoji: '🔥',
    naam: 'Hattrick',
    beschrijving: '3 goals gescoord in één wedstrijd.',
    categorie: 'zilver',
    conditie: (s) => s.hattricks >= 1,
  },
  {
    id: 'twintig_matchen',
    emoji: '👟',
    naam: 'Twintig matchen',
    beschrijving: '20 wedstrijden gespeeld in totaal.',
    categorie: 'zilver',
    conditie: (s) => s.aantalWedstrijden >= 20,
  },
  {
    id: 'trouwe_soldaat',
    emoji: '💪',
    naam: 'Trouwe soldaat',
    beschrijving: '10 wedstrijden op rij aanwezig geweest.',
    categorie: 'zilver',
    conditie: (s) => s.maxWedstrijdenRij >= 10,
  },
  {
    id: 'scherpschutter',
    emoji: '🏹',
    naam: 'Scherpschutter',
    beschrijving: '10 goals gescoord in één seizoen.',
    categorie: 'zilver',
    conditie: (s) => s.seizoenGoals >= 10,
  },
  {
    id: 'dubbelslag',
    emoji: '🎪',
    naam: 'Dubbelslag',
    beschrijving: '2 assists gegeven in één wedstrijd.',
    categorie: 'zilver',
    conditie: (s) => s.maxAssistsInWedstrijd >= 2,
  },

  // ── GOUD ──────────────────────────────────────────────────────────────────
  // Enkel voor toegewijde spelers

  {
    id: 'topscorer',
    emoji: '👑',
    naam: 'Topscorer',
    beschrijving: 'Topscorer van het seizoen geweest.',
    categorie: 'goud',
    conditie: (s) => s.topScorerSeizoenen >= 1,
  },
  {
    id: 'ijzeren_man',
    emoji: '💯',
    naam: 'IJzeren man',
    beschrijving: 'Elke wedstrijd van een volledig seizoen aanwezig geweest.',
    categorie: 'goud',
    conditie: (s) => s.seizonenVolledigAanwezig >= 1,
  },
  {
    id: 'superster',
    emoji: '⚡',
    naam: 'Superster',
    beschrijving: 'Hattrick én minstens 1 assist in dezelfde wedstrijd.',
    categorie: 'goud',
    conditie: (s) => s.hattrickMetAssist >= 1,
  },
  {
    id: 'legende',
    emoji: '🌟',
    naam: 'Legende',
    beschrijving: '50 wedstrijden gespeeld in totaal.',
    categorie: 'goud',
    conditie: (s) => s.aantalWedstrijden >= 50,
  },
  {
    id: 'oorlogsmachine',
    emoji: '⚔️',
    naam: 'Oorlogsmachine',
    beschrijving: 'Minstens 1 goal én 1 assist in 10 verschillende wedstrijden.',
    categorie: 'goud',
    conditie: (s) => s.wedstrijdenMetGoalEnAssist >= 10,
  },
  {
    id: 'de_muur',
    emoji: '🧱',
    naam: 'De Muur',
    beschrijving: '20 wedstrijden op rij aanwezig zonder één keer te missen.',
    categorie: 'goud',
    conditie: (s) => s.maxWedstrijdenRij >= 20,
  },
  {
    id: 'tsunami',
    emoji: '🌊',
    naam: 'Tsunami',
    beschrijving: '15 goals gescoord in één seizoen.',
    categorie: 'goud',
    conditie: (s) => s.seizoenGoals >= 15,
  },

  // ── LEGENDARY ─────────────────────────────────────────────────────────────
  // Bijna onhaalbaar — voor de absolute elite

  {
    id: 'onsterfelijk',
    emoji: '🔱',
    naam: 'Onsterfelijk',
    beschrijving: '100 wedstrijden gespeeld in totaal.',
    categorie: 'legendary',
    conditie: (s) => s.aantalWedstrijden >= 100,
  },
  {
    id: 'diamant',
    emoji: '💎',
    naam: 'Diamant',
    beschrijving: '50 goals gescoord over alle seizoenen.',
    categorie: 'legendary',
    conditie: (s) => s.aantalGoals >= 50,
  },
  {
    id: 'demon',
    emoji: '👹',
    naam: 'Demon',
    beschrijving: '5 goals gescoord in één wedstrijd.',
    categorie: 'legendary',
    conditie: (s) => s.maxGoalsInWedstrijd >= 5,
  },
  {
    id: 'goat',
    emoji: '🐐',
    naam: 'GOAT',
    beschrijving: 'Topscorer geweest in 3 verschillende seizoenen.',
    categorie: 'legendary',
    conditie: (s) => s.topScorerSeizoenen >= 3,
  },
  {
    id: 'ijzeren_wil',
    emoji: '🏅',
    naam: 'IJzeren wil',
    beschrijving: 'Minstens 1 goal gescoord in elk van de laatste 3 seizoenen.',
    categorie: 'legendary',
    conditie: (s) => s.seizoenenMetGoal >= 3,
  },
  {
    id: 'supernova',
    emoji: '☄️',
    naam: 'Supernova',
    beschrijving: 'Hattrick gescoord in 3 verschillende wedstrijden (ooit).',
    categorie: 'legendary',
    conditie: (s) => s.hattricks >= 3,
  },
  {
    id: 'alziend',
    emoji: '👁️',
    naam: 'Alziend',
    beschrijving: '5 assists gegeven in één wedstrijd.',
    categorie: 'legendary',
    conditie: (s) => s.maxAssistsInWedstrijd >= 5,
  },
  {
    id: 'tijdloze',
    emoji: '🕰️',
    naam: 'Tijdloze',
    beschrijving: '5 seizoenen lang elke wedstrijd aanwezig geweest.',
    categorie: 'legendary',
    conditie: (s) => s.seizonenVolledigAanwezig >= 5,
  },
  {
    id: 'ongenaakbaar',
    emoji: '💀',
    naam: 'Ongenaakbaar',
    beschrijving: 'Een wedstrijd meegespeeld met 10+ doelpuntenverschil winst.',
    categorie: 'legendary',
    conditie: (s) => s.grootsteWinstMarge >= 10,
  },
  {
    id: 'de_club',
    emoji: '🌍',
    naam: 'De Club',
    beschrijving: 'Al meer dan 2 jaar actief lid van de app.',
    categorie: 'legendary',
    conditie: (s) => s.accountLeeftijdDagen >= 730,
  },

  // ── GEHEIM ─────────────────────────────────────────────────────────────────
  // Verborgen — beschrijving pas zichtbaar na vrijspelen

  {
    id: 'jai_soif',
    emoji: '🍺',
    naam: "J'ai soif",
    beschrijving: '???',
    categorie: 'geheim',
    conditie: (s) => s.nachtbraker === true, // ingelogd tussen 2u-5u 's nachts
  },
  {
    id: 'spook',
    emoji: '👻',
    naam: 'Spook',
    beschrijving: '???',
    categorie: 'geheim',
    conditie: (s) => s.nooitGespeeld === true, // account aangemaakt maar nooit gespeeld
  },
  {
    id: 'precisie',
    emoji: '🎲',
    naam: 'Precisie',
    beschrijving: '???',
    categorie: 'geheim',
    conditie: (s) => s.aantalGoals >= 5 && s.aantalGoals === s.aantalAssists,
  },
  {
    id: 'lucky',
    emoji: '🎂',
    naam: 'Lucky',
    beschrijving: '???',
    categorie: 'geheim',
    conditie: (s) => s.gewonnenOpVerjaardag === true,
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

// Stijl per categorie
export const CATEGORIE_STIJL = {
  brons: {
    label: 'Brons',
    bg: '#fff7ed',
    color: '#c2410c',
    border: '#fed7aa',
    gradient: 'linear-gradient(135deg, #cd7f32, #e8a87c)',
    glow: 'rgba(194, 65, 12, 0.3)',
  },
  zilver: {
    label: 'Zilver',
    bg: '#f8fafc',
    color: '#475569',
    border: '#cbd5e1',
    gradient: 'linear-gradient(135deg, #94a3b8, #cbd5e1)',
    glow: 'rgba(100, 116, 139, 0.3)',
  },
  goud: {
    label: 'Goud',
    bg: '#fefce8',
    color: '#a16207',
    border: '#fde68a',
    gradient: 'linear-gradient(135deg, #d97706, #fbbf24)',
    glow: 'rgba(217, 119, 6, 0.4)',
  },
  legendary: {
    label: 'Legendary',
    bg: '#0f172a',
    color: '#a78bfa',
    border: '#4c1d95',
    gradient: 'linear-gradient(135deg, #7c3aed, #a78bfa, #f472b6)',
    glow: 'rgba(167, 139, 250, 0.5)',
  },
  geheim: {
    label: '???',
    bg: '#0f172a',
    color: '#475569',
    border: '#1e293b',
    gradient: 'linear-gradient(135deg, #1e293b, #334155)',
    glow: 'rgba(0,0,0,0)',
  },
}
