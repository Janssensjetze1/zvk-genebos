import { useEffect, useState } from 'react'

// Licht of donker thema. De keuze ('licht', 'donker' of 'systeem') staat per
// toestel in localStorage; het thema zelf staat als data-thema op <html>,
// zodat ui.css enkel de kleurvariabelen hoeft te wisselen. index.html zet het
// al vóór React start, anders flitst de app eerst licht.

const SLEUTEL = 'zvk_thema'
const EVENT = 'zvk:thema'
const SYSTEEM = '(prefers-color-scheme: dark)'

export const THEMA_OPTIES = [
  { waarde: 'licht', label: 'Licht' },
  { waarde: 'donker', label: 'Donker' },
  { waarde: 'systeem', label: 'Systeem' },
]

function leesKeuze() {
  try { return localStorage.getItem(SLEUTEL) || 'licht' } catch { return 'licht' }
}

function pasToe(keuze) {
  const donker = keuze === 'donker' || (keuze === 'systeem' && window.matchMedia?.(SYSTEEM).matches)
  document.documentElement.dataset.thema = donker ? 'donker' : 'licht'
}

// [keuze, zetKeuze, isDonker]. Meerdere componenten blijven gelijk via een event.
export function useThema() {
  const [keuze, setKeuze] = useState(leesKeuze)

  useEffect(() => {
    const opWijziging = () => setKeuze(leesKeuze())
    window.addEventListener(EVENT, opWijziging)
    return () => window.removeEventListener(EVENT, opWijziging)
  }, [])

  // Bij "systeem" meeschakelen als het toestel van licht naar donker gaat
  useEffect(() => {
    pasToe(keuze)
    if (keuze !== 'systeem' || !window.matchMedia) return
    const mq = window.matchMedia(SYSTEEM)
    const opSysteem = () => pasToe('systeem')
    mq.addEventListener('change', opSysteem)
    return () => mq.removeEventListener('change', opSysteem)
  }, [keuze])

  function zetKeuze(nieuw) {
    try { localStorage.setItem(SLEUTEL, nieuw) } catch { /* privémodus: enkel deze sessie */ }
    setKeuze(nieuw)
    window.dispatchEvent(new Event(EVENT))
  }

  const isDonker = keuze === 'donker' || (keuze === 'systeem' && !!window.matchMedia?.(SYSTEEM).matches)
  return [keuze, zetKeuze, isDonker]
}
