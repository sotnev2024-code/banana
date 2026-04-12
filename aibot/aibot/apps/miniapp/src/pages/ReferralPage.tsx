import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getReferralStats, type ReferralUser } from '../api/client'
import { REFERRAL_BONUS } from '@aibot/shared'

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
      // Fallback for Telegram WebApp
      window.Telegram?.WebApp?.openTelegramLink(
        `https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent('Попробуй AI генерацию!')}`
      )
    }
  }

  const handleShare = () => {
    window.Telegram?.WebApp?.openTelegramLink(
      `https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent('Попробуй AI генерацию! Фото, видео, музыка — всё в одном боте 🚀')}`
    )
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text2)' }}>Загрузка...</div>

  return (
    <>
      <div className="topbar" style={{ gap: 12 }}>
        <button className="back-btn" onClick={() => navigate(-1)}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><path d="M11 4L6 9l5 5"/></svg>
        </button>
        <div className="topbar-title">Пригласить друзей</div>
      </div>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Hero */}
        <div className="card" style={{ padding: 24, textAlign: 'center', background: 'var(--accent-light)' }}>
          <div style={{ fontSize: 48 }}>👥</div>
          <div style={{ fontSize: 18, fontWeight: 600, marginTop: 8 }}>Приглашайте друзей</div>
          <div style={{ fontSize: 14, color: 'var(--text2)', marginTop: 4 }}>
            Получайте <b>{REFERRAL_BONUS} 🪙</b> за каждого друга, который сделает первую покупку
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div className="card stat-card">
            <div className="stat-value">{count}</div>
            <div className="stat-label">Приглашено</div>
          </div>
          <div className="card stat-card">
            <div className="stat-value">{earned}</div>
            <div className="stat-label">Заработано 🪙</div>
          </div>
        </div>

        {/* Link */}
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 8 }}>Ваша ссылка</div>
          <div style={{ fontSize: 13, padding: '10px 12px', background: 'var(--surface2)', borderRadius: 8, wordBreak: 'break-all', color: 'var(--accent-dark)' }}>
            {refLink}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button className="btn-outline" style={{ flex: 1 }} onClick={handleCopy}>
              {copied ? '✓ Скопировано' : 'Копировать'}
            </button>
            <button className="btn-primary" style={{ flex: 1 }} onClick={handleShare}>
              Поделиться
            </button>
          </div>
        </div>

        {/* Referrals list */}
        {referrals.length > 0 && (
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', fontSize: 14, fontWeight: 600, borderBottom: '0.5px solid var(--border)' }}>
              Приглашённые ({referrals.length})
            </div>
            {referrals.map((r, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderBottom: i < referrals.length - 1 ? '0.5px solid var(--border)' : undefined }}>
                <div className="avatar-placeholder" style={{ width: 36, height: 36, fontSize: 14 }}>
                  {r.firstName[0]}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14 }}>{r.firstName}</div>
                  {r.username && <div style={{ fontSize: 12, color: 'var(--text2)' }}>@{r.username}</div>}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                  {new Date(r.createdAt).toLocaleDateString('ru')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
