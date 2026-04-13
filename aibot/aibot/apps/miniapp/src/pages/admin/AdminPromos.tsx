import { useState, useEffect } from 'react'
import { getPromos, createPromo, togglePromo } from './api'
import { toast } from '../../components/ui/Toast'

export function AdminPromos() {
  const [promos, setPromos] = useState<any[]>([])
  const [code, setCode] = useState('')
  const [tokens, setTokens] = useState('')
  const [maxUses, setMaxUses] = useState('')

  const load = () => { getPromos().then(setPromos).catch(() => {}) }
  useEffect(load, [])

  const handleCreate = async () => {
    if (!code || !tokens) return
    await createPromo(code, Number(tokens), Number(maxUses) || 0)
    toast('Создан')
    setCode(''); setTokens(''); setMaxUses('')
    load()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="card" style={{ padding: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Новый промокод</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input type="text" value={code} onChange={e => setCode(e.target.value.toUpperCase())}
            placeholder="КОД" className="setting-text-input" />
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="number" value={tokens} onChange={e => setTokens(e.target.value)}
              placeholder="Токенов" className="setting-text-input" style={{ flex: 1 }} />
            <input type="number" value={maxUses} onChange={e => setMaxUses(e.target.value)}
              placeholder="Лимит (0=безлим.)" className="setting-text-input" style={{ flex: 1 }} />
          </div>
          <button onClick={handleCreate} className="btn-primary" disabled={!code || !tokens}>Создать</button>
        </div>
      </div>

      {promos.map(p => (
        <div key={p.id} className="card" style={{ padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{p.code}</div>
            <div style={{ fontSize: 11, color: 'var(--text2)' }}>
              {p.tokens} ток. | исп: {p.usedCount}{p.maxUses > 0 ? `/${p.maxUses}` : ''} | {p.isActive ? 'активен' : 'выкл.'}
            </div>
          </div>
          <button onClick={async () => { await togglePromo(p.id); load() }}
            style={{ padding: '4px 12px', borderRadius: 6, fontSize: 11,
              background: p.isActive ? '#fcebeb' : 'var(--accent-light)',
              color: p.isActive ? 'var(--danger)' : 'var(--accent)' }}>
            {p.isActive ? 'Выкл.' : 'Вкл.'}
          </button>
        </div>
      ))}
    </div>
  )
}
