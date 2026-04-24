import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { claimDailyBonus, getStats, getNotifications, type UserStats } from '../api/client'
import { getDailyBonus } from '@aibot/shared'
import { t, getLang } from '../i18n'

export default function ProfilePage() {
  const { user, refresh } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState<UserStats | null>(null)
  const [dailyClaimed, setDailyClaimed] = useState(false)
  const [dailyLoading, setDailyLoading] = useState(false)
  const [dailyResult, setDailyResult] = useState<{ tokens: number; streak: number } | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    getStats().then(setStats).catch(() => {})
    getNotifications().then(d => setUnreadCount(d.unreadCount)).catch(() => {})
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

  const isAdmin = ['1724263429'].includes(user.telegramId)
  const nextStreak = user.dailyStreak + 1
  const nextBonus = getDailyBonus(nextStreak - 1)
  const lang = getLang()

  return (
    <>
      <div className="topbar">
        <div className="topbar-eyebrow">ACCOUNT</div>
        <div className="topbar-title">{lang === 'en' ? 'PROFILE' : 'ПРОФИЛЬ'}</div>
      </div>

      <div style={{ padding: '12px 16px 100px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Identity card with gradient ring avatar */}
        <div style={{
          padding: 16, borderRadius: 14,
          background: 'linear-gradient(135deg, var(--surface), var(--bg))',
          border: '1px solid var(--border)',
          display: 'flex', gap: 14, alignItems: 'center',
        }}>
          <div className="avatar-ring">
            {user.photoUrl
              ? <img src={user.photoUrl} alt="" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', display: 'block', border: '2px solid var(--bg)' }} />
              : <div className="avatar-placeholder">{user.firstName[0]}</div>
            }
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            {user.username && (
              <div style={{
                fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--accent)',
                fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase',
              }}>@{user.username}</div>
            )}
            <div style={{ color: 'var(--text)', fontSize: 15, fontWeight: 600, marginTop: 2 }}>
              {user.firstName} {user.lastName ?? ''}
            </div>
            <div style={{
              color: 'var(--text2)', fontSize: 12, marginTop: 3, lineHeight: 1.3,
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>
              {user.bio || (lang === 'en'
                ? `since ${new Date(user.createdAt).toLocaleDateString('en', { month: 'long', year: 'numeric' })}`
                : `с ${new Date(user.createdAt).toLocaleDateString('ru', { month: 'long', year: 'numeric' })}`)}
            </div>
          </div>
        </div>

        {/* Public profile CTA */}
        <button onClick={() => navigate(`/user/${user.id}`)} style={{
          width: '100%', padding: 12, borderRadius: 12,
          background: 'var(--accent)', color: 'var(--accent-text)', border: 'none',
          fontWeight: 700, fontSize: 13, cursor: 'pointer',
          fontFamily: 'var(--font-sans)', boxShadow: 'var(--accent-glow)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <rect x="3" y="3" width="18" height="18" rx="5"/>
            <circle cx="12" cy="12" r="4"/>
            <circle cx="17.5" cy="6.5" r="1" fill="currentColor"/>
          </svg>
          {lang === 'en' ? 'Public profile' : 'Публичный профиль'} →
        </button>

        {/* 4-cell stats grid */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6,
          padding: 10, borderRadius: 12,
          background: 'var(--surface)', border: '1px solid var(--border)',
        }}>
          <Stat n={stats?.totalGenerations ?? 0} label={t('profile.generations')} />
          <Stat n={user.totalSpent} label={t('profile.spent')} />
          <Stat n={user.dailyStreak} label={t('profile.daysInRow')} />
          <Stat n={user.balance.toLocaleString()} label={t('profile.tokens')} accent />
        </div>

        {/* Top-up button */}
        <button className="btn-primary" onClick={() => navigate('/plans')}>
          {t('profile.topUp')} ⚡
        </button>

        {/* Daily bonus */}
        {dailyClaimed && dailyResult ? (
          <div style={{
            padding: 14, textAlign: 'center', borderRadius: 12,
            background: 'var(--accent-light)', border: '1px solid var(--accent)',
            boxShadow: 'var(--accent-glow)',
          }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>
              +{dailyResult.tokens} {t('profile.dailyClaimed')}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4 }}>
              {t('profile.dailySeries', { streak: String(dailyResult.streak) })}
            </div>
          </div>
        ) : canClaimDaily ? (
          <div className="daily-bonus-card" onClick={handleClaimDaily}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
                {t('profile.dailyBonus')}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>
                {t('profile.dailyDay', { day: String(nextStreak) })} — {t('profile.dailyGet', { tokens: String(nextBonus) })}
              </div>
            </div>
            <div className="daily-claim-btn">
              {dailyLoading ? '...' : t('profile.dailyClaim')}
            </div>
          </div>
        ) : (
          <div className="daily-bonus-disabled">
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{t('profile.dailyBonus')}</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>
                {t('profile.dailyComeBack')} {t('profile.dailyStreak', { streak: String(user.dailyStreak) })}
              </div>
            </div>
          </div>
        )}

        {/* Settings list */}
        <div className="section-eyebrow" style={{ padding: '8px 0 4px' }}>
          {t('profile.settings')}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <SettingsRow icon={<IconBell />} label={lang === 'en' ? 'Notifications' : 'Уведомления'}
            badge={unreadCount} onClick={() => navigate('/notifications')} />
          <SettingsRow icon={<IconStar />} label={t('profile.favorites')} onClick={() => navigate('/favorites')} />
          <SettingsRow icon={<IconTrophy />} label={t('profile.achievements')} onClick={() => navigate('/achievements')} />
          <SettingsRow icon={<IconUsers />} label={t('profile.inviteFriends')} subtitle={t('profile.inviteBonus')}
            onClick={() => navigate('/referral')} />
          <SettingsRow icon={<IconList />} label={t('profile.transactions')} onClick={() => navigate('/transactions')} />
          <SettingsRow icon={<IconTicket />} label={t('profile.promoCode')} onClick={() => navigate('/promo')} />
          <SettingsRow icon={<IconGear />} label={t('profile.settings')} onClick={() => navigate('/settings')} />
          <SettingsRow icon={<IconCode />} label={lang === 'en' ? 'Order bot development' : 'Заказать разработку бота'}
            onClick={() => {
              try { window.Telegram?.WebApp?.openTelegramLink('https://t.me/mnogoprofilnyi') } catch { window.open('https://t.me/mnogoprofilnyi') }
            }} />
          <SettingsRow icon={<IconRefresh />} label={lang === 'en' ? 'Replay tutorial' : 'Пересмотреть туториал'}
            onClick={() => { localStorage.removeItem('onboarding_done'); window.location.reload() }} />
          {isAdmin && <SettingsRow icon={<IconShield />} label="Admin Panel" onClick={() => navigate('/admin')} />}
        </div>
      </div>
    </>
  )
}

function Stat({ n, label, accent }: { n: number | string; label: string; accent?: boolean }) {
  return (
    <div className="stat-card">
      <div className={`stat-value${accent ? ' accent' : ''}`}>{n}</div>
      <div className="stat-label">{label}</div>
    </div>
  )
}

function SettingsRow({ icon, label, subtitle, badge, onClick }: {
  icon: React.ReactNode; label: string; subtitle?: string; badge?: number; onClick: () => void
}) {
  return (
    <div onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 14px', borderRadius: 10,
      background: 'var(--surface)', border: '1px solid var(--border)',
      cursor: 'pointer',
    }}>
      <span style={{ width: 22, display: 'flex', justifyContent: 'center', color: 'var(--text2)' }}>{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, color: 'var(--text)' }}>{label}</div>
        {subtitle && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>{subtitle}</div>}
      </div>
      {badge && badge > 0 ? (
        <div style={{
          minWidth: 20, height: 20, borderRadius: 10,
          background: 'var(--danger)', color: '#fff',
          fontSize: 11, fontWeight: 700, display: 'flex',
          alignItems: 'center', justifyContent: 'center', padding: '0 6px',
        }}>{badge}</div>
      ) : (
        <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="var(--text3)" strokeWidth={2} strokeLinecap="round">
          <path d="M6 4l4 4-4 4"/>
        </svg>
      )}
    </div>
  )
}

function isNewDay(lastDailyAt: string): boolean {
  const last = new Date(lastDailyAt)
  const now = new Date()
  return last.toDateString() !== now.toDateString()
}

// SVG Icons
const IconBell = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>
const IconStar = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/></svg>
const IconTrophy = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path d="M6 9V2h12v7a6 6 0 11-12 0z"/><path d="M6 4H3v3a3 3 0 003 3"/><path d="M18 4h3v3a3 3 0 01-3 3"/><path d="M12 15v4M8 22h8"/></svg>
const IconUsers = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><circle cx="9" cy="7" r="3"/><path d="M2 20c0-3 2.7-6 7-6s7 3 7 6"/><circle cx="17" cy="8" r="2.5"/><path d="M22 20c0-2.5-2-4.5-5-5"/></svg>
const IconList = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><path d="M3 6h18M3 12h14M3 18h10"/></svg>
const IconTicket = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path d="M2 9V6a2 2 0 012-2h16a2 2 0 012 2v3a2 2 0 000 4v3a2 2 0 01-2 2H4a2 2 0 01-2-2v-3a2 2 0 000-4z"/></svg>
const IconGear = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
const IconCode = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><path d="M16 18l6-6-6-6M8 6l-6 6 6 6"/></svg>
const IconRefresh = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>
const IconShield = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
