import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Chip, Icoon, Laden } from '../ui'
import { MAX_AANTAL, euro, bestelStatus, shopFout } from '../lib/fanshop'
import { ConfirmDialog } from './ConfirmDialog'

// De ZVK-fanshop, gedeeld door de app (PWAFanshop) en desktop (FanshopPagina).
// Bovenaan een hero in clubblauw, daaronder de collectie en je eigen
// bestellingen als kassabon. Een product aanklikken opent een paneel om te
// bestellen. Per product en maat heeft een lid één bestelregel; zolang de
// winkel open is en er niet betaald is, kan je die nog aanpassen of annuleren.
// Betalen gebeurt buiten de app. Stijlen: .z-shop-* in ui/ui.css.

export default function Fanshop() {
  const { user } = useAuth()

  const [instellingen, setInstellingen] = useState(null)
  const [producten, setProducten] = useState([])
  const [mijn, setMijn] = useState([])
  const [laden, setLaden] = useState(true)
  const [gekozen, setGekozen] = useState(null)
  const bonRef = useRef(null)

  useEffect(() => { if (user) haal() }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  async function haal() {
    const [inst, prod, best] = await Promise.all([
      supabase.from('shop_instellingen').select('open, uitleg').maybeSingle(),
      supabase.from('shop_producten').select('*').order('volgorde').order('created_at'),
      supabase.from('shop_bestellingen').select('*').eq('user_id', user.id).order('created_at'),
    ])
    setInstellingen(inst.data)
    setProducten(prod.data ?? [])
    setMijn(best.data ?? [])
    setLaden(false)
  }

  const open = instellingen?.open ?? false
  const zichtbaar = producten.filter(p => p.actief)
  const stuks = mijn.reduce((t, b) => t + b.aantal, 0)
  const product = gekozen && producten.find(p => p.id === gekozen)

  return (
    <div className="z-shop">
      <Held
        open={open}
        uitleg={instellingen?.uitleg}
        stuks={stuks}
        onMandje={() => bonRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
      />

      {laden ? <Laden regels={3} /> : (
        <>
          <section>
            <div className="z-shop-kop">
              <h2>Collectie</h2>
              {zichtbaar.length > 0 && <span>{zichtbaar.length} {zichtbaar.length === 1 ? 'product' : 'producten'}</span>}
            </div>

            {zichtbaar.length === 0 ? (
              <LegeCollectie />
            ) : (
              <div className="z-shop-raster">
                {zichtbaar.map((p, i) => (
                  <ProductTegel
                    key={p.id}
                    product={p}
                    besteld={mijn.filter(b => b.product_id === p.id).reduce((t, b) => t + b.aantal, 0)}
                    vertraging={i * 70}
                    onClick={() => setGekozen(p.id)}
                  />
                ))}
              </div>
            )}
          </section>

          {mijn.length > 0 && (
            <div ref={bonRef} style={{ scrollMarginTop: '80px' }}>
              <Kassabon bestellingen={mijn} producten={producten} />
            </div>
          )}
        </>
      )}

      {product && (
        <ProductPaneel
          product={product}
          open={open}
          regels={mijn.filter(b => b.product_id === product.id)}
          userId={user.id}
          onGewijzigd={haal}
          onSluit={() => setGekozen(null)}
        />
      )}
    </div>
  )
}

// ─── Hero ────────────────────────────────────────────────────────────────────

function Held({ open, uitleg, stuks, onMandje }) {
  return (
    <header className="z-shop-held">
      <img src="/logo.png" alt="" aria-hidden="true" className="z-shop-held-logo" />
      <div className="z-shop-bovenlabel">Officiële merchandise</div>
      <h1 className="z-shop-titel">ZVK-<span>fanshop</span></h1>
      <p>
        {uitleg || (open
          ? 'Draag de club met trots. Bestel hieronder; je betaalt cash of via overschrijving aan een beheerder.'
          : 'De fanshop is momenteel gesloten. Zodra er een nieuwe bestelronde start, kan je hier bestellen.')}
      </p>
      <div className="z-shop-held-rij">
        <span className={`z-shop-status${open ? '' : ' z-shop-status-dicht'}`}>
          <i />
          {open ? 'Nu open voor bestellingen' : 'Gesloten'}
        </span>
        {stuks > 0 && (
          <button type="button" className="z-shop-mandje" onClick={onMandje}>
            <Icoon naam="winkel" grootte={15} dikte={2.2} />
            Jouw bestelling · {stuks}
          </button>
        )}
      </div>
    </header>
  )
}

// ─── Galerij ─────────────────────────────────────────────────────────────────

function ProductTegel({ product: p, besteld, vertraging, onClick }) {
  return (
    <button type="button" className="z-shop-product" onClick={onClick} style={{ animationDelay: `${vertraging}ms` }}>
      <div className="z-shop-beeld">
        <ProductBeeld url={p.foto_url} naam={p.naam} />
        <span className="z-shop-prijs">{euro(p.prijs)}</span>
        {besteld > 0 && (
          <span className="z-shop-lint">
            <Icoon naam="vink" grootte={12} dikte={3} />
            In je bestelling · {besteld}
          </span>
        )}
      </div>
      <div className="z-shop-info">
        <div className="z-shop-naam">{p.naam}</div>
        {p.omschrijving && <div className="z-shop-tekst">{p.omschrijving}</div>}
        <div className="z-shop-voet">
          <div className="z-shop-maten">
            {p.maten.map(m => <span key={m}>{m}</span>)}
          </div>
          <span className="z-shop-pijl"><Icoon naam="chevron" grootte={16} dikte={2.4} /></span>
        </div>
      </div>
    </button>
  )
}

// Foto van het product, of zolang er geen is een sjaal met het logo
function ProductBeeld({ url, naam }) {
  if (url) return <img src={url} alt={naam} className="z-shop-foto" />
  return (
    <div className="z-shop-plaats">
      <img src="/logo.png" alt="" />
    </div>
  )
}

function LegeCollectie() {
  return (
    <div className="z-shop-bon" style={{ padding: '36px 24px', textAlign: 'center' }}>
      <div className="z-icoonvak" style={{ width: '52px', height: '52px', borderRadius: '16px', margin: '0 auto 14px' }}>
        <Icoon naam="winkel" grootte={24} />
      </div>
      <div style={{ fontFamily: 'var(--z-font-merk)', fontSize: '19px', color: 'var(--z-tekst)', marginBottom: '6px' }}>
        De rekken worden gevuld
      </div>
      <p style={{ fontSize: '14px', color: 'var(--z-tekst-3)', margin: 0, lineHeight: 1.55 }}>
        Binnenkort verschijnen hier de eerste producten.
      </p>
    </div>
  )
}

// ─── Kassabon ────────────────────────────────────────────────────────────────

function Kassabon({ bestellingen, producten }) {
  const naam = id => producten.find(p => p.id === id)?.naam ?? 'Product'
  const totaal = bestellingen.reduce((t, b) => t + b.aantal * b.prijs, 0)
  const teBetalen = bestellingen.filter(b => !b.betaald_at).reduce((t, b) => t + b.aantal * b.prijs, 0)

  return (
    <section className="z-shop-bon" aria-label="Jouw bestellingen">
      <div className="z-shop-bon-kop">
        <span className="z-icoonvak"><Icoon naam="document" grootte={20} /></span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--z-font-merk)', fontSize: '18px', color: 'var(--z-tekst)' }}>Jouw bestellingen</div>
          <div style={{ fontSize: '12px', color: 'var(--z-tekst-4)' }}>Besteld → betaald → afgegeven</div>
        </div>
      </div>
      <div className="z-shop-bon-scheur" />

      {bestellingen.map(b => {
        const status = bestelStatus(b)
        return (
          <div key={b.id} className="z-shop-bon-regel">
            <span className="z-shop-bon-aantal">{b.aantal}×</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--z-tekst)' }}>
                {naam(b.product_id)}{b.maat && <span style={{ color: 'var(--z-tekst-4)', fontWeight: 500 }}> · maat {b.maat}</span>}
              </div>
              <div className="z-shop-stappen" aria-hidden="true">
                <span className="klaar" />
                <span className={b.betaald_at ? 'klaar' : ''} />
                <span className={b.afgegeven_at ? 'klaar' : ''} />
              </div>
            </div>
            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--z-tekst)', fontVariantNumeric: 'tabular-nums' }}>{euro(b.aantal * b.prijs)}</span>
              <Chip toon={status.toon}>{status.label}</Chip>
            </div>
          </div>
        )
      })}

      <div className="z-shop-bon-totaal">
        <div>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--z-tekst-4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {teBetalen > 0 ? 'Nog te betalen' : 'Alles betaald'}
          </div>
          {teBetalen > 0 && (
            <div style={{ fontSize: '12px', color: 'var(--z-tekst-3)', marginTop: '2px' }}>Cash of via overschrijving aan een beheerder</div>
          )}
        </div>
        <strong>{euro(teBetalen > 0 ? teBetalen : totaal)}</strong>
      </div>
    </section>
  )
}

// ─── Bestellen ───────────────────────────────────────────────────────────────

function ProductPaneel({ product: p, open, regels, userId, onGewijzigd, onSluit }) {
  const heeftMaten = p.maten.length > 0
  const [maat, setMaat] = useState(heeftMaten ? (regels[0]?.maat ?? '') : '')
  const huidige = regels.find(r => r.maat === maat) ?? null

  const [aantal, setAantal] = useState(huidige?.aantal ?? 1)
  const [opmerking, setOpmerking] = useState(huidige?.opmerking ?? '')
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState('')
  const [melding, setMelding] = useState('')
  const [annuleren, setAnnuleren] = useState(false)

  useEffect(() => {
    const sluit = e => { if (e.key === 'Escape') onSluit() }
    window.addEventListener('keydown', sluit)
    return () => window.removeEventListener('keydown', sluit)
  }, [onSluit])

  // Bij een andere maat het formulier vullen met wat je daarvoor al bestelde
  function kiesMaat(m) {
    const r = regels.find(x => x.maat === m)
    setMaat(m)
    setAantal(r?.aantal ?? 1)
    setOpmerking(r?.opmerking ?? '')
    setFout('')
    setMelding('')
  }

  // Het maximum per lid geldt over alle maten samen
  const elders = regels.filter(r => r.maat !== maat).reduce((t, r) => t + r.aantal, 0)
  const maximum = Math.max(1, (p.max_per_lid ?? MAX_AANTAL) - elders)
  const betaald = !!huidige?.betaald_at
  const maatOntbreekt = heeftMaten && maat === ''
  const kanBestellen = open && !betaald && !maatOntbreekt
  const ongewijzigd = huidige && huidige.aantal === aantal && (huidige.opmerking ?? '') === opmerking.trim()

  async function bewaar() {
    if (bezig) return
    setBezig(true)
    setFout('')
    setMelding('')

    const velden = { aantal, opmerking: opmerking.trim() || null }
    const { error } = huidige
      ? await supabase.from('shop_bestellingen').update(velden).eq('id', huidige.id)
      : await supabase.from('shop_bestellingen').insert({ ...velden, user_id: userId, product_id: p.id, maat })

    setBezig(false)
    if (error) {
      setFout(shopFout(error))
      return
    }
    setMelding(huidige ? 'Je bestelling is aangepast.' : 'Toegevoegd aan je bestellingen!')
    onGewijzigd()
  }

  async function annuleer() {
    setAnnuleren(false)
    setBezig(true)
    setFout('')
    setMelding('')
    const { error } = await supabase.from('shop_bestellingen').delete().eq('id', huidige.id)
    setBezig(false)
    if (error) {
      setFout(shopFout(error))
      return
    }
    setAantal(1)
    setOpmerking('')
    setMelding('Geannuleerd.')
    onGewijzigd()
  }

  const knopTekst = bezig
    ? 'Even geduld...'
    : huidige ? 'Wijziging opslaan' : `Bestellen · ${euro(aantal * p.prijs)}`

  return (
    <>
      <div className="z-sheet-achter" onClick={onSluit} />
      <div className="z-paneel z-shop-paneel" role="dialog" aria-modal="true" aria-label={p.naam}>
        <div className="z-paneel-inhoud">
          <div className="z-shop-paneel-beeld">
            <ProductBeeld url={p.foto_url} naam={p.naam} />
            <button type="button" className="z-shop-sluit" onClick={onSluit} aria-label="Sluiten">
              <Icoon naam="sluit" grootte={18} dikte={2.2} />
            </button>
            <span className="z-shop-prijs">{euro(p.prijs)}</span>
          </div>

          <div>
            <h2 style={{ fontFamily: 'var(--z-font-merk)', fontSize: '26px', lineHeight: 1.15, color: 'var(--z-tekst)', margin: '0 0 8px' }}>{p.naam}</h2>
            {p.omschrijving && (
              <p style={{ fontSize: '14px', color: 'var(--z-tekst-3)', lineHeight: 1.65, margin: 0, whiteSpace: 'pre-wrap' }}>{p.omschrijving}</p>
            )}
          </div>

          {!open ? (
            <Melding soort="info">De fanshop is gesloten. Je kan nu niet bestellen of wijzigen.</Melding>
          ) : (
            <>
              {heeftMaten && (
                <div>
                  <div className="z-veldlabel">Kies je maat</div>
                  <div className="z-shop-maatknoppen">
                    {p.maten.map(m => (
                      <button key={m} type="button" className="z-shop-maatknop" aria-pressed={maat === m} onClick={() => kiesMaat(m)}>
                        {m}
                        {regels.some(r => r.maat === m) && <i title="Al besteld" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {betaald ? (
                <Melding soort="info">Deze bestelling is al betaald en kan niet meer gewijzigd worden.</Melding>
              ) : !maatOntbreekt && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                    <div>
                      <div className="z-veldlabel">Aantal</div>
                      <div className="z-shop-teller">
                        <button type="button" aria-label="Eén minder" onClick={() => setAantal(a => Math.max(1, a - 1))} disabled={aantal <= 1}>
                          <Icoon naam="min" grootte={18} dikte={2.4} />
                        </button>
                        <output aria-live="polite">{aantal}</output>
                        <button type="button" aria-label="Eén meer" onClick={() => setAantal(a => Math.min(maximum, a + 1))} disabled={aantal >= maximum}>
                          <Icoon naam="plus" grootte={18} dikte={2.4} />
                        </button>
                      </div>
                    </div>
                    <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                      <div className="z-veldlabel">Totaal</div>
                      <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--z-tekst)', fontVariantNumeric: 'tabular-nums', lineHeight: '46px' }}>
                        {euro(aantal * p.prijs)}
                      </div>
                    </div>
                  </div>
                  {p.max_per_lid && (
                    <p style={{ fontSize: '12px', color: 'var(--z-tekst-4)', margin: '-12px 0 0' }}>
                      Maximaal {p.max_per_lid} per lid{heeftMaten ? ', alle maten samen' : ''}.
                    </p>
                  )}

                  <div>
                    <label className="z-veldlabel" htmlFor="shop-opmerking">Opmerking (optioneel)</label>
                    <textarea
                      id="shop-opmerking"
                      value={opmerking}
                      onChange={e => setOpmerking(e.target.value.slice(0, 500))}
                      rows={2}
                      placeholder="Bijvoorbeeld: eentje is voor mijn vader"
                      style={{
                        width: '100%', boxSizing: 'border-box',
                        border: '1.5px solid var(--z-lijn)', borderRadius: '12px',
                        padding: '12px 14px', fontSize: '14px', color: 'var(--z-tekst)',
                        fontFamily: 'inherit', lineHeight: 1.5, resize: 'vertical',
                        outline: 'none', background: 'var(--z-kaart)',
                      }}
                    />
                  </div>
                </>
              )}
            </>
          )}

          {fout && <Melding soort="fout">{fout}</Melding>}
          {melding && <Melding soort="goed">{melding}</Melding>}
        </div>

        {open && !betaald && (
          <div className="z-paneel-voet">
            {huidige && (
              <button type="button" className="z-knop z-knop-gevaar" style={{ height: '50px', borderRadius: '14px' }} onClick={() => setAnnuleren(true)} disabled={bezig}>
                Annuleren
              </button>
            )}
            <button type="button" className="z-shop-cta" onClick={bewaar} disabled={bezig || ongewijzigd || !kanBestellen}>
              {maatOntbreekt ? 'Kies eerst een maat' : knopTekst}
            </button>
          </div>
        )}
      </div>

      {annuleren && (
        <ConfirmDialog
          bericht={`Je bestelling van ${p.naam}${maat ? ` (maat ${maat})` : ''} annuleren?`}
          bevestigLabel="Annuleren"
          annuleerLabel="Toch houden"
          gevaar
          onBevestig={annuleer}
          onAnnuleer={() => setAnnuleren(false)}
        />
      )}
    </>
  )
}

function Melding({ soort, children }) {
  const kleuren = {
    goed: ['var(--z-winst-bg)', 'var(--z-winst-rand)', 'var(--z-winst)'],
    fout: ['var(--z-verlies-bg)', 'var(--z-verlies-rand)', 'var(--z-verlies)'],
    info: ['var(--z-vlak)', 'var(--z-lijn)', 'var(--z-tekst-2)'],
  }[soort]
  return (
    <div role={soort === 'fout' ? 'alert' : 'status'} style={{
      fontSize: '13px', lineHeight: 1.5, borderRadius: '12px', padding: '11px 14px',
      background: kleuren[0], border: `1px solid ${kleuren[1]}`, color: kleuren[2],
    }}>
      {children}
    </div>
  )
}
