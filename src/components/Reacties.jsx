import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

// Emoji-reacties onder een gespeelde wedstrijd. Haalt zelf de reacties op.
const EMOJIS = ['💪', '❤️', '🎯', '😭']

export default function Reacties({ wedstrijdId, style }) {
  const { user } = useAuth()
  const [reacties, setReacties] = useState([])
  const [gepopt, setGepopt] = useState(null)

  useEffect(() => {
    let levend = true
    supabase.from('match_reactions').select('emoji, user_id').eq('match_id', wedstrijdId)
      .then(({ data }) => { if (levend) setReacties(data ?? []) })
    return () => { levend = false }
  }, [wedstrijdId])

  const mijne = reacties.find(r => r.user_id === user?.id)?.emoji ?? null
  const tellers = {}
  for (const r of reacties) tellers[r.emoji] = (tellers[r.emoji] ?? 0) + 1

  async function reageer(emoji) {
    if (!user) return
    setGepopt(emoji)
    setTimeout(() => setGepopt(null), 350)
    if (mijne === emoji) {
      setReacties(prev => prev.filter(r => r.user_id !== user.id))
      await supabase.from('match_reactions').delete().eq('match_id', wedstrijdId).eq('user_id', user.id)
    } else {
      setReacties(prev => [...prev.filter(r => r.user_id !== user.id), { emoji, user_id: user.id }])
      await supabase.from('match_reactions').upsert(
        { match_id: wedstrijdId, user_id: user.id, emoji },
        { onConflict: 'match_id,user_id' },
      )
    }
  }

  return (
    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', ...style }} onClick={e => e.stopPropagation()}>
      {EMOJIS.map(emoji => {
        const aantal = tellers[emoji] ?? 0
        const actief = mijne === emoji
        return (
          <button
            key={emoji}
            type="button"
            onClick={() => reageer(emoji)}
            className={gepopt === emoji ? 'emoji-pop' : ''}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '5px',
              height: '30px', padding: '0 10px', borderRadius: '99px',
              border: `1px solid ${actief ? 'var(--z-blauw-200)' : 'var(--z-lijn)'}`,
              background: actief ? 'var(--z-blauw-50)' : 'var(--z-kaart)',
              cursor: 'pointer', fontSize: '14px',
            }}
          >
            {emoji}
            {aantal > 0 && (
              <span className="z-tab-nums" style={{ fontSize: '12px', fontWeight: 600, color: actief ? 'var(--z-blauw)' : 'var(--z-tekst-3)' }}>
                {aantal}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
