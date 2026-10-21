// Gedeeld door de fanshop (Fanshop) en het beheer (TabFanshop)

export const MAX_AANTAL = 50

export function euro(bedrag) {
  return new Intl.NumberFormat('nl-BE', { style: 'currency', currency: 'EUR' }).format(Number(bedrag) || 0)
}

// besteld → betaald → afgegeven
export function bestelStatus(b) {
  if (b.afgegeven_at) return { id: 'afgegeven', label: 'Afgegeven', toon: 'winst' }
  if (b.betaald_at) return { id: 'betaald', label: 'Betaald', toon: 'blauw' }
  return { id: 'besteld', label: 'Nog te betalen', toon: 'gelijk' }
}

// "S, M, L" ↔ ['S', 'M', 'L']
export function matenUitTekst(tekst) {
  return [...new Set(tekst.split(',').map(m => m.trim()).filter(Boolean))]
}

// Fouten uit de database omzetten naar iets leesbaars. De triggerfouten zijn
// al in het Nederlands geschreven voor de leden.
export function shopFout(error) {
  const tekst = error?.message ?? ''
  if (/maximaal|niet meer te koop|geldige maat|geen maten/.test(tekst)) return tekst
  if (error?.code === '42501' || tekst.includes('row-level security')) {
    return 'De fanshop is gesloten of je bestelling is al betaald.'
  }
  return 'Dat lukte niet. Probeer het straks nog eens.'
}
