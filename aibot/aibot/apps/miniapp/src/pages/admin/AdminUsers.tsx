import { useState, useEffect } from 'react'
import { getUsers, blockUser, unblockUser, adjustBalance } from './api'
import { toast } from '../../components/ui/Toast'

export function AdminUsers() {
  const [users, setUsers] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [selected, setSelected] = useState<any>(null)
  const [adjustAmt, setAdjustAmt] = useState('')
  const [adjustDesc, setAdjustDesc] = useState('')

  const load = () => {
    getUsers(page, search || undefined).then(d => {
      setUsers(d.users); setPages(d.pages)
    }).catch(() => {})
  }

  useEffect(load, [page, search])

  const handleBlock = async (id: string, blocked: boolean) => {
    if (blocked) await unblockUser(id)
    else await blockUser(id)
    toast(blocked ? 'Разблокирован' : 'Заблокирован')
    load()
  }

  const handleAdjust = async () => {
    if (!selected || !adjustAmt) return
    await adjustBalance(selected.id, Number(adjustAmt), adjustDesc)
    toast(`Баланс изменён: ${adjustAmt}`)
    setAdjustAmt(''); setAdjustDesc(''); setSelected(null)
    load()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
        placeholder="Поиск по имени, username, ID..."
        className="setting-text-input" />

      {users.map(u => (
        <div key={u.id} className="card" style={{ padding: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{u.firstName} {u.username ? `@${u.username}` : ''}</div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                ID: {u.telegramId} | Бал: {u.balance} | Потр: {u.totalSpent} | Ген: {u.generationsCount} | Реф: {u.referralsCount}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => setSelected(selected?.id === u.id ? null : u)}
                style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, background: 'var(--accent-light)', color: 'var(--accent)' }}>
                Изм.
              </button>
              <button onClick={() => handleBlock(u.id, u.isBlocked)}
                style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, background: u.isBlocked ? 'var(--accent-light)' : '#fcebeb', color: u.isBlocked ? 'var(--accent)' : 'var(--danger)' }}>
                {u.isBlocked ? 'Разбл.' : 'Блок.'}
              </button>
            </div>
          </div>
          {selected?.id === u.id && (
            <div style={{ marginTop: 10, display: 'flex', gap: 6, alignItems: 'center' }}>
              <input type="number" value={adjustAmt} onChange={e => setAdjustAmt(e.target.value)}
                placeholder="Сумма" className="setting-text-input" style={{ width: 80 }} />
              <input type="text" value={adjustDesc} onChange={e => setAdjustDesc(e.target.value)}
                placeholder="Причина" className="setting-text-input" style={{ flex: 1 }} />
              <button onClick={handleAdjust} className="btn-primary" style={{ width: 'auto', padding: '8px 14px', fontSize: 12 }}>
                Ок
              </button>
            </div>
          )}
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
