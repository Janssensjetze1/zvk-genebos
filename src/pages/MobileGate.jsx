export default function MobileGate() {
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
  const isAndroid = /android/i.test(navigator.userAgent)

  return (
    <div style={{
      minHeight: '100vh', background: '#0f172a',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '32px 24px', textAlign: 'center',
    }}>
      {/* Logo */}
      <div style={{
        width: '88px', height: '88px', borderRadius: '22px',
        background: 'white', display: 'flex', alignItems: 'center',
        justifyContent: 'center', marginBottom: '28px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}>
        <img src="/logo.png" alt="ZVK" style={{ width: '66px', height: '66px', objectFit: 'contain' }} />
      </div>

      <h1 style={{ color: 'white', fontSize: '24px', fontWeight: '800', marginBottom: '10px', letterSpacing: '-0.5px' }}>
        ZVK Genebos
      </h1>
      <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '15px', lineHeight: 1.6, marginBottom: '40px', maxWidth: '280px' }}>
        Installeer de app op je startscherm voor de beste ervaring op mobile.
      </p>

      {/* Instructies */}
      <div style={{
        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '20px', padding: '24px', width: '100%', maxWidth: '340px',
        marginBottom: '24px',
      }}>
        {isIOS && (
          <>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '20px' }}>
              Installeren op iPhone
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Stap nr={1} tekst="Open deze pagina in Safari" />
              <Stap nr={2} tekst={<>Tik op het deel-icoontje <span style={{ fontSize: '16px' }}>⬆</span> onderaan</>} />
              <Stap nr={3} tekst={<>Kies <strong style={{ color: 'white' }}>"Voeg toe aan startscherm"</strong></>} />
              <Stap nr={4} tekst="Open de app vanuit je startscherm" />
            </div>
          </>
        )}

        {isAndroid && (
          <>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '20px' }}>
              Installeren op Android
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <Stap nr={1} tekst="Open deze pagina in Chrome" />
              <Stap nr={2} tekst={<>Tik op de <strong style={{ color: 'white' }}>⋮</strong> menu bovenaan</>} />
              <Stap nr={3} tekst={<>Kies <strong style={{ color: 'white' }}>"Toevoegen aan startscherm"</strong></>} />
              <Stap nr={4} tekst="Open de app vanuit je startscherm" />
            </div>
          </>
        )}

        {!isIOS && !isAndroid && (
          <>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', marginBottom: '8px' }}>
              Open deze pagina op je smartphone en installeer de app via het menu van je browser.
            </p>
          </>
        )}
      </div>
    </div>
  )
}

function Stap({ nr, tekst }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', textAlign: 'left' }}>
      <div style={{
        width: '26px', height: '26px', borderRadius: '50%', flexShrink: 0,
        background: '#3b82f6', color: 'white',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '12px', fontWeight: '700',
      }}>{nr}</div>
      <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', lineHeight: 1.5, margin: 0, paddingTop: '3px' }}>
        {tekst}
      </p>
    </div>
  )
}
