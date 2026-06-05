import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function PendingApproval() {
  const { signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow p-8 w-full max-w-sm text-center">
        <div className="text-4xl mb-4">⏳</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Wachten op goedkeuring</h2>
        <p className="text-gray-500 text-sm mb-6">
          Je account is aangemaakt maar nog niet goedgekeurd door een admin. Neem contact op met de beheerder van ZVK.
        </p>
        <button
          onClick={handleSignOut}
          className="text-sm text-gray-400 hover:text-gray-600 underline"
        >
          Uitloggen
        </button>
      </div>
    </div>
  )
}
