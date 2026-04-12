import { useState, useEffect } from 'react'
import { getDashboard } from './api'

export function AdminDashboard() {
  const [data, setData] = useState<any>(null)

  useEffect(() => { getDashboard().then(setData).catch(() => {}) }, [])

  if (!data) return <div style={{ padding: 20, textAlign: 'center', color: 'var(--text2)' }}>Loading...</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <StatCard label="Users" value={data.totalUsers} sub={`+${data.todayUsers} today`} />
        <StatCard label="Generations" value={data.totalGenerations} sub={`+${data.todayGens} today`} />
        <StatCard label="Revenue" value={`${data.totalRevenue} RUB`} sub={`+${data.todayRevenue} today`} />
        <StatCard label="Reports" value={data.pendingReports} sub="pending" color="var(--danger)" />
      </div>

      <div className="card" style={{ padding: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Popular models</div>
        {data.popularModels.map((m: any) => (
          <div key={m.model} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13 }}>
            <span style={{ color: 'var(--text2)' }}>{m.model.replace(/-/g, ' ')}</span>
            <span style={{ fontWeight: 600 }}>{m.count}</span>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Last 7 days</div>
        {data.days.map((d: any) => (
          <div key={d.date} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: 12 }}>
            <span style={{ color: 'var(--text3)' }}>{d.date.slice(5)}</span>
            <span>{d.users}u / {d.gens}g / {d.revenue}R</span>
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
