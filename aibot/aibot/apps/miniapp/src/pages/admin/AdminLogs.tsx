import { useState, useEffect } from 'react'
import { getErrorLogs, getApiLogs } from './api'

export function AdminLogs() {
  const [tab, setTab] = useState<'errors' | 'api'>('errors')
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    const fn = tab === 'errors' ? getErrorLogs : getApiLogs
    fn(100).then(setLogs).catch(() => setLogs([])).finally(() => setLoading(false))
  }

  useEffect(load, [tab])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => setTab('errors')} className={`filter-pill ${tab === 'errors' ? 'active' : ''}`}>
          Ошибки
        </button>
        <button onClick={() => setTab('api')} className={`filter-pill ${tab === 'api' ? 'active' : ''}`}>
          API запросы
        </button>
        <button onClick={load} style={{ marginLeft: 'auto', padding: '4px 12px', borderRadius: 6, fontSize: 11, background: 'var(--surface2)', color: 'var(--text2)' }}>
          Обновить
        </button>
      </div>

      {loading && <div style={{ padding: 20, textAlign: 'center', color: 'var(--text2)' }}>Загрузка...</div>}

      {!loading && logs.length === 0 && (
        <div style={{ padding: 20, textAlign: 'center', color: 'var(--text2)' }}>
          {tab === 'errors' ? 'Ошибок нет' : 'Запросов нет'}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {[...logs].reverse().map((log, i) => (
          <div key={i} className="card" style={{ padding: 8, fontSize: 11, fontFamily: 'monospace', wordBreak: 'break-all' }}>
            {tab === 'errors' ? (
              <>
                <div style={{ color: 'var(--danger)', fontWeight: 600 }}>{log.source}</div>
                <div style={{ color: 'var(--text)' }}>{log.error}</div>
                {log.generationId && <div style={{ color: 'var(--text3)' }}>gen: {log.generationId}</div>}
                {log.modelId && <div style={{ color: 'var(--text3)' }}>model: {log.modelId}</div>}
                <div style={{ color: 'var(--text3)' }}>{log.time}</div>
              </>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ color: log.status >= 400 ? 'var(--danger)' : 'var(--success)' }}>{log.status}</span>
                <span style={{ color: 'var(--text)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.method} {log.path}</span>
                <span style={{ color: 'var(--text3)', flexShrink: 0 }}>{log.duration}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
