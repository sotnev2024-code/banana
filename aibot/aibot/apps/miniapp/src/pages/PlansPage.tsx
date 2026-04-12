import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getPlans, createPayment, type Plan } from '../api/client'
import { useAuth } from '../hooks/useAuth'

export default function PlansPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [plans, setPlans] = useState<Plan[]>([])
  const [selected, setSelected] = useState<string>('pro')
  const [payMethod, setPayMethod] = useState<'yukassa' | 'stars'>('yukassa')
  const [loading, setLoading] = useState(false)

  useEffect(() => { getPlans().then(setPlans) }, [])

  const handlePay = async () => {
    if (!selected) return
    setLoading(true)
    try {
      if (payMethod === 'yukassa') {
        const { confirmationUrl } = await createPayment(selected)
        window.location.href = confirmationUrl
      } else {
        // Telegram Stars — trigger bot invoice via deep link
        window.Telegram?.WebApp?.openTelegramLink(
          `https://t.me/${import.meta.env.VITE_BOT_USERNAME}?start=buy_${selected}`
        )
      }
    } catch (e: any) {
      alert(e.message)
    } finally {
      setLoading(false)
    }
  }

  const plan = plans.find(p => p.id === selected)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px 8px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => navigate(-1)} style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
            <path d="M11 4L6 9l5 5"/>
          </svg>
        </button>
        <div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>Пополнение</div>
          {user && <div style={{ fontSize: 12, color: 'var(--text2)' }}>Баланс: {user.balance} 🪙</div>}
        </div>
      </div>

      <div style={{ padding: '8px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {plans.map(p => {
          const total = p.tokens + p.bonusTokens
          return (
            <div
              key={p.id}
              className={`plan-card ${p.popular ? 'popular' : ''} ${selected === p.id ? 'selected' : ''}`}
              onClick={() => setSelected(p.id)}
            >
              {p.popular && <div className="plan-popular-badge">Хит продаж</div>}
              <div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{p.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>
                  {total} токенов{p.bonusTokens > 0 ? ` (+${p.bonusTokens} бонус)` : ''}
                </div>
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent)' }}>{p.priceRub} ₽</div>
            </div>
          )
        })}

        {/* Payment method */}
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 10, fontWeight: 500 }}>Способ оплаты</div>
          {[
            { id: 'yukassa', label: 'Банковская карта (ЮKassa)', icon: '💳' },
            { id: 'stars',   label: 'Telegram Stars',            icon: '⭐' },
          ].map(m => (
            <div
              key={m.id}
              onClick={() => setPayMethod(m.id as any)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 14px', borderRadius: 12, marginBottom: 8,
                background: 'var(--surface)', border: `${payMethod === m.id ? '2px solid var(--accent)' : '0.5px solid var(--border)'}`,
                cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: 20 }}>{m.icon}</span>
              <span style={{ fontSize: 14, flex: 1 }}>{m.label}</span>
              <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${payMethod === m.id ? 'var(--accent)' : 'var(--border)'}`, background: payMethod === m.id ? 'var(--accent)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {payMethod === m.id && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '12px 16px 32px' }}>
        <button className="btn-primary" onClick={handlePay} disabled={!selected || loading}>
          {loading ? 'Открываю оплату...' : `Оплатить ${plan?.priceRub ?? ''} ₽`}
        </button>
      </div>
    </div>
  )
}
