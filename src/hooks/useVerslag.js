import { useState } from 'react'
import { supabase } from '../lib/supabase'

// Het wedstrijdverslag van één wedstrijd: laten genereren, zelf schrijven of
// achteraf bijwerken. De tekst staat in matches.report; een leeg verslag wordt
// als null bewaard zodat "nog geen verslag" één betekenis houdt.
export function useVerslag(wedstrijd) {
  const [verslag, setVerslag] = useState(wedstrijd.report ?? null)
  const [genereert, setGenereert] = useState(false)
  const [bewerkt, setBewerkt] = useState(false)
  const [tekst, setTekst] = useState(wedstrijd.report ?? '')
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState('')

  async function genereer() {
    setFout('')
    setBewerkt(false)
    setGenereert(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-match-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ match_id: wedstrijd.id }),
      })
      const json = await res.json()
      if (json.report) {
        setVerslag(json.report)
        setTekst(json.report)
      } else {
        setFout('Genereren mislukt. Probeer opnieuw of schrijf het verslag zelf.')
      }
    } catch (e) {
      setFout('Genereren mislukt: ' + e.message)
    } finally {
      setGenereert(false)
    }
  }

  function startBewerken() {
    setFout('')
    setTekst(verslag ?? '')
    setBewerkt(true)
  }

  function annuleer() {
    setFout('')
    setTekst(verslag ?? '')
    setBewerkt(false)
  }

  async function bewaar() {
    setFout('')
    setBezig(true)
    const nieuw = tekst.trim() ? tekst.trim() : null
    const { error } = await supabase.from('matches').update({ report: nieuw }).eq('id', wedstrijd.id)
    setBezig(false)
    if (error) {
      setFout('Opslaan mislukt: ' + error.message)
      return
    }
    setVerslag(nieuw)
    setBewerkt(false)
  }

  return { verslag, genereert, genereer, bewerkt, startBewerken, annuleer, tekst, setTekst, bewaar, bezig, fout }
}
