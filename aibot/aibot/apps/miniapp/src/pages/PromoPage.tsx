import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { redeemPromo } from '../api/client'
import { useAuth } from '../hooks/useAuth'

export default function PromoPage() {
  const navigate = useNavigate()
  const { refresh } = useAuth()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ tokens: number; message: string } | null>(null)
  const [error, setError] = useState('')

  const handleRedeem = async () => {
    if (!code.trim() || loading) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await redeemPromo(code.trim().toUpperCase())
      setResult(res)
      refresh()
      setCode('')
    } catch (e: any) {
      setError(e.message ?? 'Недействительный промокод')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="topbar" style={{ gap: 12 }}>
        <button className="back-btn" onClick={() => navigate(-1)}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><path d="M11 4L6 9l5 5"/></svg>
        </button>
        <div className="topbar-title">Промокод</div>
      </div>

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div className="card" style={{ padding: 24, textAlign: 'center' }}>
          <div style={{ fontSize: 48 }}>🎟</div>
          <div style={{ fontSize: 16, fontWeight: 600, marginTop: 8 }}>Активировать промокод</div>
          <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>
            Введите код и получите бонусные токены
          </div>
        </div>

        <input
          type="text"
          value={code}
          onChange={e => setCode(e.target.value.toUpperCase())}
          placeholder="ВВЕДИТЕ КОД"
          style={{
            width: '100%',
            padding: '14px 16px',
            fontSize: 18,
            fontWeight: 600,
            textAlign: 'center',
            letterSpacing: 3,
            border: '1.5px solid var(--border)',
            borderRadius: 12,
            background: 'var(--surface)',
            color: 'var(--text)',
            outline: 'none',
          }}
          onKeyDown={e => e.key === 'Enter' && handleRedeem()}
        />

        {error && (
          <div style={{ padding: '10px 14px', background: '#fcebeb', borderRadius: 10, fontSize: 13, color: '#a32d2d', textAlign: 'center' }}>
            {error}
          </div>
        )}

        {result && (
          <div style={{ padding: '16px', background: 'var(--accent-light)', borderRadius: 12, textAlign: 'center' }}>
            <div style={{ fontSize: 24 }}>🎉</div>
            <div style={{ fontSize: 16, fontWeight: 600, marginTop: 4 }}>+{result.tokens} 🪙</div>
            <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2 }}>{result.message}</div>
          </div>
        )}

        <button className="btn-primary" onClick={handleRedeem} disabled={!code.trim() || loading}>
          {loading ? 'Проверяю...' : 'Активировать'}
        </button>
      </div>
    </>
  )
}
