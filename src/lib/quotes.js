import { supabase } from './supabase'

// De "Quote of the day" op de laadpagina.
//
// De quotes staan in de tabel `quotes` (beheer → Quotes). De laadpagina mag
// daar niet op wachten — ze verschijnt voor er data is — dus tonen we een quote
// uit de cache van de vorige keer, en wordt die cache op de achtergrond
// ververst zodra het profiel geladen is. Zolang er nog geen cache is (eerste
// keer, uitgelogd, geen netwerk) valt ze terug op de lijst hieronder.

const CACHE_KEY = 'zvk_quotes'

export const STANDAARD_QUOTES = [
  { tekst: "Voetbal is simpel, maar het moeilijkste da er is, is simpel voetballen.", auteur: "Johan Cruijff" },
  { tekst: "Kampioen , we pakken de beker ok nog!", auteur: "Dretze" },
  { tekst: "Burgemeester de Bie,beter wordt het nie.", auteur: "Nicole" },
  { tekst: "zoals ZVK’ers tegenwoordig doen won ik die wedstrijd ", auteur: "Lander Engelen" },
  { tekst: "Ik mut een wijf hemme om te daanse.", auteur: "Frank Den voorzitter" },
  { tekst: "Nog een kleine fun fact: al die lichte maaltijden hebben me niet geholpen, heb quasi heel de namiddag op het kleinste kamertje gezeten", auteur: "Lander Engelen" },
  { tekst: "Match gedaan, beker de lucht in, bubbels van de voorzitter opdrinken en een goei lange nabespreking in de Kantin. Gelukkig is het nog ni gedaan voor dit jaar, den DUBBEL is nog een optie. Den Antwaaarp deed het ons vorig seizoen voor. Zeer benieuwd of de gouden generatie zich hiervoor nog opgeladen krijgt.. Iedereen is bang van Genebos, nu ook tijdens de match", auteur: "Dretze" },
  { tekst: "Voetbal is ne godsdienst en het stadion is onze kerk.", auteur: "Pep Guardiola" },
  { tekst: "Mijne zondag begon zoals elke zondag bij mij, goed uitslapen zoals het hoort en een beetje bekomen van de lange nacht die ik tegenmoed was gegaan", auteur: "Jean" },
  { tekst: "Had ik nog zoveel moeten eten veu zowe een match.. Das nie het slimste idee dak had", auteur: "Luyte" },
  { tekst: "Ik heb wel op de deklat gesjot eh", auteur: "Dretze" },
  { tekst: "J'ai soif.", auteur: "Dretze" },
  { tekst: "Er werd weer verdedigd als janetten.", auteur: "De ZVK Supporters" },
  { tekst: "Dit jaar spelen we kampioen.", auteur: "Dretze" },
  { tekst: "Dieje he teveel deklatjuice gedronken", auteur: "Werres" },
  { tekst: "Smakelijk Johan", auteur: "Chris Mulkers" },
]

function leesCache() {
  try {
    const ruw = localStorage.getItem(CACHE_KEY)
    if (!ruw) return null
    const lijst = JSON.parse(ruw)
    if (!Array.isArray(lijst) || lijst.length === 0) return null
    return lijst.filter(q => q?.tekst && q?.auteur)
  } catch {
    return null
  }
}

export function quoteLijst() {
  const cache = leesCache()
  return cache?.length ? cache : STANDAARD_QUOTES
}

export function willekeurigeQuote() {
  const lijst = quoteLijst()
  return lijst[Math.floor(Math.random() * lijst.length)]
}

// Haalt de actieve quotes op en bewaart ze voor de volgende keer dat de
// laadpagina verschijnt. Faalt stil: dan blijft de vorige cache staan.
export async function ververseQuotes() {
  try {
    const { data, error } = await supabase
      .from('quotes')
      .select('tekst, auteur')
      .eq('actief', true)
    if (error || !data) return
    if (data.length === 0) {
      localStorage.removeItem(CACHE_KEY)
      return
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(data))
  } catch {
    // Geen cache-update; de app draait gewoon door
  }
}
