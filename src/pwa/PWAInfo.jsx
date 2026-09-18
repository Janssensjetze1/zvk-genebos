import { useState } from 'react'
import { MAX_MEE } from '../hooks/useOpgave'

// ─── Info: hoe werkt de app? ─────────────────────────────────────────────────

function Sectie({ emoji, titel, standaardOpen = false, children }) {
  const [open, setOpen] = useState(standaardOpen)

  return (
    <div style={{
      background: 'white', borderRadius: '16px', border: '1.5px solid #e2e8f0',
      boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden',
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
          padding: '15px 16px', background: 'none', border: 'none',
          cursor: 'pointer', textAlign: 'left',
        }}
      >
        <span style={{ fontSize: '20px', flexShrink: 0 }}>{emoji}</span>
        <span style={{ flex: 1, fontSize: '15px', fontWeight: '600', color: '#0f172a' }}>{titel}</span>
        <svg width="14" height="14" fill="none" stroke="#cbd5e1" strokeWidth="2" viewBox="0 0 24 24"
          style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div style={{
          padding: '2px 16px 16px', borderTop: '1px solid #f1f5f9',
          fontSize: '13px', color: '#475569', lineHeight: 1.65,
        }}>
          <div style={{ paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {children}
          </div>
        </div>
      )}
    </div>
  )
}

function Stap({ nr, children }) {
  return (
    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
      <span style={{
        flexShrink: 0, width: '20px', height: '20px', borderRadius: '50%',
        background: '#f1f5f9', color: '#64748b',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '11px', fontWeight: '700', marginTop: '1px',
      }}>{nr}</span>
      <span>{children}</span>
    </div>
  )
}

function Tip({ children }) {
  return (
    <div style={{
      background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px',
      padding: '10px 12px', fontSize: '12px', color: '#64748b',
    }}>
      {children}
    </div>
  )
}

const vet = { fontWeight: '600', color: '#0f172a' }

export default function PWAInfo() {
  return (
    <div style={{ padding: '20px 16px' }}>
      <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>Info</h1>
      <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '20px', lineHeight: 1.6 }}>
        Tik op een onderwerp om het open te klappen.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

        <Sectie emoji="✋" titel="Je opgeven voor een wedstrijd" standaardOpen>
          <p>
            Bij elke aankomende wedstrijd staan drie knoppen:
          </p>
          <Stap nr="✅"><span style={vet}>Ik doen mee</span></Stap>
          <Stap nr="❌"><span style={vet}>Ik doen nie mee</span></Stap>
          <Stap nr="👀"><span style={vet}>Ik kom zien</span>, je komt kijken maar speelt niet mee</Stap>
          <p>
            Tik op een andere knop om te wisselen, nog eens op dezelfde om je keuze te wissen. Onder de knoppen
            zie je wie zich al opgaf.
          </p>
          <Tip>
            ⏱️ De opgave opent woensdag om 10u van de week van de wedstrijd. Je krijgt dan een melding als je
            die aan hebt staan.
          </Tip>
          <Tip>
            🔟 Maximum {MAX_MEE} spelers, geen wachtlijst. Valt er iemand af, dan komt die plek weer vrij.
          </Tip>
        </Sectie>

        <Sectie emoji="📅" titel="Wedstrijden">
          <p>
            Bovenaan wissel je tussen <span style={vet}>Aankomend</span> en <span style={vet}>Gespeeld</span>.
            Tik een wedstrijd aan voor de details: de pronostiek, wie er speelde, de doelpunten en het verslag.
          </p>
          <p>
            Onder een gespeelde wedstrijd staan emoji's. Laat er gerust eentje achter.
          </p>
        </Sectie>

        <Sectie emoji="🏆" titel="De stand">
          <p>
            Het klassement komt automatisch uit de uitslagen: 3 punten voor winst, 1 voor gelijkspel, 0 voor
            verlies. Ook de matchen tussen de andere ploegen tellen mee.
          </p>
          <p>
            Klopt er iets niet, dan zit de fout in een uitslag.
          </p>
        </Sectie>

        <Sectie emoji="⭐" titel="Stats en spelers">
          <p>
            Bij <span style={vet}>Stats</span> staan de doelpunten, assists en topscorers. Bij
            <span style={vet}> Spelers</span> vind je iedereen met foto en cijfers. Alles wordt per seizoen
            bewaard.
          </p>
          <Tip>
            👑 De topscorer krijgt een gouden ring rond zijn foto, de assistenkoning een paarse. Staan er twee
            gelijk, dan krijgen ze het allebei.
          </Tip>
        </Sectie>

        <Sectie emoji="🏅" titel="Badges">
          <p>
            Te vinden achter de drie puntjes. Per categorie zie je wat je hebt en wat er nog te halen valt.
          </p>
          <p>
            De meeste krijg je automatisch: gespeelde wedstrijden, goals, assists, de nul houden en de
            pronostiek. Die laatste verdient elk lid, ook zonder spelersfiche. Een paar badges kent de admin
            toe, en de geheime blijven verborgen tot iemand ze krijgt.
          </p>
          <Tip>
            👥 De badges van je ploegmaats zie je bij <span style={vet}>Spelers</span>, als je iemand aantikt.
          </Tip>
        </Sectie>

        <Sectie emoji="🔮" titel="Pronostiek">
          <p>
            Voorspel de score van elke wedstrijd van het seizoen, ook die van de tegenstanders onderling.
            Invullen doe je op de pagina van de wedstrijd zelf.
          </p>
          <p>
            <span style={vet}>5 punten</span> voor de exacte score, <span style={vet}>3</span> als het doelsaldo
            klopt (je zei 4-2, het werd 5-3), <span style={vet}>1</span> voor de juiste afloop. Als enige de
            exacte score juist? Dan krijg je er een bonuspunt bij.
          </p>
          <Tip>
            ⏱️ Van een week voor de wedstrijd tot een uur voor de aftrap, aanpassen mag zoveel je wil. Zodra je
            zelf invult, zie je wat de rest gokte.
          </Tip>
        </Sectie>

        <Sectie emoji="👤" titel="Je profiel en meldingen">
          <p>
            Bij <span style={vet}>Instellingen</span> pas je je naam aan en zet je een profielfoto. Je raakt er
            via de drie puntjes of via je foto linksboven.
          </p>
          <p>
            Daar zet je ook <span style={vet}>meldingen</span> aan of uit. Die komen binnen bij nieuws over een
            wedstrijd, ook als de app dicht staat.
          </p>
        </Sectie>

        <Sectie emoji="📲" titel="De app op je telefoon">
          <p>
            De app werkt enkel geïnstalleerd, niet in de gewone browser. Op iPhone via Safari, de deelknop en
            <span style={vet}> Zet op beginscherm</span>. Op Android via het menu van Chrome en
            <span style={vet}> App installeren</span>.
          </p>
          <p>
            Trek de pagina naar beneden om te verversen. Laadt er iets niet, sluit de app dan volledig af en
            open ze opnieuw.
          </p>
        </Sectie>

        <Sectie emoji="🔐" titel="Toegang en accounts">
          <p>
            De app is enkel voor leden. Een admin keurt nieuwe accounts goed en koppelt ze aan je spelersfiche.
          </p>
          <p>
            Zolang die koppeling er niet is, kan je je niet opgeven voor een wedstrijd. Zie je de knoppen niet
            staan terwijl anderen ze wel hebben, laat het dan weten.
          </p>
        </Sectie>

      </div>

      <p style={{
        fontSize: '12px', color: '#cbd5e1', textAlign: 'center',
        marginTop: '24px', lineHeight: 1.6,
      }}>
        Iets kapot, of een idee voor de app?<br />
        Gebruik <span style={{ fontWeight: '600', color: '#94a3b8' }}>Feedback</span> in ditzelfde menu.
      </p>
    </div>
  )
}
