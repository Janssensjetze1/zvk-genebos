import { useEffect, useState } from 'react'
import { useConfirm } from '../../../components/ConfirmDialog'
import { supabase } from '../../../lib/supabase'
import { ververseQuotes } from '../../../lib/quotes'

// Beheer van de quotes op de laadpagina ("Quote of the day").
// Tabel `quotes`; een quote op inactief zetten haalt ze uit de rotatie
// zonder ze te verliezen.

export default function TabQuotes() {
  const { bevestig, ConfirmUI } = useConfirm()
  const [quotes, setQuotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [laadFout, setLaadFout] = useState('')
  const [toonFormulier, setToonFormulier] = useState(false)
  const [zoek, setZoek] = useState('')

  // Nieuwe quote
  const [tekst, setTekst] = useState('')
  const [auteur, setAuteur] = useState('')
  const [opslaan, setOpslaan] = useState(false)
  const [fout, setFout] = useState('')

  // Bewerken
  const [bewerkId, setBewerkId] = useState(null)
  const [bewerkTekst, setBewerkTekst] = useState('')
  const [bewerkAuteur, setBewerkAuteur] = useState('')
  const [bewerkOpslaan, setBewerkOpslaan] = useState(false)
  const [bewerkFout, setBewerkFout] = useState('')

  async function fetchQuotes() {
    const { data, error } = await supabase
      .from('quotes')
      .select('*')
      .order('created_at', { ascending: true })
    if (error) setLaadFout(error.message)
    setQuotes(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchQuotes() }, [])

  // Na elke wijziging ook de cache van de laadpagina bijwerken
  async function herlaad() {
    await fetchQuotes()
    ververseQuotes()
  }

  async function handleToevoegen(e) {
    e.preventDefault()
    setFout('')
    setOpslaan(true)
    const { error } = await supabase.from('quotes').insert({ tekst: tekst.trim(), auteur: auteur.trim() })
    setOpslaan(false)
    if (error) { setFout('Toevoegen mislukt: ' + error.message); return }
    setTekst('')
    setAuteur('')
    setToonFormulier(false)
    herlaad()
  }

  function startBewerken(q) {
    setBewerkId(q.id)
    setBewerkTekst(q.tekst)
    setBewerkAuteur(q.auteur)
    setBewerkFout('')
  }

  function stopBewerken() {
    setBewerkId(null)
    setBewerkTekst('')
    setBewerkAuteur('')
    setBewerkFout('')
  }

  async function handleBewerken(e, q) {
    e.preventDefault()
    setBewerkFout('')
    setBewerkOpslaan(true)
    const { error } = await supabase
      .from('quotes')
      .update({ tekst: bewerkTekst.trim(), auteur: bewerkAuteur.trim() })
      .eq('id', q.id)
    setBewerkOpslaan(false)
    if (error) { setBewerkFout('Opslaan mislukt: ' + error.message); return }
    stopBewerken()
    herlaad()
  }

  async function toggleActief(q) {
    // Meteen tonen, daarna pas bewaren
    setQuotes(prev => prev.map(x => x.id === q.id ? { ...x, actief: !x.actief } : x))
    const { error } = await supabase.from('quotes').update({ actief: !q.actief }).eq('id', q.id)
    if (error) {
      setQuotes(prev => prev.map(x => x.id === q.id ? { ...x, actief: q.actief } : x))
      alert('Wijzigen mislukt: ' + error.message)
      return
    }
    ververseQuotes()
  }

  async function handleVerwijder(q) {
    const kort = q.tekst.length > 60 ? q.tekst.slice(0, 60) + '...' : q.tekst
    if (!await bevestig(`Quote "${kort}" definitief verwijderen?`, { gevaar: true, bevestigLabel: 'Verwijderen' })) return
    const { error } = await supabase.from('quotes').delete().eq('id', q.id)
    if (error) alert('Verwijderen mislukt: ' + error.message)
    else herlaad()
  }

  if (loading) return <p style={{ fontSize: '14px', color: '#94a3b8' }}>Laden...</p>

  const term = zoek.trim().toLowerCase()
  const zichtbaar = term
    ? quotes.filter(q => q.tekst.toLowerCase().includes(term) || q.auteur.toLowerCase().includes(term))
    : quotes
  const aantalActief = quotes.filter(q => q.actief).length

  return (
    <>
    {ConfirmUI}
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <div>
          <p style={{ fontSize: '14px', color: '#94a3b8' }}>
            {quotes.length} quote{quotes.length !== 1 ? 's' : ''} · {aantalActief} actief op de laadpagina
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type="search"
            value={zoek}
            onChange={e => setZoek(e.target.value)}
            placeholder="Zoek op tekst of auteur"
            style={{ ...inputStijl, width: '220px', padding: '8px 12px' }}
          />
          <button
            onClick={() => { setToonFormulier(v => !v); setFout(''); setTekst(''); setAuteur('') }}
            style={{
              background: toonFormulier ? 'white' : '#0f172a',
              color: toonFormulier ? '#64748b' : 'white',
              border: toonFormulier ? '1px solid #e2e8f0' : 'none',
              borderRadius: '8px', padding: '8px 16px',
              fontSize: '13px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap',
            }}
          >
            {toonFormulier ? 'Annuleren' : '+ Quote toevoegen'}
          </button>
        </div>
      </div>

      {laadFout && (
        <div style={{
          background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px',
          padding: '12px 16px', marginBottom: '16px', fontSize: '13px', color: '#b91c1c',
        }}>
          Quotes ophalen mislukt: {laadFout}. Bestaat de tabel <code>quotes</code> al in Supabase?
          De migratie staat in <code>supabase/migrations/quotes.sql</code>.
        </div>
      )}

      {/* Nieuwe quote */}
      {toonFormulier && (
        <form onSubmit={handleToevoegen} style={{
          background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px',
          padding: '20px', marginBottom: '16px',
        }}>
          <label style={labelStijl}>Quote *</label>
          <textarea
            value={tekst}
            onChange={e => setTekst(e.target.value)}
            required
            rows={3}
            placeholder="Wat is er gezegd?"
            autoFocus
            style={{ ...inputStijl, fontFamily: 'inherit', lineHeight: 1.6, resize: 'vertical', marginBottom: '14px' }}
          />
          <label style={labelStijl}>Auteur *</label>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <input
              type="text"
              value={auteur}
              onChange={e => setAuteur(e.target.value)}
              required
              placeholder="Wie zei het?"
              style={{ ...inputStijl, flex: 1 }}
            />
            <button type="submit" disabled={opslaan} style={knopStijl(opslaan)}>
              {opslaan ? 'Toevoegen...' : 'Toevoegen'}
            </button>
          </div>
          {fout && <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '8px' }}>{fout}</p>}
        </form>
      )}

      {/* Lijst */}
      {zichtbaar.length === 0 ? (
        <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '40px', textAlign: 'center' }}>
          <p style={{ fontSize: '14px', color: '#94a3b8' }}>
            {quotes.length === 0 ? 'Nog geen quotes. Voeg de eerste toe!' : 'Geen quote gevonden.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {zichtbaar.map(q => (
            <div key={q.id}>
              <div style={{
                background: 'white',
                border: `1px solid ${bewerkId === q.id ? '#93c5fd' : '#e2e8f0'}`,
                borderRadius: bewerkId === q.id ? '10px 10px 0 0' : '10px',
                padding: '13px 16px', display: 'flex', alignItems: 'flex-start', gap: '14px',
                opacity: q.actief ? 1 : 0.6,
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontSize: '14px', color: '#334155', fontStyle: 'italic',
                    lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap',
                  }}>
                    "{q.tekst}"
                  </p>
                  <p style={{
                    fontSize: '12px', fontWeight: '600', color: '#94a3b8',
                    marginTop: '6px', marginBottom: 0,
                  }}>
                    — {q.auteur}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
                  <button
                    onClick={() => toggleActief(q)}
                    title={q.actief ? 'Uit de rotatie halen' : 'Terug in de rotatie zetten'}
                    style={{
                      background: q.actief ? '#f0fdf4' : '#f8fafc',
                      color: q.actief ? '#16a34a' : '#94a3b8',
                      border: `1px solid ${q.actief ? '#bbf7d0' : '#e2e8f0'}`,
                      borderRadius: '6px', padding: '5px 11px',
                      fontSize: '12px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap',
                    }}
                  >
                    {q.actief ? '● Actief' : '○ Uit'}
                  </button>
                  <button
                    onClick={() => bewerkId === q.id ? stopBewerken() : startBewerken(q)}
                    style={{
                      background: bewerkId === q.id ? '#f1f5f9' : 'white',
                      border: '1px solid #e2e8f0', borderRadius: '6px',
                      padding: '5px 12px', fontSize: '13px', fontWeight: '500',
                      color: '#475569', cursor: 'pointer',
                    }}
                  >
                    {bewerkId === q.id ? 'Annuleren' : 'Bewerken'}
                  </button>
                  <button
                    onClick={() => handleVerwijder(q)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: '#cbd5e1', padding: '5px 8px', borderRadius: '6px' }}
                    onMouseEnter={e => e.target.style.color = '#ef4444'}
                    onMouseLeave={e => e.target.style.color = '#cbd5e1'}
                  >
                    Verwijderen
                  </button>
                </div>
              </div>

              {/* Inline bewerkformulier */}
              {bewerkId === q.id && (
                <form onSubmit={e => handleBewerken(e, q)} style={{
                  background: '#f8fafc', border: '1px solid #93c5fd', borderTop: 'none',
                  borderRadius: '0 0 10px 10px', padding: '14px 16px',
                }}>
                  <label style={{ ...labelStijl, fontSize: '12px' }}>Quote</label>
                  <textarea
                    value={bewerkTekst}
                    onChange={e => setBewerkTekst(e.target.value)}
                    required
                    rows={3}
                    autoFocus
                    style={{ ...inputStijl, fontFamily: 'inherit', lineHeight: 1.6, resize: 'vertical', padding: '8px 12px', marginBottom: '12px' }}
                  />
                  <label style={{ ...labelStijl, fontSize: '12px' }}>Auteur</label>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <input
                      type="text"
                      value={bewerkAuteur}
                      onChange={e => setBewerkAuteur(e.target.value)}
                      required
                      style={{ ...inputStijl, flex: 1, padding: '8px 12px' }}
                    />
                    <button type="submit" disabled={bewerkOpslaan} style={knopStijl(bewerkOpslaan)}>
                      {bewerkOpslaan ? 'Opslaan...' : 'Opslaan'}
                    </button>
                  </div>
                  {bewerkFout && <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '8px' }}>{bewerkFout}</p>}
                </form>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
    </>
  )
}

const labelStijl = {
  display: 'block', fontSize: '13px', fontWeight: '500', color: '#475569', marginBottom: '6px',
}

const inputStijl = {
  width: '100%', border: '1px solid #e2e8f0', borderRadius: '8px',
  padding: '9px 14px', fontSize: '14px', color: '#0f172a', outline: 'none', background: 'white',
  boxSizing: 'border-box',
}

const knopStijl = (disabled) => ({
  background: '#0f172a', color: 'white', border: 'none', borderRadius: '8px',
  padding: '9px 20px', fontSize: '13px', fontWeight: '600', whiteSpace: 'nowrap',
  cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1,
})
