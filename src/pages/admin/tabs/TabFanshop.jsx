import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { Knop, Kaart, TabKop, Melding, LegeStaat } from '../ui'
import { inputStijl, labelStijl } from '../stijlen'
import { ConfirmDialog } from '../../../components/ConfirmDialog'
import { euro, bestelStatus, matenUitTekst } from '../../../lib/fanshop'
import { Chip, Segment } from '../../../ui'
import { SHOP_GEWIJZIGD } from '../../../hooks/useShopOpen'

const STATUS_FILTERS = [
  { id: 'alles', label: 'Alles' },
  { id: 'besteld', label: 'Nog te betalen' },
  { id: 'betaald', label: 'Af te geven' },
  { id: 'afgegeven', label: 'Afgegeven' },
]

export default function TabFanshop({ onGewijzigd }) {
  const [instellingen, setInstellingen] = useState(null)
  const [producten, setProducten] = useState([])
  const [bestellingen, setBestellingen] = useState([])
  const [loading, setLoading] = useState(true)
  const [weergave, setWeergave] = useState('bestellingen')

  useEffect(() => { laden() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function laden() {
    const [inst, prod, best] = await Promise.all([
      supabase.from('shop_instellingen').select('*').maybeSingle(),
      supabase.from('shop_producten').select('*').order('volgorde').order('created_at'),
      supabase
        .from('shop_bestellingen')
        .select('*, profiles:user_id(display_name, email, avatar_url)')
        .order('created_at', { ascending: true }),
    ])
    setInstellingen(inst.data)
    setProducten(prod.data ?? [])
    setBestellingen(best.data ?? [])
    setLoading(false)
    onGewijzigd?.()
  }

  if (loading) {
    return <p style={{ fontSize: '14px', color: 'var(--z-tekst-4)' }}>Laden...</p>
  }

  return (
    <div>
      <TabKop titel="Fanshop" subtitel="Merchandise van de club. Betalen gebeurt buiten de app." />

      <Winkel instellingen={instellingen} onBewaard={laden} />

      <div style={{ margin: '20px 0 16px' }}>
        <Segment
          opties={[
            { waarde: 'bestellingen', label: `Bestellingen (${bestellingen.length})` },
            { waarde: 'producten', label: `Producten (${producten.length})` },
          ]}
          waarde={weergave}
          onChange={setWeergave}
        />
      </div>

      {weergave === 'bestellingen'
        ? <Bestellingen bestellingen={bestellingen} setBestellingen={setBestellingen} producten={producten} herlaad={laden} />
        : <Producten producten={producten} bestellingen={bestellingen} herlaad={laden} />}
    </div>
  )
}

function naamVan(b) {
  return b.profiles?.display_name || b.profiles?.email || 'Onbekend'
}

// ─── Winkel open of dicht ────────────────────────────────────────────────────

function Winkel({ instellingen, onBewaard }) {
  const [uitleg, setUitleg] = useState(instellingen?.uitleg ?? '')
  const [bezig, setBezig] = useState(false)
  const [melding, setMelding] = useState(null)
  const open = instellingen?.open ?? false

  async function bewaar(velden, tekst) {
    setBezig(true)
    setMelding(null)
    const { error } = await supabase
      .from('shop_instellingen')
      .update({ ...velden, updated_at: new Date().toISOString() })
      .eq('id', true)
    setBezig(false)
    setMelding(error ? { soort: 'fout', tekst: 'Opslaan mislukt.' } : { soort: 'goed', tekst })
    if (!error) {
      window.dispatchEvent(new Event(SHOP_GEWIJZIGD))
      onBewaard()
    }
  }

  return (
    <Kaart style={{ padding: '18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '14px' }}>
        <div style={{ flex: 1, minWidth: '180px' }}>
          <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--z-tekst)' }}>
            De fanshop is {open ? 'open' : 'gesloten'}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--z-tekst-3)', marginTop: '2px' }}>
            {open
              ? 'De fanshop staat in het menu. Leden kunnen bestellen en hun bestellingen aanpassen.'
              : 'De fanshop staat voor niemand in het menu. Hier in het beheer kan je alles klaarzetten.'}
          </div>
        </div>
        <Knop soort={open ? 'gevaar' : 'vol'} disabled={bezig} onClick={() => bewaar({ open: !open }, open ? 'De fanshop is gesloten.' : 'De fanshop staat open.')}>
          {open ? 'Fanshop sluiten' : 'Fanshop openen'}
        </Knop>
      </div>

      <label style={labelStijl} htmlFor="shop-uitleg">Uitleg bovenaan de fanshop (optioneel)</label>
      <textarea
        id="shop-uitleg"
        value={uitleg}
        onChange={e => setUitleg(e.target.value.slice(0, 1000))}
        rows={2}
        placeholder="Bijvoorbeeld: bestellen kan tot 15 november, levering half december in de kantine"
        style={{ ...inputStijl, fontFamily: 'inherit', resize: 'vertical', marginBottom: '10px' }}
      />
      {melding && <Melding soort={melding.soort} style={{ marginBottom: '10px' }}>{melding.tekst}</Melding>}
      <Knop disabled={bezig || uitleg.trim() === (instellingen?.uitleg ?? '')} onClick={() => bewaar({ uitleg: uitleg.trim() || null }, 'Uitleg opgeslagen.')}>
        Uitleg opslaan
      </Knop>
    </Kaart>
  )
}

// ─── Bestellingen ────────────────────────────────────────────────────────────

function Bestellingen({ bestellingen, setBestellingen, producten, herlaad }) {
  const [productFilter, setProductFilter] = useState('alles')
  const [statusFilter, setStatusFilter] = useState('alles')
  const [teVerwijderen, setTeVerwijderen] = useState(null)

  const productNaam = id => producten.find(p => p.id === id)?.naam ?? 'Product'
  const vanProduct = productFilter === 'alles' ? bestellingen : bestellingen.filter(b => b.product_id === productFilter)
  const zichtbaar = statusFilter === 'alles' ? vanProduct : vanProduct.filter(b => bestelStatus(b).id === statusFilter)

  const stuks = lijst => lijst.reduce((t, b) => t + b.aantal, 0)
  const bedrag = lijst => lijst.reduce((t, b) => t + b.aantal * b.prijs, 0)
  const onbetaald = vanProduct.filter(b => !b.betaald_at)
  const afTeGeven = vanProduct.filter(b => b.betaald_at && !b.afgegeven_at)

  async function zetVink(b, veld) {
    const waarde = b[veld] ? null : new Date().toISOString()
    // Afgeven zonder betaald te zijn kan, maar dan zetten we betaald ook aan
    const velden = veld === 'afgegeven_at' && waarde && !b.betaald_at
      ? { afgegeven_at: waarde, betaald_at: waarde }
      : { [veld]: waarde }
    setBestellingen(lijst => lijst.map(x => x.id === b.id ? { ...x, ...velden } : x))
    await supabase.from('shop_bestellingen').update(velden).eq('id', b.id)
    herlaad()
  }

  async function verwijder() {
    const b = teVerwijderen
    setTeVerwijderen(null)
    await supabase.from('shop_bestellingen').delete().eq('id', b.id)
    herlaad()
  }

  if (bestellingen.length === 0) {
    return <LegeStaat emoji="🛍️" titel="Nog geen bestellingen" tekst="Zodra leden iets bestellen, verschijnt het hier." />
  }

  return (
    <div>
      {/* Totalen */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginBottom: '16px' }}>
        <Totaal label="Stuks besteld" waarde={stuks(vanProduct)} voet={`${vanProduct.length} ${vanProduct.length === 1 ? 'bestelling' : 'bestellingen'}`} />
        <Totaal label="Nog te innen" waarde={euro(bedrag(onbetaald))} voet={`${onbetaald.length} niet betaald`} />
        <Totaal label="Af te geven" waarde={stuks(afTeGeven)} voet="betaald, nog niet afgegeven" />
        <Totaal label="Totaalbedrag" waarde={euro(bedrag(vanProduct))} />
      </div>

      {/* Wat moet er besteld worden bij de leverancier */}
      <Leverancier bestellingen={bestellingen} producten={producten} />

      {/* Filters */}
      <div style={{ display: 'flex', gap: '8px', margin: '16px 0 14px', flexWrap: 'wrap', alignItems: 'center' }}>
        {producten.length > 1 && (
          <select value={productFilter} onChange={e => setProductFilter(e.target.value)} style={{ ...inputStijl, width: 'auto', padding: '7px 12px' }}>
            <option value="alles">Alle producten</option>
            {producten.map(p => <option key={p.id} value={p.id}>{p.naam}</option>)}
          </select>
        )}
        {STATUS_FILTERS.map(f => {
          const actief = statusFilter === f.id
          const aantal = f.id === 'alles' ? vanProduct.length : vanProduct.filter(b => bestelStatus(b).id === f.id).length
          return (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '7px 14px', borderRadius: '20px',
                border: `1px solid ${actief ? 'var(--z-tekst)' : 'var(--z-lijn)'}`,
                background: actief ? 'var(--z-donker)' : 'var(--z-kaart)',
                color: actief ? 'white' : 'var(--z-tekst-3)',
                fontSize: '13px', fontWeight: actief ? '600' : '500',
                cursor: 'pointer', transition: 'all 0.12s',
              }}
            >
              {f.label}
              <span style={{ fontSize: '11px', fontWeight: '700', color: actief ? 'rgba(255,255,255,0.6)' : 'var(--z-lijn-sterk)' }}>
                {aantal}
              </span>
            </button>
          )
        })}
      </div>

      {zichtbaar.length === 0 ? (
        <LegeStaat emoji="🔍" titel="Niets in deze lijst" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {zichtbaar.map(b => (
            <BestelRij
              key={b.id}
              bestelling={b}
              productNaam={productNaam(b.product_id)}
              onVink={veld => zetVink(b, veld)}
              onVerwijder={() => setTeVerwijderen(b)}
            />
          ))}
        </div>
      )}

      {teVerwijderen && (
        <ConfirmDialog
          bericht={`De bestelling van ${naamVan(teVerwijderen)} (${teVerwijderen.aantal}× ${productNaam(teVerwijderen.product_id)}) verwijderen?`}
          bevestigLabel="Verwijderen"
          gevaar
          onBevestig={verwijder}
          onAnnuleer={() => setTeVerwijderen(null)}
        />
      )}
    </div>
  )
}

// Per product (en per maat) hoeveel stuks er besteld zijn
function Leverancier({ bestellingen, producten }) {
  const rijen = producten
    .map(p => {
      const eigen = bestellingen.filter(b => b.product_id === p.id)
      const perMaat = p.maten.length > 0
        ? p.maten.map(m => ({ maat: m, stuks: eigen.filter(b => b.maat === m).reduce((t, b) => t + b.aantal, 0) })).filter(x => x.stuks > 0)
        : []
      return { product: p, stuks: eigen.reduce((t, b) => t + b.aantal, 0), perMaat }
    })
    .filter(r => r.stuks > 0)

  if (rijen.length === 0) return null

  return (
    <Kaart style={{ padding: '14px 16px' }}>
      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--z-tekst-4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
        Te bestellen bij de leverancier
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {rijen.map(r => (
          <div key={r.product.id} style={{ display: 'flex', alignItems: 'baseline', gap: '10px', flexWrap: 'wrap', fontSize: '14px' }}>
            <strong style={{ color: 'var(--z-tekst)' }}>{r.stuks}×</strong>
            <span style={{ color: 'var(--z-tekst)' }}>{r.product.naam}</span>
            {r.perMaat.length > 0 && (
              <span style={{ fontSize: '12px', color: 'var(--z-tekst-3)' }}>
                {r.perMaat.map(x => `${x.maat}: ${x.stuks}`).join(' · ')}
              </span>
            )}
          </div>
        ))}
      </div>
    </Kaart>
  )
}

function BestelRij({ bestelling: b, productNaam, onVink, onVerwijder }) {
  const naam = naamVan(b)
  const status = bestelStatus(b)
  const initialen = naam.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()

  return (
    <Kaart style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
      <div style={{
        flexShrink: 0, width: '36px', height: '36px', borderRadius: '50%', overflow: 'hidden',
        background: 'var(--z-lijn-zacht)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '13px', fontWeight: 700, color: 'var(--z-tekst-3)',
      }}>
        {b.profiles?.avatar_url
          ? <img src={b.profiles.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : initialen}
      </div>

      <div style={{ flex: 1, minWidth: '140px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--z-tekst)' }}>{naam}</span>
          <Chip toon={status.toon}>{status.label}</Chip>
        </div>
        <div style={{ fontSize: '13px', color: 'var(--z-tekst-2)', marginTop: '2px' }}>
          {b.aantal}× {productNaam}{b.maat && ` · maat ${b.maat}`}
          <span style={{ color: 'var(--z-tekst-4)' }}>
            {' · '}{euro(b.aantal * b.prijs)}{' · '}{new Date(b.created_at).toLocaleDateString('nl-BE', { day: 'numeric', month: 'short' })}
          </span>
        </div>
        {b.opmerking && (
          <div style={{ fontSize: '13px', color: 'var(--z-tekst-3)', marginTop: '4px', whiteSpace: 'pre-wrap' }}>“{b.opmerking}”</div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
        <Vink actief={!!b.betaald_at} onClick={() => onVink('betaald_at')}>Betaald</Vink>
        <Vink actief={!!b.afgegeven_at} onClick={() => onVink('afgegeven_at')}>Afgegeven</Vink>
        <Knop soort="stil" klein onClick={onVerwijder} aria-label="Verwijderen" title="Verwijderen">✕</Knop>
      </div>
    </Kaart>
  )
}

// ─── Producten ───────────────────────────────────────────────────────────────

function Producten({ producten, bestellingen, herlaad }) {
  const [bewerk, setBewerk] = useState(null) // product, of {} voor een nieuw
  const [teVerwijderen, setTeVerwijderen] = useState(null)
  const [fout, setFout] = useState('')

  async function verwijder() {
    const p = teVerwijderen
    setTeVerwijderen(null)
    const { error } = await supabase.from('shop_producten').delete().eq('id', p.id)
    setFout(error ? 'Verwijderen mislukt.' : '')
    herlaad()
  }

  if (bewerk) {
    return <ProductFormulier product={bewerk} onKlaar={() => { setBewerk(null); herlaad() }} onAnnuleer={() => setBewerk(null)} />
  }

  return (
    <div>
      <div style={{ marginBottom: '12px' }}>
        <Knop soort="vol" onClick={() => setBewerk({})}>+ Product toevoegen</Knop>
      </div>
      {fout && <Melding soort="fout" style={{ marginBottom: '12px' }}>{fout}</Melding>}

      {producten.length === 0 ? (
        <LegeStaat emoji="🛍️" titel="Nog geen producten" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {producten.map(p => {
            const aantal = bestellingen.filter(b => b.product_id === p.id).length
            return (
              <Kaart key={p.id} style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', opacity: p.actief ? 1 : 0.6 }}>
                {p.foto_url
                  ? <img src={p.foto_url} alt="" style={{ width: '56px', height: '40px', objectFit: 'cover', borderRadius: '6px', flexShrink: 0 }} />
                  : <div style={{ width: '56px', height: '40px', borderRadius: '6px', flexShrink: 0, background: 'repeating-linear-gradient(135deg, var(--z-blauw) 0 8px, #fff 8px 16px)' }} />}
                <div style={{ flex: 1, minWidth: '140px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--z-tekst)' }}>{p.naam}</span>
                    {!p.actief && <Chip>Niet te koop</Chip>}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--z-tekst-4)', marginTop: '2px' }}>
                    {euro(p.prijs)}
                    {p.maten.length > 0 && ` · maten ${p.maten.join(', ')}`}
                    {p.max_per_lid && ` · max ${p.max_per_lid} per lid`}
                    {` · ${aantal} ${aantal === 1 ? 'bestelling' : 'bestellingen'}`}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <Knop klein onClick={() => setBewerk(p)}>Bewerken</Knop>
                  {/* Met bestellingen kan een product niet weg; dan zet je het op 'niet te koop' */}
                  {aantal === 0 && <Knop klein soort="stil" onClick={() => setTeVerwijderen(p)} aria-label="Verwijderen" title="Verwijderen">✕</Knop>}
                </div>
              </Kaart>
            )
          })}
        </div>
      )}

      {teVerwijderen && (
        <ConfirmDialog
          bericht={`${teVerwijderen.naam} verwijderen?`}
          bevestigLabel="Verwijderen"
          gevaar
          onBevestig={verwijder}
          onAnnuleer={() => setTeVerwijderen(null)}
        />
      )}
    </div>
  )
}

function ProductFormulier({ product, onKlaar, onAnnuleer }) {
  const nieuw = !product.id
  const [naam, setNaam] = useState(product.naam ?? '')
  const [omschrijving, setOmschrijving] = useState(product.omschrijving ?? '')
  const [prijs, setPrijs] = useState(product.prijs != null ? String(product.prijs) : '')
  const [maten, setMaten] = useState((product.maten ?? []).join(', '))
  const [maximum, setMaximum] = useState(product.max_per_lid ? String(product.max_per_lid) : '')
  const [volgorde, setVolgorde] = useState(String(product.volgorde ?? 0))
  const [actief, setActief] = useState(product.actief ?? true)
  const [foto, setFoto] = useState(null)
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState('')

  async function bewaar() {
    setFout('')
    const prijsGetal = Number(prijs.replace(',', '.'))
    const maxGetal = maximum.trim() ? Number(maximum) : null
    const volgordeGetal = Number(volgorde) || 0
    if (!naam.trim()) return setFout('Geef het product een naam.')
    if (!prijs.trim() || !Number.isFinite(prijsGetal) || prijsGetal < 0) return setFout('Vul een geldige prijs in.')
    if (maxGetal !== null && (!Number.isInteger(maxGetal) || maxGetal < 1 || maxGetal > 50)) {
      return setFout('Het maximum per lid moet tussen 1 en 50 liggen.')
    }

    setBezig(true)
    let foto_url = product.foto_url ?? null
    if (foto) {
      const ext = foto.name.split('.').pop()
      const pad = `fanshop/${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('player-photos').upload(pad, foto, { upsert: true })
      if (error) {
        setBezig(false)
        return setFout('De foto kon niet geüpload worden.')
      }
      foto_url = supabase.storage.from('player-photos').getPublicUrl(pad).data.publicUrl
    }

    const velden = {
      naam: naam.trim(),
      omschrijving: omschrijving.trim() || null,
      prijs: prijsGetal,
      maten: matenUitTekst(maten),
      max_per_lid: maxGetal,
      volgorde: volgordeGetal,
      actief,
      foto_url,
    }
    const { error } = nieuw
      ? await supabase.from('shop_producten').insert(velden)
      : await supabase.from('shop_producten').update(velden).eq('id', product.id)

    setBezig(false)
    if (error) return setFout('Opslaan mislukt.')
    onKlaar()
  }

  return (
    <Kaart style={{ padding: '18px' }}>
      <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--z-tekst)', marginBottom: '14px' }}>
        {nieuw ? 'Nieuw product' : `${product.naam} bewerken`}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '12px' }}>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStijl} htmlFor="p-naam">Naam</label>
          <input id="p-naam" value={naam} onChange={e => setNaam(e.target.value.slice(0, 80))} placeholder="Bijvoorbeeld: ZVK-T-shirt" style={inputStijl} />
        </div>
        <div>
          <label style={labelStijl} htmlFor="p-prijs">Prijs (€)</label>
          <input id="p-prijs" inputMode="decimal" value={prijs} onChange={e => setPrijs(e.target.value)} style={inputStijl} />
        </div>
        <div>
          <label style={labelStijl} htmlFor="p-max">Maximum per lid</label>
          <input id="p-max" inputMode="numeric" value={maximum} onChange={e => setMaximum(e.target.value)} placeholder="Geen maximum" style={inputStijl} />
        </div>
        <div>
          <label style={labelStijl} htmlFor="p-maten">Maten (komma's ertussen)</label>
          <input id="p-maten" value={maten} onChange={e => setMaten(e.target.value)} placeholder="Leeg = geen maten, bv. S, M, L, XL" style={inputStijl} />
        </div>
        <div>
          <label style={labelStijl} htmlFor="p-volgorde">Volgorde</label>
          <input id="p-volgorde" inputMode="numeric" value={volgorde} onChange={e => setVolgorde(e.target.value)} style={inputStijl} />
        </div>
      </div>

      <label style={labelStijl} htmlFor="p-omschrijving">Omschrijving (optioneel)</label>
      <textarea
        id="p-omschrijving"
        value={omschrijving}
        onChange={e => setOmschrijving(e.target.value.slice(0, 1000))}
        rows={2}
        style={{ ...inputStijl, fontFamily: 'inherit', resize: 'vertical', marginBottom: '12px' }}
      />

      <label style={labelStijl} htmlFor="p-foto">Foto</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px', flexWrap: 'wrap' }}>
        {product.foto_url && !foto && (
          <img src={product.foto_url} alt="" style={{ width: '64px', height: '40px', objectFit: 'cover', borderRadius: '6px' }} />
        )}
        <input id="p-foto" type="file" accept="image/*" onChange={e => setFoto(e.target.files?.[0] ?? null)} style={{ fontSize: '13px' }} />
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--z-tekst-2)', marginBottom: '14px', cursor: 'pointer' }}>
        <input type="checkbox" checked={actief} onChange={e => setActief(e.target.checked)} />
        Te koop in de fanshop
      </label>

      {!nieuw && product.prijs != null && Number(prijs.replace(',', '.')) !== Number(product.prijs) && (
        <Melding soort="let" style={{ marginBottom: '12px' }}>
          Een nieuwe prijs geldt enkel voor nieuwe bestellingen. Wie al bestelde, betaalt de oude prijs.
        </Melding>
      )}
      {fout && <Melding soort="fout" style={{ marginBottom: '12px' }}>{fout}</Melding>}

      <div style={{ display: 'flex', gap: '8px' }}>
        <Knop soort="vol" disabled={bezig} onClick={bewaar}>{bezig ? 'Bezig...' : 'Opslaan'}</Knop>
        <Knop onClick={onAnnuleer} disabled={bezig}>Annuleren</Knop>
      </div>
    </Kaart>
  )
}

// ─── Onderdelen ──────────────────────────────────────────────────────────────

function Totaal({ label, waarde, voet }) {
  return (
    <Kaart style={{ padding: '12px 14px' }}>
      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--z-tekst-4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--z-tekst)', marginTop: '4px' }}>{waarde}</div>
      {voet && <div style={{ fontSize: '12px', color: 'var(--z-tekst-4)', marginTop: '2px' }}>{voet}</div>}
    </Kaart>
  )
}

function Vink({ actief, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={actief}
      style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        padding: '6px 10px', borderRadius: 'var(--z-r-s)', cursor: 'pointer',
        border: `1px solid ${actief ? 'var(--z-winst-rand)' : 'var(--z-lijn)'}`,
        background: actief ? 'var(--z-winst-bg)' : 'var(--z-kaart)',
        color: actief ? 'var(--z-winst)' : 'var(--z-tekst-3)',
        fontSize: '12px', fontWeight: 600,
      }}
    >
      <span style={{
        width: '14px', height: '14px', borderRadius: '4px', flexShrink: 0,
        border: `1.5px solid ${actief ? 'var(--z-winst)' : 'var(--z-lijn-sterk)'}`,
        background: actief ? 'var(--z-winst)' : 'transparent',
        color: 'white', fontSize: '10px', lineHeight: '11px', textAlign: 'center',
      }}>
        {actief ? '✓' : ''}
      </span>
      {children}
    </button>
  )
}
