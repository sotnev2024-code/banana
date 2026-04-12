import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { claimDailyBonus, getStats, type UserStats } from '../api/client'
import { getDailyBonus } from '@aibot/shared'

export default function ProfilePage() {
  const { user, refresh } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState<UserStats | null>(null)
  const [dailyClaimed, setDailyClaimed] = useState(false)
  const [dailyLoading, setDailyLoading] = useState(false)
  const [dailyResult, setDailyResult] = useState<{ tokens: number; streak: number } | null>(null)

  useEffect(() => {
    getStats().then(setStats).catch(() => {})
  }, [])

  // Check if daily bonus is available
  const canClaimDaily = user && (!user.lastDailyAt || isNewDay(user.lastDailyAt))

  const handleClaimDaily = async () => {
    if (!canClaimDaily || dailyLoading) return
    setDailyLoading(true)
    try {
      const res = await claimDailyBonus()
      setDailyResult(res)
      setDailyClaimed(true)
      refresh()
    } catch (e: any) {
      alert(e.message)
    } finally {
      setDailyLoading(false)
    }
  }

  if (!user) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text2)' }}>Загрузка...</div>

  const nextStreak = user.dailyStreak + 1
  const nextBonus = getDailyBonus(nextStreak - 1)

  return (
    <>
      <div className="topbar"><div className="topbar-title">Профиль</div></div>
      <div style={{ padding: '16px 16px 100px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* User card */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {user.photoUrl
              ? <img src={user.photoUrl} alt="" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover' }} />
              : <div className="avatar-placeholder">{user.firstName[0]}</div>
            }
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 600 }}>{user.firstName} {user.lastName ?? ''}</div>
              {user.username && <div style={{ fontSize: 13, color: 'var(--text2)' }}>@{user.username}</div>}
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
                с {new Date(user.createdAt).toLocaleDateString('ru', { month: 'long', year: 'numeric' })}
              </div>
            </div>
          </div>
        </div>

        {/* Balance + buy */}
        <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text2)' }}>Баланс</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--accent)' }}>{user.balance} <span style={{ fontSize: 14 }}>🪙</span></div>
          </div>
          <button className="btn-primary" style={{ width: 'auto', padding: '10px 20px' }} onClick={() => navigate('/plans')}>
            Пополнить
          </button>
        </div>

        {/* Daily bonus */}
        {canClaimDaily && !dailyClaimed ? (
          <div className="card daily-bonus-card" onClick={handleClaimDaily}>
            <div style={{ fontSize: 28 }}>🎁</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 600 }}>Ежедневный бонус</div>
              <div style={{ fontSize: 12, color: 'var(--text2)' }}>
                День {nextStreak} — получите {nextBonus} 🪙
              </div>
            </div>
            <div className="daily-claim-btn">
              {dailyLoading ? '...' : 'Забрать'}
            </div>
          </div>
        ) : dailyClaimed && dailyResult ? (
          <div className="card" style={{ padding: 16, textAlign: 'center', background: 'var(--accent-light)' }}>
            <div style={{ fontSize: 24 }}>🎉</div>
            <div style={{ fontSize: 15, fontWeight: 600, marginTop: 4 }}>+{dailyResult.tokens} токенов!</div>
            <div style={{ fontSize: 12, color: 'var(--text2)' }}>Серия: {dailyResult.streak} дней</div>
          </div>
        ) : (
          <div className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12, opacity: 0.5 }}>
            <div style={{ fontSize: 28 }}>🎁</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>Ежедневный бонус</div>
              <div style={{ fontSize: 12, color: 'var(--text2)' }}>Возвращайтесь завтра! Серия: {user.dailyStreak} дн.</div>
            </div>
          </div>
        )}

        {/* Stats */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <div className="card stat-card">
              <div className="stat-value">{stats.totalGenerations}</div>
              <div className="stat-label">Генераций</div>
            </div>
            <div className="card stat-card">
              <div className="stat-value">{user.totalSpent}</div>
              <div className="stat-label">Потрачено 🪙</div>
            </div>
            <div className="card stat-card">
              <div className="stat-value">{user.dailyStreak}</div>
              <div className="stat-label">Дней подряд</div>
            </div>
          </div>
        )}

        {/* Menu sections */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <MenuItem icon="⭐" label="Избранное" onClick={() => navigate('/favorites')} />
          <MenuItem icon="🏆" label="Достижения" onClick={() => navigate('/achievements')} />
          <MenuItem icon="👥" label="Пригласить друзей" subtitle="Получайте бонусы" onClick={() => navigate('/referral')} />
          <MenuItem icon="📋" label="История транзакций" onClick={() => navigate('/transactions')} />
          <MenuItem icon="🎟" label="Промокод" onClick={() => navigate('/promo')} />
          <MenuItem icon="⚙️" label="Настройки" onClick={() => navigate('/settings')} last />
        </div>
      </div>
    </>
  )
}

function MenuItem({ icon, label, subtitle, onClick, last }: {
  icon: string; label: string; subtitle?: string; onClick: () => void; last?: boolean
}) {
  return (
    <div className="menu-item" onClick={onClick} style={!last ? { borderBottom: '0.5px solid var(--border)' } : undefined}>
      <span style={{ fontSize: 20, width: 32, textAlign: 'center' }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 15 }}>{label}</div>
        {subtitle && <div style={{ fontSize: 12, color: 'var(--text2)' }}>{subtitle}</div>}
      </div>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--text3)" strokeWidth={1.5} strokeLinecap="round">
        <path d="M6 4l4 4-4 4"/>
      </svg>
    </div>
  )
}

function isNewDay(lastDailyAt: string): boolean {
  const last = new Date(lastDailyAt)
  const now = new Date()
  return last.toDateString() !== now.toDateString()
}
