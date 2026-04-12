import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMyTransactions, type Transaction } from '../api/client'
import { t } from '../i18n'

const typeKeys: Record<string, string> = {
  PURCHASE: 'tx.purchase', SPEND: 'tx.spend', BONUS: 'tx.bonus',
  REFUND: 'tx.refund', REFERRAL: 'tx.referral', DAILY: 'tx.daily',
  PROMO: 'tx.promo', ACHIEVEMENT: 'tx.achievement',
}

export default function TransactionsPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMyTransactions().then(setItems).catch(() => {}).finally(() => setLoading(false))
  }, [])

  return (
    <>
      <div className="topbar" style={{ gap: 12 }}>
        <button className="back-btn" onClick={() => navigate(-1)}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><path d="M11 4L6 9l5 5"/></svg>
        </button>
        <div className="topbar-title">{t('tx.title')}</div>
      </div>

      <div style={{ padding: '4px 0' }}>
        {loading && Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 16px', borderBottom: '0.5px solid var(--border)' }}>
            <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 10, flexShrink: 0 }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div className="skeleton" style={{ height: 14, width: '50%' }} />
              <div className="skeleton" style={{ height: 12, width: '80%' }} />
            </div>
          </div>
        ))}
        {!loading && items.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text2)' }}>{t('tx.empty')}</div>
        )}
        {items.map(tx => (
          <div key={tx.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '0.5px solid var(--border)' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: tx.amount > 0 ? 'var(--accent-light)' : 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={tx.amount > 0 ? 'var(--accent)' : 'var(--text3)'} strokeWidth={1.8} strokeLinecap="round">
                {tx.amount > 0
                  ? <path d="M9 13V5M5 9l4-4 4 4"/>
                  : <path d="M9 5v8M5 9l4 4 4-4"/>
                }
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{t((typeKeys[tx.type] ?? 'tx.spend') as any)}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {tx.description}
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: tx.amount > 0 ? 'var(--success)' : 'var(--danger)' }}>
                {tx.amount > 0 ? '+' : ''}{tx.amount}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                {new Date(tx.createdAt).toLocaleDateString('ru', { day: 'numeric', month: 'short' })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
