import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getPlans, createPayment, type Plan } from '../api/client'
import { useAuth } from '../hooks/useAuth'
import { t } from '../i18n'

export default function PlansPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [plans, setPlans] = useState<Plan[]>([])
  const [selected, setSelected] = useState<string>('pro')
  const [loading, setLoading] = useState(false)

  useEffect(() => { getPlans().then(setPlans) }, [])

  const handlePay = async () => {
    if (!selected) return
    setLoading(true)
    try {
      const { confirmationUrl } = await createPayment(selected)
      window.location.href = confirmationUrl
    } catch (e: any) {
      alert(e.message)
    } finally {
      setLoading(false)
    }
  }

  const plan = plans.find(p => p.id === selected)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: 'var(--bg)' }}>
      <div style={{ padding: '16px 20px 8px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button className="back-btn" onClick={() => navigate(-1)}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><path d="M11 4L6 9l5 5"/></svg>
        </button>
        <div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>{t('plans.title')}</div>
          {user && <div style={{ fontSize: 12, color: 'var(--text2)' }}>{t('plans.balance', { balance: String(user.balance) })}</div>}
        </div>
      </div>

      <div style={{ padding: '8px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {plans.map(p => {
          const total = p.tokens + p.bonusTokens
          return (
            <div key={p.id}
              className={`plan-card ${p.popular ? 'popular' : ''} ${selected === p.id ? 'selected' : ''}`}
              onClick={() => setSelected(p.id)}>
              {p.popular && <div className="plan-popular-badge">{t('plans.popular')}</div>}
              <div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{p.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>
                  {total} {t('plans.tokens')}{p.bonusTokens > 0 ? ` (${t('plans.bonus', { bonus: String(p.bonusTokens) })})` : ''}
                </div>
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent)' }}>{p.priceRub} P</div>
            </div>
          )
        })}

      </div>

      <div style={{ position: 'sticky', bottom: 0, padding: '12px 16px 32px', background: 'var(--bg)' }}>
        <button className="btn-primary" onClick={handlePay} disabled={!selected || loading}>
          {loading ? t('plans.paying') : t('plans.pay', { price: String(plan?.priceRub ?? '') })}
        </button>
      </div>
    </div>
  )
}
