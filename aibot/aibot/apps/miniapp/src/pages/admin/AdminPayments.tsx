import { useState, useEffect } from 'react'
import { getPayments } from './api'

export function AdminPayments() {
  const [payments, setPayments] = useState<any[]>([])
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)

  useEffect(() => {
    getPayments(page).then(d => { setPayments(d.payments); setPages(d.pages) }).catch(() => {})
  }, [page])

  const statusColor: Record<string, string> = {
    SUCCEEDED: 'var(--success)', PENDING: 'var(--warning)', FAILED: 'var(--danger)', CANCELLED: 'var(--text3)',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {payments.length === 0 && <div style={{ padding: 20, textAlign: 'center', color: 'var(--text2)' }}>No payments</div>}

      {payments.map(p => (
        <div key={p.id} className="card" style={{ padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{p.user?.firstName} {p.user?.username ? `@${p.user.username}` : ''}</div>
            <div style={{ fontSize: 11, color: 'var(--text3)' }}>
              {p.tokensGranted} tokens | {p.provider} | {new Date(p.createdAt).toLocaleString('ru')}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 15, fontWeight: 600 }}>{p.amount} {p.currency}</div>
            <div style={{ fontSize: 11, color: statusColor[p.status] ?? 'var(--text3)' }}>{p.status}</div>
          </div>
        </div>
      ))}

      {pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: 10 }}>
          <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1}
            className="btn-outline" style={{ width: 'auto', padding: '6px 14px', fontSize: 12 }}>Prev</button>
          <span style={{ fontSize: 13, color: 'var(--text2)', lineHeight: '32px' }}>{page}/{pages}</span>
          <button onClick={() => setPage(Math.min(pages, page + 1))} disabled={page >= pages}
            className="btn-outline" style={{ width: 'auto', padding: '6px 14px', fontSize: 12 }}>Next</button>
        </div>
      )}
    </div>
  )
}
