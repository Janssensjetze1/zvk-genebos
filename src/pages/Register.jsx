import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { AuthSchil } from '../ui'

export default function Register() {
  const { signUp } = useAuth()
  const [voornaam, setVoornaam] = useState('')
  const [naam, setNaam] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await signUp(email, password, voornaam.trim(), naam.trim())
    setLoading(false)
    if (error) setError(error.message)
    else setDone(true)
  }

  if (done) return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--z-vlak)',
      padding: '24px 20px',
    }}>
      <div style={{ textAlign: 'center', maxWidth: '360px' }}>
        <div style={{ fontSize: '52px', marginBottom: '20px' }}>✅</div>
        <h2 style={{ color: 'var(--z-tekst)', fontSize: '22px', fontWeight: '700', marginBottom: '10px' }}>Aanvraag verstuurd!</h2>
        <p style={{ color: 'var(--z-tekst-3)', fontSize: '14px', lineHeight: 1.7, marginBottom: '28px' }}>
          Je aanvraag is verstuurd. Een admin keurt ze goed.
        </p>
        <Link to="/login" style={{
          display: 'inline-block', color: 'var(--z-blauw-500)', fontSize: '14px',
          textDecoration: 'none', fontWeight: '500',
          background: 'var(--z-blauw-50)', padding: '10px 20px',
          borderRadius: '10px', border: '1px solid var(--z-blauw-200)',
        }}>
          ← Terug naar login
        </Link>
      </div>
    </div>
  )

  return (
    <AuthSchil>
      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{
          width: '72px', height: '72px', borderRadius: '20px',
          background: 'white', border: '1px solid var(--z-lijn)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 18px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
        }}>
          <img src="/logo.png" alt="ZVK" style={{ width: '52px', height: '52px', objectFit: 'contain' }} />
        </div>
        <h1 style={{ color: 'var(--z-tekst)', fontSize: '26px', fontWeight: '700', letterSpacing: '-0.5px', marginBottom: '6px' }}>
          Word lid!
        </h1>
        <p style={{ color: 'var(--z-tekst-4)', fontSize: '14px' }}>
          Maak uw account aan voor ZVK Genebos
        </p>
      </div>

      {/* Card */}
      <div style={{
        width: '100%', maxWidth: '400px',
        background: 'white',
        border: '1px solid var(--z-lijn)',
        borderRadius: '20px', padding: '28px 24px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
      }}>
        {error && (
          <div style={{
            background: 'var(--z-verlies-bg)', border: '1px solid var(--z-verlies-rand)',
            color: 'var(--z-verlies)', fontSize: '13px', borderRadius: '10px',
            padding: '10px 14px', marginBottom: '18px', textAlign: 'center',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <Input label="Voornaam" type="text" value={voornaam} onChange={e => setVoornaam(e.target.value)} placeholder="Jan" />
            <Input label="Achternaam" type="text" value={naam} onChange={e => setNaam(e.target.value)} placeholder="Janssen" />
          </div>
          <Input label="E-mailadres" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jouw@email.be" />
          <Input label="Wachtwoord" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 6 tekens" minLength={6} />

          <button type="submit" disabled={loading} style={{
            marginTop: '6px',
            background: 'var(--z-blauw)', opacity: loading ? 0.6 : 1,
            border: 'none', borderRadius: 'var(--z-r-s)', padding: '12px',
            fontSize: '15px', fontWeight: '600', color: 'white',
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: 'var(--z-schaduw-s)',
            transition: 'all 0.2s',
          }}>
            {loading ? 'Even geduld...' : 'Account aanvragen'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--z-tekst-4)', marginTop: '20px' }}>
          Al een account?{' '}
          <Link to="/login" style={{ color: 'var(--z-blauw-500)', textDecoration: 'none', fontWeight: '500' }}>Inloggen</Link>
        </p>
      </div>
    </AuthSchil>
  )
}

function Input({ label, type, value, onChange, placeholder, minLength }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--z-tekst-2)', marginBottom: '6px' }}>
        {label}
      </label>
      <input
        type={type} value={value} onChange={onChange} placeholder={placeholder} required minLength={minLength}
        style={{
          width: '100%', background: 'white',
          border: '1px solid var(--z-lijn)', borderRadius: '10px',
          padding: '11px 13px', fontSize: '15px', color: 'var(--z-tekst)',
          outline: 'none', boxSizing: 'border-box',
        }}
        onFocus={e => e.target.style.borderColor = 'var(--z-blauw-500)'}
        onBlur={e => e.target.style.borderColor = 'var(--z-lijn)'}
      />
    </div>
  )
}
