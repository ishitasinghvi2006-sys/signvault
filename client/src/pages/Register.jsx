import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true)
    try {
      const { data } = await api.post('/auth/register', form)
      login(data.user, data.token); navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 to-indigo-900 flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-500 rounded-lg flex items-center justify-center text-white font-bold text-lg">S</div>
          <span className="text-white font-semibold text-xl">SignVault</span>
        </div>
        <div>
          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Start signing
in minutes
          </h2>
          <p className="text-indigo-200 text-base">
            Join thousands of businesses using SignVault to streamline their document workflows.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Free to start', desc: 'No credit card needed' },
            { label: 'Unlimited docs', desc: 'Upload as many as you want' },
            { label: 'Secure storage', desc: 'Cloud-backed with Supabase' },
            { label: 'Audit ready', desc: 'Full signing history' },
          ].map(f => (
            <div key={f.label} className="bg-white/10 rounded-xl p-4">
              <p className="text-white font-semibold text-sm">{f.label}</p>
              <p className="text-indigo-200 text-xs mt-1">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white px-8">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Create your account</h1>
            <p className="text-gray-500 text-sm">Get started with SignVault for free</p>
          </div>
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-5">
              <span>⚠</span> {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { label: 'Full name', key: 'name', type: 'text', ph: 'Alice Chen' },
              { label: 'Email address', key: 'email', type: 'email', ph: 'you@example.com' },
              { label: 'Password', key: 'password', type: 'password', ph: 'Min. 6 characters' },
            ].map(({ label, key, type, ph }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
                <input type={type} placeholder={ph} required
                  value={form[key]} onChange={e => setForm({...form, [key]: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition" />
              </div>
            ))}
            <button type="submit" disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl text-sm transition mt-2">
              {loading ? 'Creating account...' : 'Create account →'}
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link to="/" className="text-indigo-600 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}