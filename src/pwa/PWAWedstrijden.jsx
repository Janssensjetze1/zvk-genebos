import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useSeason } from '../context/SeasonContext'

const TYPE_COLORS = {
  competitie: { bg: '#eff6ff', color: '#1d4ed8' },
  beker: { bg: '#fdf4ff', color: '#9333ea' },
  vriendschappelijk: { bg: '#f0fdf4', color: '#16a34a' },
}
const TYPE_LABELS = { competitie: 'Competitie', beker: 'Beker', vriendschappelijk: 'Vriendschappelijk' }

export default function PWAWedstrijden() {
  const { actief: seizoen } = useSeason()
  const [wedstrijden, setWedstrijden] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('aankomend')

  useEffect(() => { if (seizoen) fetchWedstrijden() }, [seizoen])

  async function fetchWedstrijden() {
    setLoading(true)
    const { data } = await supabase
      .from('matches')
      .select('*, home_team:home_team_id(id,name,is_zvk), away_team:away_team_id(id,name,is_zvk), goals(id,scorer_id,scorer:scorer_id(name))')
      .eq('season_id', seizoen.id)
      .order('date', { ascending: true })
    setWedstrijden(data ?? [])
    setLoading(false)
  }

  const vandaag = new Date().toISOString().split('T')[0]
  const zvkWedstrijden = wedstrijden.filter(w => w.home_team?.is_zvk || w.away_team?.is_zvk)
  const aankomend = zvkWedstrijden.filter(w => w.date >= vandaag)
  const gespeeld = zvkWedstrijden.filter(w => w.date < vandaag).reverse()

  return (
    <div style={{ padding: '20px 16px' }}>
      <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', marginBottom: '16px' }}>Wedstrijden</h1>

      {/* Tabs */}
      <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '10px', padding: '3px', marginBottom: '20px' }}>
        {[['aankomend', 'Aankomend'], ['gespeeld', 'Gespeeld']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            flex: 1, padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            fontSize: '13px', fontWeight: tab === id ? '700' : '500',
            background: tab === id ? 'white' : 'transparent',
            color: tab === id ? '#0f172a' : '#64748b',
            boxShadow: tab === id ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
          }}>{label}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>Laden...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {(tab === 'aankomend' ? aankomend : gespeeld).map(w => (
            <WedstrijdKaart key={w.id} wedstrijd={w} />
          ))}
          {(tab === 'aankomend' ? aankomend : gespeeld).length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px', color: '#94a3b8', fontSize: '14px' }}>
              Geen wedstrijden gevonden.
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function WedstrijdKaart({ wedstrijd: w }) {
  const isThuis = w.home_team?.is_zvk
  const tegenstander = isThuis ? w.away_team : w.home_team
  const zvkScore = isThuis ? w.home_score : w.away_score
  const tegScore = isThuis ? w.away_score : w.home_score
  const isPast = w.date < new Date().toISOString().split('T')[0]
  const gewonnen = isPast && zvkScore > tegScore
  const verloren = isPast && zvkScore < tegScore
  const datum = new Date(w.date)

  const dagNaam = datum.toLocaleDateString('nl-BE', { weekday: 'short' })
  const dagNr = datum.getDate()
  const maand = datum.toLocaleDateString('nl-BE', { month: 'short' })

  return (
    <div style={{
      background: 'white', borderRadius: '16px', padding: '16px',
      border: `1.5px solid ${gewonnen ? '#bbf7d0' : verloren ? '#fecaca' : '#e2e8f0'}`,
      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Datum */}
        <div style={{
          width: '48px', textAlign: 'center', flexShrink: 0,
          background: '#f8fafc', borderRadius: '10px', padding: '8px 4px',
          border: '1px solid #e2e8f0',
        }}>
          <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600' }}>{dagNaam}</div>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', lineHeight: 1.1 }}>{dagNr}</div>
          <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600' }}>{maand}</div>
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '15px', fontWeight: '600', color: '#0f172a', marginBottom: '5px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            vs {tegenstander?.name}
          </div>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span style={{
              fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '20px',
              ...TYPE_COLORS[w.type],
            }}>{TYPE_LABELS[w.type]}</span>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>{isThuis ? 'Thuis' : 'Uit'}</span>
          </div>
        </div>

        {/* Score / status */}
        <div style={{ flexShrink: 0, textAlign: 'right' }}>
          {isPast ? (
            <>
              <div style={{ fontSize: '22px', fontWeight: '900', color: '#0f172a', letterSpacing: '-1px' }}>
                {zvkScore}–{tegScore}
              </div>
              <div style={{
                fontSize: '11px', fontWeight: '700',
                color: gewonnen ? '#16a34a' : verloren ? '#ef4444' : '#64748b',
              }}>
                {gewonnen ? '✓ Gewonnen' : verloren ? '✗ Verloren' : '= Gelijkspel'}
              </div>
            </>
          ) : (
            <span style={{
              fontSize: '12px', color: '#64748b', background: '#f1f5f9',
              borderRadius: '8px', padding: '5px 10px', fontWeight: '500',
            }}>Gepland</span>
          )}
        </div>
      </div>

      {/* Doelpunten */}
      {isPast && w.goals?.length > 0 && (
        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #f1f5f9', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {w.goals.map(g => (
            <span key={g.id} style={{ fontSize: '12px', color: '#475569', background: '#f8fafc', borderRadius: '20px', padding: '3px 10px', border: '1px solid #e2e8f0' }}>
              ⚽ {g.scorer?.name}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
