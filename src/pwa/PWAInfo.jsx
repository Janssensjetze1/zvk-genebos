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
        Alles wat je moet weten om de app te gebruiken. Tik op een onderwerp om het open te klappen.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

        <Sectie emoji="✋" titel="Je opgeven voor een wedstrijd" standaardOpen>
          <p>
            Bij elke aankomende wedstrijd op het tabblad <span style={vet}>Wedstrijden</span> staan drie knoppen.
            Duid aan wat voor jou van toepassing is:
          </p>
          <Stap nr="✅"><span style={vet}>Ik doen mee</span> — je speelt mee.</Stap>
          <Stap nr="❌"><span style={vet}>Ik doen nie mee</span> — je bent er niet bij.</Stap>
          <Stap nr="👀"><span style={vet}>Ik kom zien</span> — je komt kijken, maar speelt niet mee.</Stap>
          <p>
            Onder de knoppen staat <span style={vet}>Wie gaf zich op</span> met de tussenstand. Tik erop om de
            namen open te klappen, zo weet je meteen of er genoeg volk is. Van gedacht veranderd?
            Tik gewoon op een andere knop. Nog eens op je eigen keuze duwen wist ze helemaal.
          </p>
          <Tip>
            ⏱️ <span style={vet}>Wanneer kan je je opgeven?</span> De opgave gaat open op de woensdag van de week
            van de wedstrijd, om 10 uur 's ochtends. Je krijgt dan een melding op je telefoon als je die aan hebt
            staan. Daarvoor zie je de knoppen nog niet staan.
          </Tip>
          <Tip>
            🔟 <span style={vet}>Maximum {MAX_MEE} spelers.</span> Zijn de {MAX_MEE} plekken vol, dan kan je niet meer
            op "Ik doen mee" duwen. Er is geen wachtlijst — valt er iemand af, dan komt die plek gewoon weer vrij,
            dus het loont om er snel bij te zijn.
          </Tip>
        </Sectie>

        <Sectie emoji="📅" titel="Wedstrijden">
          <p>
            Bovenaan schakel je tussen <span style={vet}>Aankomend</span> en <span style={vet}>Gespeeld</span>.
            Bij aankomende wedstrijden zie je de datum, het uur, of het thuis of uit is, en de opgave.
          </p>
          <p>
            Een gespeelde wedstrijd kan je opentikken. Daar vind je wie gescoord heeft, wie er meespeelde,
            en soms een wedstrijdverslag. Onderaan elke gespeelde wedstrijd staan ook emoji's — laat er eentje
            achter om te tonen wat je van de match vond.
          </p>
        </Sectie>

        <Sectie emoji="🏆" titel="De stand">
          <p>
            Het klassement wordt volledig automatisch berekend uit de uitslagen: 3 punten voor een winst,
            1 voor een gelijkspel, 0 voor een verlies. Ook wedstrijden tussen de andere ploegen onderling
            tellen mee, zodat de stand altijd klopt.
          </p>
          <p>
            Er staat niks manueel ingetikt — zie je iets vreemds, dan zit er een fout in een uitslag.
          </p>
        </Sectie>

        <Sectie emoji="⭐" titel="Stats en spelers">
          <p>
            Bij <span style={vet}>Stats</span> zie je de doelpunten, assists en topscorers van het seizoen.
            Bij <span style={vet}>Spelers</span> vind je iedereen met zijn foto en cijfers.
          </p>
          <p>
            Alles wordt per seizoen bijgehouden, dus oudere seizoenen blijven bewaard.
          </p>
          <Tip>
            👑 <span style={vet}>Topscorer en assistenkoning.</span> Wie dit seizoen het meest scoort krijgt overal
            een glanzend gouden randje rond zijn foto, wie het meest assists geeft een paars randje — allebei met
            een kroontje. Staan er twee gelijk, dan krijgen ze het allebei.
          </Tip>
        </Sectie>

        <Sectie emoji="🏅" titel="Badges">
          <p>
            Tik rechtsonder op de drie puntjes en kies <span style={vet}>Badges</span>. Daar staat je verzameling:
            wat je al verdiend hebt en wat er nog te halen valt, netjes per categorie —
            <span style={vet}> brons, zilver, goud, platina</span> en <span style={vet}>legendary</span>. Achter elke
            categorie staat hoeveel je er daar al van hebt.
          </p>
          <p>
            De meeste badges krijg je automatisch zodra je aan de voorwaarde voldoet: hoeveel wedstrijden je
            speelde, hoeveel je scoorde, hoeveel assists je gaf en hoe vaak de tegenstander niet scoorde terwijl
            jij op het veld stond. Een paar worden door de admin toegekend. En er is een categorie
            <span style={vet}> geheim</span>: die badges blijven met een ❓ verborgen tot er iemand ze krijgt.
          </p>
          <Tip>
            👥 De badges van je ploegmaats zie je bij <span style={vet}>Spelers</span>, als je iemand aantikt.
          </Tip>
        </Sectie>

        <Sectie emoji="🔮" titel="Pronostiek">
          <p>
            Voorspel de score van élke wedstrijd uit het seizoen — ook die van de tegenstanders onderling — en
            verzamel punten. Je vindt het achter de drie puntjes bij
            <span style={vet}> Pronostiek</span>, en de invoer staat ook gewoon onder de wedstrijd zelf.
          </p>
          <p>
            <span style={vet}>5 punten</span> voor de exacte score, <span style={vet}>3</span> als het doelsaldo klopt
            (je zei 4-2, het werd 5-3), <span style={vet}>1</span> als je enkel de juiste afloop had. Ben je de énige
            met de exacte score, dan komt daar nog een <span style={vet}>durfbonus</span> bovenop.
          </p>
          <Tip>
            ⏱️ Voorspellen kan vanaf een week voor de wedstrijd tot een uur voor de aftrap. Aanpassen mag zoveel je
            wil, en niemand ziet jouw score tot de pronostiek sluit.
          </Tip>
        </Sectie>

        <Sectie emoji="👤" titel="Je profiel en meldingen">
          <p>
            Onder <span style={vet}>Instellingen</span> — achter de drie puntjes, of gewoon op je profielfoto
            linksboven tikken — pas je je naam aan en zet je een profielfoto. Die foto zie je
            terug bij de spelers.
          </p>
          <p>
            Daar kan je ook <span style={vet}>push notificaties</span> aanzetten. Zo krijg je een melding op je
            telefoon bij nieuws over een wedstrijd, ook als de app dicht staat. Je kan dat op elk moment weer
            uitzetten.
          </p>
        </Sectie>

        <Sectie emoji="📲" titel="De app op je telefoon">
          <p>
            De app werkt enkel als geïnstalleerde app, niet in de gewone browser. Op iPhone doe je dat via
            Safari → deelknop → <span style={vet}>Zet op beginscherm</span>. Op Android via het menu van Chrome →
            <span style={vet}> App installeren</span>.
          </p>
          <p>
            Trek de pagina naar beneden om te verversen. En als er eens iets niet laadt: sluit de app volledig
            af en open ze opnieuw.
          </p>
        </Sectie>

        <Sectie emoji="🔐" titel="Toegang en accounts">
          <p>
            De app is enkel voor leden. Wie zich registreert, moet eerst goedgekeurd worden door een admin —
            tot dan zie je een wachtscherm.
          </p>
          <p>
            Je account wordt door de admin gekoppeld aan je spelersfiche. Zolang dat niet gebeurd is, kan je je
            niet opgeven voor een wedstrijd. Zie je die knoppen niet staan terwijl anderen ze wel hebben?
            Laat het dan even weten.
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
