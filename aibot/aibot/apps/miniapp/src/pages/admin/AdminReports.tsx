import { useState, useEffect } from 'react'
import { getReports, hidePost, deletePost } from './api'
import { toast } from '../../components/ui/Toast'

export function AdminReports() {
  const [reports, setReports] = useState<any[]>([])
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)

  const load = () => {
    getReports(page).then(d => { setReports(d.reports); setPages(d.pages) }).catch(() => {})
  }

  useEffect(load, [page])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {reports.length === 0 && <div style={{ padding: 20, textAlign: 'center', color: 'var(--text2)' }}>Жалоб нет</div>}

      {reports.map(r => (
        <div key={r.id} className="card" style={{ padding: 12 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            {r.generation?.resultUrl && (
              <img src={r.generation.resultUrl} alt="" style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />
            )}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 500 }}>{r.reason}</div>
              <div style={{ fontSize: 11, color: 'var(--text2)' }}>
                от {r.user?.firstName} | {r.generation?.model} | {r.generation?.reportsCount} жалоб
              </div>
              <div style={{ fontSize: 10, color: 'var(--text3)' }}>
                {new Date(r.createdAt).toLocaleString('ru')}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            <button onClick={async () => { await hidePost(r.generation.id); toast('Скрыт'); load() }}
              style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, background: '#fef3cd', color: '#856404' }}>
              Скрыть пост
            </button>
            <button onClick={async () => { if (confirm('Удалить?')) { await deletePost(r.generation.id); toast('Удалён'); load() } }}
              style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, background: '#fcebeb', color: 'var(--danger)' }}>
              Удалить пост
            </button>
          </div>
        </div>
      ))}

      {pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: 10 }}>
          <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1}
            className="btn-outline" style={{ width: 'auto', padding: '6px 14px', fontSize: 12 }}>Назад</button>
          <span style={{ fontSize: 13, color: 'var(--text2)', lineHeight: '32px' }}>{page}/{pages}</span>
          <button onClick={() => setPage(Math.min(pages, page + 1))} disabled={page >= pages}
            className="btn-outline" style={{ width: 'auto', padding: '6px 14px', fontSize: 12 }}>Далее</button>
        </div>
      )}
    </div>
  )
}
