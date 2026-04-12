import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { claimDailyBonus, getStats, type UserStats } from '../api/client'
import { getDailyBonus } from '@aibot/shared'
import { t } from '../i18n'

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

  if (!user) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text2)' }}>{t('profile.loading')}</div>

  const nextStreak = user.dailyStreak + 1
  const nextBonus = getDailyBonus(nextStreak - 1)

  return (
    <>
      <div className="topbar"><div className="topbar-title">{t('profile.title')}</div></div>
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
                {t('profile.since', { date: new Date(user.createdAt).toLocaleDateString(user.lang === 'en' ? 'en' : 'ru', { month: 'long', year: 'numeric' }) })}
              </div>
            </div>
          </div>
        </div>

        {/* Balance + buy */}
        <div className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text2)' }}>{t('profile.balance')}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--accent)' }}>{user.balance} <span style={{ fontSize: 12, color: 'var(--text2)' }}>{t('profile.tokens')}</span></div>
          </div>
          <button className="btn-primary" style={{ width: 'auto', padding: '10px 20px' }} onClick={() => navigate('/plans')}>
            {t('profile.topUp')}
          </button>
        </div>

        {/* Daily bonus */}
        {canClaimDaily && !dailyClaimed ? (
          <div className="card daily-bonus-card" onClick={handleClaimDaily}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{t('profile.dailyBonus')}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)' }}>
                {t('profile.dailyDay', { day: String(nextStreak) })} — {t('profile.dailyGet', { tokens: String(nextBonus) })}
              </div>
            </div>
            <div className="daily-claim-btn">
              {dailyLoading ? '...' : t('profile.dailyClaim')}
            </div>
          </div>
        ) : dailyClaimed && dailyResult ? (
          <div className="card" style={{ padding: 16, textAlign: 'center', background: 'var(--accent-light)' }}>
            <div style={{ fontSize: 15, fontWeight: 600 }}>+{dailyResult.tokens} {t('profile.dailyClaimed')}</div>
            <div style={{ fontSize: 12, color: 'var(--text2)' }}>{t('profile.dailySeries', { streak: String(dailyResult.streak) })}</div>
          </div>
        ) : (
          <div className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 12, opacity: 0.5 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{t('profile.dailyBonus')}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)' }}>{t('profile.dailyComeBack')} {t('profile.dailyStreak', { streak: String(user.dailyStreak) })}</div>
            </div>
          </div>
        )}

        {/* Stats */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <div className="card stat-card">
              <div className="stat-value">{stats.totalGenerations}</div>
              <div className="stat-label">{t('profile.generations')}</div>
            </div>
            <div className="card stat-card">
              <div className="stat-value">{user.totalSpent}</div>
              <div className="stat-label">{t('profile.spent')}</div>
            </div>
            <div className="card stat-card">
              <div className="stat-value">{user.dailyStreak}</div>
              <div className="stat-label">{t('profile.daysInRow')}</div>
            </div>
          </div>
        )}

        {/* Menu sections */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <MenuItem icon={<IconStar />} label={t('profile.favorites')} onClick={() => navigate('/favorites')} />
          <MenuItem icon={<IconTrophy />} label={t('profile.achievements')} onClick={() => navigate('/achievements')} />
          <MenuItem icon={<IconUsers />} label={t('profile.inviteFriends')} subtitle={t('profile.inviteBonus')} onClick={() => navigate('/referral')} />
          <MenuItem icon={<IconList />} label={t('profile.transactions')} onClick={() => navigate('/transactions')} />
          <MenuItem icon={<IconTicket />} label={t('profile.promoCode')} onClick={() => navigate('/promo')} />
          <MenuItem icon={<IconGear />} label={t('profile.settings')} onClick={() => navigate('/settings')} last />
        </div>
      </div>
    </>
  )
}

function MenuItem({ icon, label, subtitle, onClick, last }: {
  icon: React.ReactNode; label: string; subtitle?: string; onClick: () => void; last?: boolean
}) {
  return (
    <div className="menu-item" onClick={onClick} style={!last ? { borderBottom: '0.5px solid var(--border)' } : undefined}>
      <span style={{ width: 32, display: 'flex', justifyContent: 'center' }}>{icon}</span>
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

// SVG Icons
const IconStar = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg>
const IconTrophy = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path d="M6 9V2h12v7a6 6 0 11-12 0z"/><path d="M6 4H3v3a3 3 0 003 3"/><path d="M18 4h3v3a3 3 0 01-3 3"/><path d="M12 15v4M8 22h8"/></svg>
const IconUsers = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><circle cx="9" cy="7" r="3"/><path d="M2 20c0-3 2.7-6 7-6s7 3 7 6"/><circle cx="17" cy="8" r="2.5"/><path d="M22 20c0-2.5-2-4.5-5-5"/></svg>
const IconList = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><path d="M3 6h18M3 12h14M3 18h10"/></svg>
const IconTicket = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path d="M2 9V6a2 2 0 012-2h16a2 2 0 012 2v3a2 2 0 000 4v3a2 2 0 01-2 2H4a2 2 0 01-2-2v-3a2 2 0 000-4z"/></svg>
const IconGear = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
