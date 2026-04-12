import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAchievements, type AchievementInfo } from '../api/client'

const categoryLabels: Record<string, string> = {
  generation: 'Генерации',
  social: 'Социальные',
  spending: 'Траты',
  streak: 'Серии',
}

export default function AchievementsPage() {
  const navigate = useNavigate()
  const [achievements, setAchievements] = useState<AchievementInfo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAchievements().then(data => setAchievements(data.all)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const unlocked = achievements.filter(a => a.unlocked).length
  const total = achievements.length

  const grouped = achievements.reduce<Record<string, AchievementInfo[]>>((acc, a) => {
    const cat = a.category
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(a)
    return acc
  }, {})

  return (
    <>
      <div className="topbar" style={{ gap: 12 }}>
        <button className="back-btn" onClick={() => navigate(-1)}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><path d="M11 4L6 9l5 5"/></svg>
        </button>
        <div>
          <div className="topbar-title">Достижения</div>
          {!loading && <div className="topbar-sub">{unlocked} / {total} открыто</div>}
        </div>
      </div>

      <div style={{ padding: '12px 16px 100px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {loading && Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 60, borderRadius: 12 }} />
        ))}

        {Object.entries(grouped).map(([cat, items]) => (
          <div key={cat}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 8, padding: '0 4px' }}>
              {categoryLabels[cat] ?? cat}
            </div>
            <div className="card" style={{ overflow: 'hidden' }}>
              {items.map((a, i) => (
                <div
                  key={a.id}
                  className="achievement-item"
                  style={{
                    opacity: a.unlocked ? 1 : 0.45,
                    borderBottom: i < items.length - 1 ? '0.5px solid var(--border)' : undefined,
                  }}
                >
                  <div style={{ fontSize: 28, width: 40, textAlign: 'center' }}>{a.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{a.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text2)' }}>{a.description}</div>
                    {a.reward > 0 && (
                      <div style={{ fontSize: 11, color: 'var(--accent)', marginTop: 2 }}>
                        +{a.reward} 🪙 награда
                      </div>
                    )}
                  </div>
                  {a.unlocked ? (
                    <div style={{ fontSize: 20, color: 'var(--success)' }}>✓</div>
                  ) : (
                    <div style={{ fontSize: 12, color: 'var(--text3)', background: 'var(--surface2)', padding: '2px 8px', borderRadius: 6 }}>
                      {a.threshold}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
