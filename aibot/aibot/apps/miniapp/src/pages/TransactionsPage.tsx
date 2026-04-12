import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMyTransactions, type Transaction } from '../api/client'

const typeLabels: Record<string, string> = {
  PURCHASE: 'Покупка',
  SPEND: 'Генерация',
  BONUS: 'Бонус',
  REFUND: 'Возврат',
  REFERRAL: 'Реферал',
  DAILY: 'Ежедневный',
  PROMO: 'Промокод',
  ACHIEVEMENT: 'Достижение',
}

const typeIcons: Record<string, string> = {
  PURCHASE: '💳',
  SPEND: '🎨',
  BONUS: '🎁',
  REFUND: '↩️',
  REFERRAL: '👥',
  DAILY: '📅',
  PROMO: '🎟',
  ACHIEVEMENT: '🏆',
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
        <div className="topbar-title">Транзакции</div>
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
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text2)' }}>Транзакций пока нет</div>
        )}
        {items.map(tx => (
          <div key={tx.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '0.5px solid var(--border)' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
              {typeIcons[tx.type] ?? '💰'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{typeLabels[tx.type] ?? tx.type}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {tx.description}
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: tx.amount > 0 ? 'var(--success)' : 'var(--danger)' }}>
                {tx.amount > 0 ? '+' : ''}{tx.amount} 🪙
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
