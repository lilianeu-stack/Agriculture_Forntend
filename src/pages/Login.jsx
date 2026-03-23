import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('http://localhost:3004/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Login failed')
      }

      sessionStorage.setItem('user', JSON.stringify(data.user))
      sessionStorage.setItem('token', data.token)
      sessionStorage.setItem('role', data.user.role)
      sessionStorage.setItem('authenticated', 'true')

      // Redirect based on role
      const role = data.user.role
      if (role === 'money') {
        navigate('/')
      } else if (role === 'fees') {
        navigate('/school-fees')
      } else if (role === 'admin') {
        navigate('/')
      } else if (role === 'shift') {
        navigate('/shifts')
      } else {
        navigate('/')
      }
    } catch (err) {
      setError(err.message || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 to-white p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-green-600">Hope Haven School</h1>
          <p className="text-sm text-slate-500">EduLink Management System</p>
        </div>

        {error && <div className="mb-4 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-800">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
              required
            />
          </div>

          <div className="mb-5">
            <label className="mb-2 block text-sm font-medium text-slate-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-green-600 focus:ring-2 focus:ring-green-100"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-500">
          <p>Demo Accounts:</p>
          <p>Admin: Admin@hopehavenschool.org / Admin123</p>
          <p>Money: Money@hopehavenschool.org / Money123</p>
          <p>Shift: Shift@hopehavenschool.org / Shift123</p>
          <p>Fees: Fees@hopehavenschool.org / Fees123</p>
        </div>
      </div>
    </div>
  )
}
