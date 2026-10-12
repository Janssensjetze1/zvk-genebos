import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export const CATEGORIEEN = [
  { id: 'bug', label: 'Er is iets kapot', emoji: '🐞', kleur: 'var(--z-verlies)', bg: 'var(--z-verlies-bg)', rand: 'var(--z-verlies-rand)' },
  { id: 'idee', label: 'Ik heb een idee', emoji: '💡', kleur: '#d97706', bg: 'var(--z-gelijk-bg)', rand: 'var(--z-gelijk-rand)' },
  { id: 'andere', label: 'Iets anders', emoji: '💬', kleur: 'var(--z-blauw-500)', bg: 'var(--z-blauw-50)', rand: 'var(--z-blauw-200)' },
]

const MAX_TEKENS = 2000

export default function PWAFeedback() {
  const { user } = useAuth()

  const [categorie, setCategorie] = useState('idee')
  const [bericht, setBericht] = useState('')
  const [versturen, setVersturen] = useState(false)
  const [fout, setFout] = useState('')
  const [verzonden, setVerzonden] = useState(false)
  const [eigen, setEigen] = useState([])

  useEffect(() => { if (user) haalEigen() }, [user])

  async function haalEigen() {
    const { data } = await supabase
      .from('feedback')
      .select('id, categorie, bericht, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)
    setEigen(data ?? [])
  }

  async function verstuur() {
    const tekst = bericht.trim()
    if (!tekst || versturen) return

    setVersturen(true)
    setFout('')

    const { error } = await supabase.from('feedback').insert({
      user_id: user.id,
      categorie,
      bericht: tekst,
    })

    if (error) {
      setFout('Versturen mislukt. Probeer het straks nog eens.')
      setVersturen(false)
      return
    }

    setBericht('')
    setVerzonden(true)
    setVersturen(false)
    await haalEigen()
  }

  const gekozen = CATEGORIEEN.find(c => c.id === categorie)
  const teLang = bericht.length > MAX_TEKENS

  return (
    <div style={{ padding: '28px 16px 24px' }}>
      <h1 className="z-app-titel" style={{ marginBottom: '6px' }}>Feedback</h1>
      <p className="z-ondertitel" style={{ marginBottom: '24px', lineHeight: 1.55 }}>
        Werkt er iets niet, of heb je een idee? Laat het hier achter, het komt
        rechtstreeks bij de beheerders terecht.
      </p>

      {verzonden ? (
        <div style={{
          background: 'var(--z-winst-bg)', border: '1.5px solid var(--z-winst-rand)', borderRadius: '16px',
          padding: '24px 20px', textAlign: 'center', marginBottom: '24px',
        }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>✅</div>
          <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--z-winst)', marginBottom: '4px' }}>
            Bedankt!
          </div>
          <p style={{ fontSize: '13px', color: 'var(--z-winst)', lineHeight: 1.6, marginBottom: '16px' }}>
            Je bericht is verstuurd.
          </p>
          <button
            onClick={() => setVerzonden(false)}
            style={{
              background: 'white', border: '1.5px solid var(--z-winst-rand)', color: 'var(--z-winst)',
              borderRadius: '10px', padding: '9px 16px',
              fontSize: '13px', fontWeight: '600', cursor: 'pointer',
            }}
          >
            Nog iets doorgeven
          </button>
        </div>
      ) : (
        <div style={{
          background: 'white', borderRadius: '16px', border: '1.5px solid var(--z-lijn)',
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)', padding: '16px', marginBottom: '24px',
          display: 'flex', flexDirection: 'column', gap: '14px',
        }}>
          {/* Categorie */}
          <div>
            <div style={{
              fontSize: '11px', fontWeight: '700', color: 'var(--z-tekst-4)',
              textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px',
            }}>
              Waarover gaat het?
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {CATEGORIEEN.map(c => {
                const actief = categorie === c.id
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategorie(c.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '11px 14px', borderRadius: '10px',
                      border: `1.5px solid ${actief ? c.rand : 'var(--z-lijn)'}`,
                      background: actief ? c.bg : 'white',
                      color: actief ? c.kleur : 'var(--z-tekst-3)',
                      fontSize: '13px', fontWeight: actief ? '700' : '500',
                      cursor: 'pointer', textAlign: 'left', width: '100%',
                      transition: 'all 0.15s',
                    }}
                  >
                    <span style={{ fontSize: '15px' }}>{c.emoji}</span>
                    {c.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Bericht */}
          <div>
            <div style={{
              display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
              marginBottom: '8px',
            }}>
              <span style={{
                fontSize: '11px', fontWeight: '700', color: 'var(--z-tekst-4)',
                textTransform: 'uppercase', letterSpacing: '0.05em',
              }}>
                Je bericht
              </span>
              <span style={{ fontSize: '11px', color: teLang ? 'var(--z-verlies)' : 'var(--z-lijn-sterk)' }}>
                {bericht.length}/{MAX_TEKENS}
              </span>
            </div>
            <textarea
              value={bericht}
              onChange={e => setBericht(e.target.value)}
              rows={6}
              placeholder={
                categorie === 'bug'
                  ? 'Wat ging er mis, en waar in de app gebeurde het?'
                  : categorie === 'idee'
                    ? 'Wat zou je graag zien in de app?'
                    : 'Schrijf hier je bericht...'
              }
              style={{
                width: '100%', boxSizing: 'border-box',
                border: '1.5px solid var(--z-lijn)', borderRadius: '10px',
                padding: '12px', fontSize: '14px', color: 'var(--z-tekst)',
                fontFamily: 'inherit', lineHeight: 1.6, resize: 'vertical',
                outline: 'none', background: '#fafafa',
              }}
            />
          </div>

          {fout && (
            <div style={{
              fontSize: '12px', color: '#b91c1c', background: 'var(--z-verlies-bg)',
              border: '1px solid var(--z-verlies-rand)', borderRadius: '10px', padding: '8px 12px',
            }}>
              {fout}
            </div>
          )}

          <button
            onClick={verstuur}
            disabled={!bericht.trim() || teLang || versturen}
            style={{
              width: '100%', padding: '13px',
              borderRadius: '12px', border: 'none',
              background: !bericht.trim() || teLang ? 'var(--z-lijn)' : 'var(--z-tekst)',
              color: !bericht.trim() || teLang ? 'var(--z-tekst-4)' : 'white',
              fontSize: '14px', fontWeight: '700',
              cursor: !bericht.trim() || teLang || versturen ? 'not-allowed' : 'pointer',
              opacity: versturen ? 0.7 : 1,
            }}
          >
            {versturen ? 'Versturen...' : `${gekozen?.emoji ?? ''} Versturen`}
          </button>

          <p style={{ fontSize: '11px', color: 'var(--z-lijn-sterk)', textAlign: 'center', lineHeight: 1.5 }}>
            Je bericht wordt op naam verstuurd, zodat de beheerders kunnen terugkoppelen.
          </p>
        </div>
      )}

      {/* Eigen berichten */}
      {eigen.length > 0 && (
        <div>
          <div style={{
            fontSize: '11px', fontWeight: '700', color: 'var(--z-tekst-4)',
            textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px',
          }}>
            Wat jij al doorgaf
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {eigen.map(f => {
              const cat = CATEGORIEEN.find(c => c.id === f.categorie) ?? CATEGORIEEN[2]
              return (
                <div key={f.id} style={{
                  background: 'white', border: '1px solid var(--z-lijn)', borderRadius: '12px',
                  padding: '12px 14px',
                }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px',
                  }}>
                    <span style={{
                      fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '20px',
                      background: cat.bg, color: cat.kleur, border: `1px solid ${cat.rand}`,
                    }}>
                      {cat.emoji} {cat.label}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--z-lijn-sterk)' }}>
                      {new Date(f.created_at).toLocaleDateString('nl-BE', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  <p style={{
                    fontSize: '13px', color: 'var(--z-tekst-2)', lineHeight: 1.6,
                    whiteSpace: 'pre-wrap', margin: 0,
                  }}>
                    {f.bericht}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
