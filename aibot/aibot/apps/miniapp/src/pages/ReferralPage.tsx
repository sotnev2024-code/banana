import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getReferralStats, type ReferralUser } from '../api/client'
import { REFERRAL_BONUS } from '@aibot/shared'
import { t } from '../i18n'

export default function ReferralPage() {
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [count, setCount] = useState(0)
  const [earned, setEarned] = useState(0)
  const [referrals, setReferrals] = useState<ReferralUser[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    getReferralStats().then(data => {
      setCode(data.code)
      setCount(data.count)
      setEarned(data.earned)
      setReferrals(data.referrals)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const botUsername = import.meta.env.VITE_BOT_USERNAME
  const refLink = `https://t.me/${botUsername}?start=ref_${code}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(refLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      window.Telegram?.WebApp?.openTelegramLink(
        `https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent(t('ref.shareText'))}`
      )
    }
  }

  const handleShare = () => {
    window.Telegram?.WebApp?.openTelegramLink(
      `https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent(t('ref.shareText'))}`
    )
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text2)' }}>{t('profile.loading')}</div>

  return (
    <>
      <div className="topbar" style={{ gap: 12 }}>
        <button className="back-btn" onClick={() => navigate(-1)}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><path d="M11 4L6 9l5 5"/></svg>
        </button>
        <div className="topbar-title">{t('ref.title')}</div>
      </div>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="card" style={{ padding: 24, textAlign: 'center', background: 'var(--accent-light)' }}>
          <IconUsers />
          <div style={{ fontSize: 18, fontWeight: 600, marginTop: 12 }}>{t('ref.hero')}</div>
          <div style={{ fontSize: 14, color: 'var(--text2)', marginTop: 4 }}>
            {t('ref.heroDesc', { bonus: String(REFERRAL_BONUS) })}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div className="card stat-card">
            <div className="stat-value">{count}</div>
            <div className="stat-label">{t('ref.invited')}</div>
          </div>
          <div className="card stat-card">
            <div className="stat-value">{earned}</div>
            <div className="stat-label">{t('ref.earned')}</div>
          </div>
        </div>

        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 8 }}>{t('ref.yourLink')}</div>
          <div style={{ fontSize: 13, padding: '10px 12px', background: 'var(--surface2)', borderRadius: 8, wordBreak: 'break-all', color: 'var(--accent-dark)' }}>
            {refLink}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button className="btn-outline" style={{ flex: 1 }} onClick={handleCopy}>
              {copied ? t('ref.copied') : t('ref.copy')}
            </button>
            <button className="btn-primary" style={{ flex: 1 }} onClick={handleShare}>
              {t('ref.share')}
            </button>
          </div>
        </div>

        {referrals.length > 0 && (
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', fontSize: 14, fontWeight: 600, borderBottom: '0.5px solid var(--border)' }}>
              {t('ref.invitedList', { count: String(referrals.length) })}
            </div>
            {referrals.map((r, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderBottom: i < referrals.length - 1 ? '0.5px solid var(--border)' : undefined }}>
                <div className="avatar-placeholder" style={{ width: 36, height: 36, fontSize: 14 }}>{r.firstName[0]}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14 }}>{r.firstName}</div>
                  {r.username && <div style={{ fontSize: 12, color: 'var(--text2)' }}>@{r.username}</div>}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>{new Date(r.createdAt).toLocaleDateString('ru')}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

const IconUsers = () => <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth={1.5} style={{ margin: '0 auto' }}><circle cx="9" cy="7" r="3"/><path d="M2 20c0-3 2.7-6 7-6s7 3 7 6"/><circle cx="17" cy="8" r="2.5"/><path d="M22 20c0-2.5-2-4.5-5-5"/></svg>
