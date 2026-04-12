import { useState, useEffect } from 'react'
import { getAdminFeed, hidePost, showPost, deletePost } from './api'
import { toast } from '../../components/ui/Toast'

export function AdminFeed() {
  const [items, setItems] = useState<any[]>([])
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [reportedOnly, setReportedOnly] = useState(false)

  const load = () => {
    getAdminFeed(page, reportedOnly).then(d => {
      setItems(d.items); setPages(d.pages)
    }).catch(() => {})
  }

  useEffect(load, [page, reportedOnly])

  const handleHide = async (id: string) => {
    await hidePost(id); toast('Hidden'); load()
  }
  const handleShow = async (id: string) => {
    await showPost(id); toast('Visible'); load()
  }
  const handleDelete = async (id: string) => {
    if (!confirm('Delete permanently?')) return
    await deletePost(id); toast('Deleted'); load()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => { setReportedOnly(false); setPage(1) }}
          className={`filter-pill ${!reportedOnly ? 'active' : ''}`}>All</button>
        <button onClick={() => { setReportedOnly(true); setPage(1) }}
          className={`filter-pill ${reportedOnly ? 'active' : ''}`}>Reported</button>
      </div>

      {items.map(item => (
        <div key={item.id} className="card" style={{ padding: 10 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            {item.resultUrl && (
              <img src={item.resultUrl} alt="" style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{item.model.replace(/-/g, ' ')}</div>
              <div style={{ fontSize: 11, color: 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.prompt}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>
                by {item.user?.firstName} | {item.likesCount}L {item.commentsCount}C {item.reportsCount}R | {item.isPublic ? 'public' : 'hidden'}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            {item.isPublic ? (
              <button onClick={() => handleHide(item.id)}
                style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, background: '#fef3cd', color: '#856404' }}>Hide</button>
            ) : (
              <button onClick={() => handleShow(item.id)}
                style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, background: 'var(--accent-light)', color: 'var(--accent)' }}>Show</button>
            )}
            <button onClick={() => handleDelete(item.id)}
              style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, background: '#fcebeb', color: 'var(--danger)' }}>Delete</button>
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
