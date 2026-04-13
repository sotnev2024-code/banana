import { useState, useEffect } from 'react'
import { getDashboard } from './api'

export function AdminDashboard() {
  const [data, setData] = useState<any>(null)

  useEffect(() => { getDashboard().then(setData).catch(() => {}) }, [])

  if (!data) return <div style={{ padding: 20, textAlign: 'center', color: 'var(--text2)' }}>Загрузка...</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <StatCard label="Пользователи" value={data.totalUsers} sub={`+${data.todayUsers} сегодня`} />
        <StatCard label="Генерации" value={data.totalGenerations} sub={`+${data.todayGens} сегодня`} />
        <StatCard label="Доход" value={`${data.totalRevenue} руб`} sub={`+${data.todayRevenue} сегодня`} />
        <StatCard label="Жалобы" value={data.pendingReports} sub="ожидают" color="var(--danger)" />
      </div>

      <div className="card" style={{ padding: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Популярные модели</div>
        {data.popularModels.map((m: any) => (
          <div key={m.model} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13 }}>
            <span style={{ color: 'var(--text2)' }}>{m.model.replace(/-/g, ' ')}</span>
            <span style={{ fontWeight: 600 }}>{m.count}</span>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Последние 7 дней</div>
        {data.days.map((d: any) => (
          <div key={d.date} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: 12 }}>
            <span style={{ color: 'var(--text3)' }}>{d.date.slice(5)}</span>
            <span>{d.users}п / {d.gens}г / {d.revenue}р</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function StatCard({ label, value, sub, color }: { label: string; value: any; sub: string; color?: string }) {
  return (
    <div className="card stat-card">
      <div className="stat-value" style={color ? { color } : undefined}>{value}</div>
      <div className="stat-label">{label}</div>
      <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>{sub}</div>
    </div>
  )
}
