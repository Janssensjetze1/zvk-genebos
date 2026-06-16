import { useEffect, useState } from 'react'
import { useConfirm } from '../../components/ConfirmDialog'
import { supabase } from '../../lib/supabase'

export default function AdminLeden() {
  const { bevestig, ConfirmUI } = useConfirm()
  const [profielen, setProfielen] = useState([])
  const [spelers, setSpelers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)

    // Haal alle profielen op (inclusief auth email via admin API gaat niet met anon key,
    // dus we tonen enkel de profieldata + gekoppelde speler)
    const { data: profielData } = await supabase
      .from('profiles')
      .select('*, players(id, name)')
      .order('approved', { ascending: true }) // ongoedgekeurde eerst

    const { data: spelerData } = await supabase
      .from('players')
      .select('id, name')
      .order('name')

    setProfielen(profielData ?? [])
    setSpelers(spelerData ?? [])
    setLoading(false)
  }

  async function keurGoed(profiel) {
    const { error } = await supabase
      .from('profiles')
      .update({ approved: true })
      .eq('id', profiel.id)

    if (!error) fetchData()
  }

  async function weiger(profiel) {
    if (!await bevestig('Weet je zeker dat je dit account wil weigeren en verwijderen?', { gevaar: true, bevestigLabel: 'Verwijderen' })) return
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ userId: profiel.id }),
    })
    if (res.ok) fetchData()
    else alert('Verwijderen mislukt.')
  }

  async function koppelSpeler(profielId, spelerId) {
    await supabase
      .from('profiles')
      .update({ player_id: spelerId || null })
      .eq('id', profielId)

    fetchData()
  }

  async function setRol(profielId, rol) {
    await supabase
      .from('profiles')
      .update({ role: rol })
      .eq('id', profielId)

    fetchData()
  }

  const wachtend = profielen.filter(p => !p.approved)
  const goedgekeurd = profielen.filter(p => p.approved)

  if (loading) return <div className="text-gray-400 text-sm">Laden...</div>

  return (
    <>
    {ConfirmUI}
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Ledenbeheer</h1>
      <p className="text-gray-500 text-sm mb-8">Beheer registraties en koppel accounts aan spelers.</p>

      {/* Wachtend op goedkeuring */}
      <section className="mb-10">
        <h2 className="text-base font-semibold text-gray-700 mb-3 flex items-center gap-2">
          Wachtend op goedkeuring
          {wachtend.length > 0 && (
            <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-0.5 rounded-full">
              {wachtend.length}
            </span>
          )}
        </h2>

        {wachtend.length === 0 ? (
          <p className="text-sm text-gray-400">Geen openstaande aanvragen.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {wachtend.map(profiel => (
              <ProfielKaart
                key={profiel.id}
                profiel={profiel}
                spelers={spelers}
                onGoedkeuren={() => keurGoed(profiel)}
                onWeigeren={() => weiger(profiel)}
                onKoppelSpeler={(spelerId) => koppelSpeler(profiel.id, spelerId)}
                onSetRol={(rol) => setRol(profiel.id, rol)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Goedgekeurde leden */}
      <section>
        <h2 className="text-base font-semibold text-gray-700 mb-3">Actieve leden</h2>
        {goedgekeurd.length === 0 ? (
          <p className="text-sm text-gray-400">Nog geen goedgekeurde leden.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {goedgekeurd.map(profiel => (
              <ProfielKaart
                key={profiel.id}
                profiel={profiel}
                spelers={spelers}
                onKoppelSpeler={(spelerId) => koppelSpeler(profiel.id, spelerId)}
                onSetRol={(rol) => setRol(profiel.id, rol)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
    </>
  )
}

function ProfielKaart({ profiel, spelers, onGoedkeuren, onWeigeren, onKoppelSpeler, onSetRol }) {
  const isWachtend = !profiel.approved

  return (
    <div className={`bg-white rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center gap-4 ${isWachtend ? 'border-orange-200' : 'border-gray-200'}`}>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-mono text-gray-400 truncate">{profiel.id.slice(0, 8)}...</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${profiel.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
            {profiel.role}
          </span>
          {!profiel.approved && (
            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-orange-100 text-orange-700">
              wachtend
            </span>
          )}
        </div>

        {/* Koppeling aan speler */}
        <div className="flex items-center gap-2 mt-2">
          <label className="text-xs text-gray-500 shrink-0">Speler:</label>
          <select
            value={profiel.player_id ?? ''}
            onChange={e => onKoppelSpeler(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-2 py-1 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">— Niet gekoppeld —</option>
            {spelers.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        {/* Rol instellen */}
        <div className="flex items-center gap-2 mt-2">
          <label className="text-xs text-gray-500 shrink-0">Rol:</label>
          <select
            value={profiel.role}
            onChange={e => onSetRol(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-2 py-1 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="member">Lid</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>

      {/* Acties */}
      {isWachtend && (
        <div className="flex gap-2 shrink-0">
          <button
            onClick={onGoedkeuren}
            className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition"
          >
            Goedkeuren
          </button>
          <button
            onClick={onWeigeren}
            className="bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium px-4 py-1.5 rounded-lg transition"
          >
            Weigeren
          </button>
        </div>
      )}
    </div>
  )
}
