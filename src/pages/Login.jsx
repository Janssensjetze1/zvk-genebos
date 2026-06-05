import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
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
    else navigate('/')
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8fafc',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '24px 20px',
    }}>
      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: '36px' }}>
        <div style={{
          width: '72px', height: '72px', borderRadius: '20px',
          background: 'white',
          border: '1px solid #e2e8f0',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 18px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
        }}>
          <img src="/logo.png" alt="ZVK" style={{ width: '52px', height: '52px', objectFit: 'contain' }} />
        </div>
        <h1 style={{ color: '#0f172a', fontSize: '26px', fontWeight: '700', letterSpacing: '-0.5px', marginBottom: '6px' }}>
          ZVK Genebos
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '14px' }}>
          Inloggen om verder te gaan
        </p>
      </div>

      {/* Card */}
      <div style={{
        width: '100%', maxWidth: '380px',
        background: 'white',
        border: '1px solid #e2e8f0',
        borderRadius: '20px',
        padding: '28px 24px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
      }}>
        {error && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fecaca',
            color: '#dc2626', fontSize: '13px', borderRadius: '10px',
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
            background: loading ? '#93c5fd' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
            border: 'none', borderRadius: '12px', padding: '13px',
            fontSize: '15px', fontWeight: '600', color: 'white',
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: loading ? 'none' : '0 4px 20px rgba(59,130,246,0.3)',
            transition: 'all 0.2s',
          }}>
            {loading ? 'Even geduld...' : 'Inloggen'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '13px', color: '#94a3b8', marginTop: '20px' }}>
          Nog geen account?{' '}
          <Link to="/register" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: '500' }}>Registreer</Link>
        </p>
      </div>
    </div>
  )
}

function Input({ label, type, value, onChange, placeholder }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748b', marginBottom: '7px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </label>
      <input
        type={type} value={value} onChange={onChange} placeholder={placeholder} required
        style={{
          width: '100%', background: '#f8fafc',
          border: '1px solid #e2e8f0', borderRadius: '10px',
          padding: '12px 14px', fontSize: '15px', color: '#0f172a',
          outline: 'none', boxSizing: 'border-box',
          transition: 'border-color 0.15s',
        }}
        onFocus={e => e.target.style.borderColor = '#3b82f6'}
        onBlur={e => e.target.style.borderColor = '#e2e8f0'}
      />
    </div>
  )
}
