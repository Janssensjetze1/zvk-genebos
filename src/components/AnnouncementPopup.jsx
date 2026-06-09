import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export function AnnouncementPopup() {
  const { user } = useAuth()
  const [melding, setMelding] = useState(null)
  const [zichtbaar, setZichtbaar] = useState(false)
  const [sluiten, setSluiten] = useState(false)

  useEffect(() => {
    if (!user) return
    laadMelding()
  }, [user])

  async function laadMelding() {
    // Haal de actieve melding op
    const { data: actief } = await supabase
      .from('announcements')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)

    if (!actief?.[0]) return

    const melding = actief[0]

    // Check of de gebruiker deze al gezien heeft
    const { data: gelezen } = await supabase
      .from('announcement_reads')
      .select('announcement_id')
      .eq('announcement_id', melding.id)
      .eq('user_id', user.id)
      .limit(1)

    if (gelezen?.length > 0) return // al gezien

    setMelding(melding)
    setZichtbaar(true)
  }

  async function handleSluiten() {
    setSluiten(true)
    // Markeer als gelezen
    await supabase.from('announcement_reads').insert({
      announcement_id: melding.id,
      user_id: user.id,
    })
    setTimeout(() => {
      setZichtbaar(false)
      setSluiten(false)
    }, 300)
  }

  if (!zichtbaar || !melding) return null

  return (
    <>
      {/* Overlay */}
      <div
        onClick={handleSluiten}
        style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          opacity: sluiten ? 0 : 1,
          transition: 'opacity 0.3s',
        }}
      />

      {/* Pop-up kaart */}
      <div style={{
        position: 'fixed', top: '50%', left: '50%', zIndex: 1001,
        transform: sluiten
          ? 'translate(-50%, -50%) scale(0.92)'
          : 'translate(-50%, -50%) scale(1)',
        opacity: sluiten ? 0 : 1,
        transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s',
        width: 'calc(100% - 48px)',
        maxWidth: '400px',
        background: 'white',
        borderRadius: '20px',
        boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
        overflow: 'hidden',
      }}>

        {/* Emoji sectie */}
        <div style={{
          background: 'linear-gradient(135deg, #0f172a, #1e293b)',
          padding: '28px 24px 20px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '52px', lineHeight: 1 }}>{melding.emoji}</div>
        </div>

        {/* Inhoud */}
        <div style={{ padding: '24px 24px 28px' }}>
          <h2 style={{
            fontSize: '18px', fontWeight: '800', color: '#0f172a',
            marginBottom: '10px', textAlign: 'center',
          }}>
            {melding.title}
          </h2>
          <p style={{
            fontSize: '14px', color: '#475569', lineHeight: 1.65,
            textAlign: 'center', marginBottom: '24px',
          }}>
            {melding.message}
          </p>

          <button
            onClick={handleSluiten}
            style={{
              width: '100%', background: '#0f172a', color: 'white',
              border: 'none', borderRadius: '12px', padding: '13px',
              fontSize: '14px', fontWeight: '700', cursor: 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.target.style.background = '#1e293b'}
            onMouseLeave={e => e.target.style.background = '#0f172a'}
          >
            Begrepen 👍
          </button>
        </div>
      </div>
    </>
  )
}
