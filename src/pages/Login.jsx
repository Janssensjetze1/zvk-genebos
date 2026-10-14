import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { AuthSchil } from '../ui'

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = location.state?.from || '/'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await signIn(email, password)
    setLoading(false)
    if (error) setError('Verkeerd e-mailadres of wachtwoord.')
    else navigate(redirectTo)
  }

  return (
    <AuthSchil titel="Inloggen" ondertitel="Welkom terug! Log in om verder te gaan.">
      {/* Card */}
      <div style={{
        width: '100%', maxWidth: '380px',
        background: 'var(--z-kaart)',
        border: '1px solid var(--z-lijn)',
        borderRadius: 'var(--z-r-l)',
        padding: '28px 24px',
        boxShadow: 'var(--z-schaduw)',
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
          <Input label="E-mailadres" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jouw@email.be" />
          <Input label="Wachtwoord" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />

          <button type="submit" disabled={loading} style={{
            marginTop: '6px',
            background: 'var(--z-blauw)', opacity: loading ? 0.6 : 1,
            border: 'none', borderRadius: 'var(--z-r-s)', padding: '12px',
            fontSize: '15px', fontWeight: '600', color: 'white',
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: 'var(--z-schaduw-s)',
            transition: 'all 0.2s',
          }}>
            {loading ? 'Even geduld...' : 'Inloggen'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--z-tekst-4)', marginTop: '20px' }}>
          Nog geen account?{' '}
          <Link to="/register" style={{ color: 'var(--z-blauw-500)', textDecoration: 'none', fontWeight: '500' }}>Registreer</Link>
        </p>
      </div>
    </AuthSchil>
  )
}

function Input({ label, type, value, onChange, placeholder }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'var(--z-tekst-2)', marginBottom: '6px' }}>
        {label}
      </label>
      <input
        type={type} value={value} onChange={onChange} placeholder={placeholder} required
        style={{
          width: '100%', background: 'var(--z-kaart)',
          border: '1px solid var(--z-lijn)', borderRadius: '10px',
          padding: '12px 14px', fontSize: '15px', color: 'var(--z-tekst)',
          outline: 'none', boxSizing: 'border-box',
          transition: 'border-color 0.15s',
        }}
        onFocus={e => e.target.style.borderColor = 'var(--z-blauw-500)'}
        onBlur={e => e.target.style.borderColor = 'var(--z-lijn)'}
      />
    </div>
  )
}
