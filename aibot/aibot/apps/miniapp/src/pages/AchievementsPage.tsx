import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAchievements, type AchievementInfo } from '../api/client'
import { t } from '../i18n'

const categoryKeys: Record<string, string> = {
  generation: 'ach.cat.generation',
  social: 'ach.cat.social',
  spending: 'ach.cat.spending',
  streak: 'ach.cat.streak',
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
    if (!acc[a.category]) acc[a.category] = []
    acc[a.category].push(a)
    return acc
  }, {})

  return (
    <>
      <div className="topbar" style={{ gap: 12 }}>
        <button className="back-btn" onClick={() => navigate(-1)}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><path d="M11 4L6 9l5 5"/></svg>
        </button>
        <div>
          <div className="topbar-title">{t('ach.title')}</div>
          {!loading && <div className="topbar-sub">{t('ach.unlocked', { unlocked: String(unlocked), total: String(total) })}</div>}
        </div>
      </div>

      <div style={{ padding: '12px 16px 100px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {loading && Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 60, borderRadius: 12 }} />
        ))}

        {Object.entries(grouped).map(([cat, items]) => (
          <div key={cat}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 8, padding: '0 4px' }}>
              {t((categoryKeys[cat] ?? cat) as any)}
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
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: a.unlocked ? 'var(--accent-light)' : 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={a.unlocked ? 'var(--accent)' : 'var(--text3)'} strokeWidth={1.8}>
                      <path d="M6 9V2h12v7a6 6 0 11-12 0z"/><path d="M12 15v4M8 22h8"/>
                    </svg>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{a.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text2)' }}>{a.description}</div>
                    {a.reward > 0 && (
                      <div style={{ fontSize: 11, color: 'var(--accent)', marginTop: 2 }}>
                        {t('ach.reward', { reward: String(a.reward) })}
                      </div>
                    )}
                  </div>
                  {a.unlocked ? (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="var(--success)" strokeWidth={2} strokeLinecap="round"><path d="M4 10l4 4 8-8"/></svg>
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
