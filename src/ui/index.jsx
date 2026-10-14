// Bouwstenen van het ZVK designsysteem. De stijl zit in ./ui.css, hier enkel
// de structuur. Gebruik deze in plaats van losse inline stijlen, zodat elke
// pagina dezelfde koppen, kaarten, knoppen en toestanden heeft.

// Eerste letter hoofdletter, de rest ongemoeid ('vrijdag 16 oktober' → 'Vrijdag 16 oktober')
export const hoofdletter = t => (t ? t.charAt(0).toUpperCase() + t.slice(1) : t)

// ─── Iconen (24×24, lijnstijl) ───────────────────────────────────────────────

const PADEN = {
  home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1v-9.5Z',
  spelers: 'M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M9 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm13 9v-1a4 4 0 0 0-3-3.87M16 4.13a3 3 0 0 1 0 5.74',
  kalender: 'M8 3v4m8-4v4M3.5 10h17M5 5h14a1.5 1.5 0 0 1 1.5 1.5V19a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 19V6.5A1.5 1.5 0 0 1 5 5Z',
  klassement: 'M8 21V11H4v10h4Zm0 0h8m-8 0V5h8v16m0 0h4V14h-4',
  pronostiek: 'M9 18h6m-5 3h4M12 3a6 6 0 0 0-3.6 10.8c.6.45.95 1.1 1 1.8L9.5 16h5l.1-.4c.05-.7.4-1.35 1-1.8A6 6 0 0 0 12 3Z',
  badge: 'M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12Zm-3.5-1.1L7 21l5-3 5 3-1.5-7.1',
  beheer: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7.4-3a7.4 7.4 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7.5 7.5 0 0 0-2-1.2L14.5 3h-5l-.4 2.6a7.5 7.5 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6a7.4 7.4 0 0 0 0 2.4l-2 1.6 2 3.4 2.4-1c.6.5 1.3.9 2 1.2l.4 2.6h5l.4-2.6c.7-.3 1.4-.7 2-1.2l2.4 1 2-3.4-2-1.6c.07-.4.1-.8.1-1.2Z',
  invullen: 'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z',
  afmelden: 'M15 17l5-5-5-5m5 5H9m4 9H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h8',
  chevron: 'm9 6 6 6-6 6',
  chevronOmlaag: 'm6 9 6 6 6-6',
  terug: 'M15 18l-6-6 6-6',
  zoek: 'm21 21-4.3-4.3M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z',
  archief: 'M3 4h18v4H3V4Zm2 4v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8m-9 4h4',
  klok: 'M12 7v5l3 2m6-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
  locatie: 'M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Zm0-9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z',
  bal: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-13 3.8 2.8-1.5 4.5H9.7l-1.5-4.5L12 8Zm0 0V3.5m3.8 7.3 4.7-1.6m-6.2 6.1 2.9 4M9.7 15.3l-2.9 4m1.4-8.5L3.5 9.2',
  assist: 'M5 12h14m-6-6 6 6-6 6',
  shirt: 'M8 3 3 6l2 4 2-1v12h10V9l2 1 2-4-5-3a4 4 0 0 1-8 0Z',
  vink: 'm5 12 5 5L20 7',
  pijlRechts: 'M5 12h14m-5-5 5 5-5 5',
  leeg: 'M4 13h4l2 3h4l2-3h4M5.5 5h13l2.5 8v5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-5l2.5-8Z',
  schild: 'M12 21s8-3.5 8-10V5l-8-2-8 2v6c0 6.5 8 10 8 10Z',
  bel: 'M18 16V11a6 6 0 1 0-12 0v5l-2 2h16l-2-2Zm-8 4a2 2 0 0 0 4 0',
  citaat: 'M7 7h4v4c0 3-1.5 5-4 6m6-10h4v4c0 3-1.5 5-4 6',
  inbox: 'M4 4h16v16H4V4Zm0 10h4l2 3h4l2-3h4',
  ster: 'm12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9L12 3Z',
  meer: 'M5 12h.01M12 12h.01M19 12h.01',
  info: 'M12 16v-5m0-3h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
  chat: 'M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.4A8 8 0 1 1 21 12Z',
  sluit: 'M6 6l12 12M18 6 6 18',
  gebruiker: 'M20 21v-1a5 5 0 0 0-5-5H9a5 5 0 0 0-5 5v1m8-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
  tag: 'M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9-9-9Zm5-4h.01',
  taart: 'M4 21h16M5 21v-7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v7M12 12V8m0-4v.01M5 16c2 1.5 4 1.5 7 0s5-1.5 7 0',
  mail: 'M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm-1 1 9 7 9-7',
  slot: 'M6 11h12a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1Zm2 0V7a4 4 0 0 1 8 0v4',
  wissel: 'M7 4v16m0 0-3-3m3 3 3-3M17 20V4m0 0-3 3m3-3 3 3',
  plus: 'M12 5v14M5 12h14',
  min: 'M5 12h14',
  prullenbak: 'M4 7h16M10 11v6m4-6v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3',
  document: 'M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8l-5-5Zm0 0v5h5M9 13h6m-6 4h6',
  vonk: 'M12 3v4m0 10v4M3 12h4m10 0h4M6 6l2.5 2.5m7 7L18 18M6 18l2.5-2.5m7-7L18 6',
  leden: 'M15 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M8.5 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM19 8v6m3-3h-6',
}

export function Icoon({ naam, grootte = 18, dikte = 1.8, style, className }) {
  return (
    <svg
      width={grootte}
      height={grootte}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={dikte}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={style}
      className={className}
    >
      <path d={PADEN[naam]} />
    </svg>
  )
}

// ─── Pagina ──────────────────────────────────────────────────────────────────

export function PaginaKop({ bovenlabel, titel, ondertitel, children }) {
  return (
    <header className="z-paginakop">
      <div style={{ minWidth: 0 }}>
        {bovenlabel && <div className="z-bovenlabel">{bovenlabel}</div>}
        <h1 className="z-titel">{titel}</h1>
        {ondertitel && <p className="z-ondertitel">{ondertitel}</p>}
      </div>
      {children && <div className="z-paginakop-acties">{children}</div>}
    </header>
  )
}

export function Sectie({ titel, meta, actie, children, style }) {
  return (
    <section className="z-sectie" style={style}>
      {(titel || meta || actie) && (
        <div className="z-sectiekop">
          {titel && <h2>{titel}</h2>}
          {meta && <span className="z-sectiekop-meta">{meta}</span>}
          {actie}
        </div>
      )}
      {children}
    </section>
  )
}

// ─── Kaart ───────────────────────────────────────────────────────────────────

export function Kaart({ children, pad = false, onClick, className = '', style, ...rest }) {
  const klassen = ['z-kaart', pad && 'z-kaart-pad', onClick && 'z-kaart-klik', className].filter(Boolean).join(' ')
  return (
    <div className={klassen} onClick={onClick} style={style} {...rest}>
      {children}
    </div>
  )
}

// Een regel in een lijstkaart. Met onClick wordt hij klikbaar en krijgt hij een pijltje.
export function Rij({ children, onClick, style }) {
  return (
    <div className={`z-rij${onClick ? ' z-rij-klik' : ''}`} onClick={onClick} style={style}>
      {children}
      {onClick && <Icoon naam="chevron" grootte={16} dikte={2} className="z-chevron" />}
    </div>
  )
}

// ─── Knop ────────────────────────────────────────────────────────────────────

export function Knop({ soort = 'standaard', klein = false, icoon, children, className = '', ...rest }) {
  const klassen = ['z-knop', soort !== 'standaard' && `z-knop-${soort}`, klein && 'z-knop-klein', className]
    .filter(Boolean).join(' ')
  return (
    <button type="button" className={klassen} {...rest}>
      {icoon && <Icoon naam={icoon} grootte={klein ? 14 : 16} dikte={2} />}
      {children}
    </button>
  )
}

// ─── Chip ────────────────────────────────────────────────────────────────────

export function Chip({ toon, children, style }) {
  return <span className={`z-chip${toon ? ` z-chip-${toon}` : ''}`} style={style}>{children}</span>
}

const TYPE = {
  competitie: { label: 'Competitie', toon: 'blauw' },
  beker: { label: 'Beker', toon: 'paars' },
  vriendschappelijk: { label: 'Vriendschappelijk', toon: null },
}

export function TypeChip({ type }) {
  const t = TYPE[type]
  if (!t) return null
  return <Chip toon={t.toon}>{t.label}</Chip>
}

export function UitslagLetter({ uitslag }) {
  return <span className={`z-uitslag z-uitslag-${uitslag}`}>{uitslag}</span>
}

// ─── Cijfers ─────────────────────────────────────────────────────────────────

export function Stat({ label, waarde, voet, laden }) {
  return (
    <Kaart className="z-stat">
      <div className="z-stat-label">{label}</div>
      <div className="z-stat-waarde">
        {laden ? <span className="z-skelet" style={{ display: 'inline-block', width: '44px', height: '28px' }} /> : waarde}
      </div>
      {voet && <div className="z-stat-voet">{voet}</div>}
    </Kaart>
  )
}

// ─── Segment ─────────────────────────────────────────────────────────────────

export function Segment({ opties, waarde, onChange, vol = false }) {
  return (
    <div className={`z-segment${vol ? ' z-segment-vol' : ''}`} role="group">
      {opties.map(o => (
        <button key={o.waarde} type="button" aria-pressed={o.waarde === waarde} onClick={() => onChange(o.waarde)}>
          {o.label}
        </button>
      ))}
    </div>
  )
}

// ─── Toestanden ──────────────────────────────────────────────────────────────

export function LegeStaat({ titel, tekst, icoon = 'leeg', children, kaart = true }) {
  const inhoud = (
    <div className="z-leeg">
      <div className="z-leeg-icoon"><Icoon naam={icoon} grootte={20} /></div>
      {titel && <div className="z-leeg-titel">{titel}</div>}
      {tekst && <div>{tekst}</div>}
      {children && <div style={{ marginTop: '16px' }}>{children}</div>}
    </div>
  )
  return kaart ? <Kaart>{inhoud}</Kaart> : inhoud
}

// Skeletregels in een kaart, zolang de gegevens laden
export function Laden({ regels = 3 }) {
  return (
    <Kaart>
      <div className="z-lijst">
        {Array.from({ length: regels }, (_, i) => (
          <div key={i} className="z-rij">
            <span className="z-skelet" style={{ width: '28px', height: '28px', borderRadius: '7px' }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span className="z-skelet" style={{ width: `${55 - i * 8}%`, height: '12px' }} />
              <span className="z-skelet" style={{ width: '30%', height: '10px' }} />
            </div>
          </div>
        ))}
      </div>
    </Kaart>
  )
}

// ─── Avatar ──────────────────────────────────────────────────────────────────

export function Avatar({ naam, foto, grootte = 36, className = '', style }) {
  return (
    <span
      className={`z-avatar ${className}`}
      style={{ width: grootte, height: grootte, fontSize: Math.round(grootte * 0.4), ...style }}
    >
      {foto ? <img src={foto} alt="" /> : (naam ?? '?').charAt(0).toUpperCase()}
    </span>
  )
}

// ─── Schil voor login en registratie ─────────────────────────────────────────

// Op desktop: links een blauw merkvlak met het logo schuin in de achtergrond,
// rechts het formulier. Op telefoon wordt het hele scherm blauw en zweeft het
// formulier erop.
export function AuthSchil({ titel, ondertitel, children }) {
  return (
    <div className="z-auth">
      <aside className="z-auth-merk">
        <img src="/logo.png" alt="" aria-hidden="true" className="z-auth-watermerk" />
        <div className="z-auth-merkrij">
          <img src="/logo.png" alt="ZVK Genebos" />
          <div>
            <div className="z-auth-naam">ZVK GENEBOS</div>
            <div className="z-auth-sub">Sinds 1991</div>
          </div>
        </div>
        <div className="z-auth-slogan">
          <h2>Eerst de punten,<br />dan de pinten.</h2>
          <p>Wedstrijden, klassement, statistieken en pronostiek van de ploeg, allemaal op één plek.</p>
        </div>
      </aside>
      <main className="z-auth-formulier">
        <div className="z-auth-inhoud">
          {titel && (
            <div className="z-auth-kop">
              <h1>{titel}</h1>
              {ondertitel && <p>{ondertitel}</p>}
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  )
}

// ─── PWA ─────────────────────────────────────────────────────────────────────

// Pagina in de app: grote titel bovenaan, inhoud eronder met vaste marges
export function AppPagina({ bovenlabel, titel, ondertitel, actie, children }) {
  return (
    <div className="z-app-pagina">
      {titel && (
        <header className="z-app-kop">
          <div style={{ minWidth: 0, flex: 1 }}>
            {bovenlabel && <div className="z-bovenlabel">{bovenlabel}</div>}
            <h1 className="z-app-titel">{titel}</h1>
            {ondertitel && <p className="z-ondertitel" style={{ marginTop: '4px' }}>{ondertitel}</p>}
          </div>
          {actie}
        </header>
      )}
      {children}
    </div>
  )
}
