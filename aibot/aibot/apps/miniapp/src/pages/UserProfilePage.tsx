import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getPublicProfile, getUserGenerations, sendDonate, type PublicProfile, type Generation } from '../api/client'
import { useAuth } from '../hooks/useAuth'
import { t, getLang } from '../i18n'
import { toast } from '../components/ui/Toast'

export default function UserProfilePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user: me, refresh } = useAuth()
  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [items, setItems] = useState<Generation[]>([])
  const [loading, setLoading] = useState(true)
  const [showDonate, setShowDonate] = useState(false)
  const [donateAmount, setDonateAmount] = useState('')
  const [donateMsg, setDonateMsg] = useState('')
  const [sending, setSending] = useState(false)
  const cursorRef = useRef<string | null>(null)

  useEffect(() => {
    if (!id) return
    getPublicProfile(id).then(setProfile).catch(() => {})
    getUserGenerations(id).then(d => {
      setItems(d.items)
      cursorRef.current = d.nextCursor
    }).catch(() => {}).finally(() => setLoading(false))
  }, [id])

  const handleDonate = async () => {
    if (!id || !donateAmount || sending) return
    setSending(true)
    try {
      await sendDonate(id, Number(donateAmount), donateMsg || undefined)
      toast(getLang() === 'en' ? `Sent ${donateAmount} tokens` : `Отправлено ${donateAmount} токенов`)
      setShowDonate(false)
      setDonateAmount('')
      setDonateMsg('')
      refresh()
    } catch (e: any) {
      toast(e.message)
    } finally {
      setSending(false)
    }
  }

  const isMe = me?.id === id

  if (loading) {
    return (
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="skeleton" style={{ height: 80, borderRadius: 12 }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          <div className="skeleton" style={{ height: 100 }} />
          <div className="skeleton" style={{ height: 100 }} />
          <div className="skeleton" style={{ height: 100 }} />
        </div>
      </div>
    )
  }

  if (!profile) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text2)' }}>Not found</div>
  }

  return (
    <>
      <div className="topbar" style={{ gap: 12 }}>
        <button className="back-btn" onClick={() => navigate(-1)}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><path d="M11 4L6 9l5 5"/></svg>
        </button>
        <div className="topbar-title">{profile.firstName}</div>
      </div>

      <div style={{ padding: '16px 16px 100px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Profile header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {profile.photoUrl
            ? <img src={profile.photoUrl} alt="" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover' }} />
            : <div className="avatar-placeholder" style={{ width: 72, height: 72, fontSize: 28 }}>{profile.firstName[0]}</div>
          }
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', gap: 20, textAlign: 'center' }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{profile.generationsCount}</div>
                <div style={{ fontSize: 11, color: 'var(--text2)' }}>{getLang() === 'en' ? 'works' : 'работ'}</div>
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{profile.totalLikes}</div>
                <div style={{ fontSize: 11, color: 'var(--text2)' }}>{getLang() === 'en' ? 'likes' : 'лайков'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Name & username */}
        <div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>{profile.firstName}</div>
          {profile.username && <div style={{ fontSize: 13, color: 'var(--text2)' }}>@{profile.username}</div>}
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
            {t('profile.since', { date: new Date(profile.createdAt).toLocaleDateString(getLang() === 'en' ? 'en' : 'ru', { month: 'long', year: 'numeric' }) })}
          </div>
        </div>

        {/* Donate button */}
        {!isMe && profile.canReceiveDonations && (
          <button className="btn-primary" onClick={() => setShowDonate(true)}>
            {getLang() === 'en' ? `Donate tokens (min ${profile.minDonate})` : `Донат токенов (мин ${profile.minDonate})`}
          </button>
        )}
        {!isMe && !profile.canReceiveDonations && (
          <div style={{ padding: '10px 14px', background: 'var(--surface2)', borderRadius: 10, fontSize: 12, color: 'var(--text3)', textAlign: 'center' }}>
            {getLang() === 'en' ? 'This user cannot receive donations yet' : 'Этот пользователь пока не может получать донаты'}
          </div>
        )}

        {/* Donate panel */}
        {showDonate && (
          <div className="card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              {[5, 10, 25, 50, 100].map(amt => (
                <button key={amt} onClick={() => setDonateAmount(String(amt))}
                  className={`setting-chip ${donateAmount === String(amt) ? 'active' : ''}`}>
                  {amt}
                </button>
              ))}
            </div>
            <input type="number" value={donateAmount} onChange={e => setDonateAmount(e.target.value)}
              placeholder={getLang() === 'en' ? `Amount (min ${profile.minDonate})` : `Сумма (мин ${profile.minDonate})`}
              className="setting-text-input" style={{ marginBottom: 4 }} />
            {donateAmount && Number(donateAmount) > 0 && (
              <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 8, paddingLeft: 2 }}>
                {getLang() === 'en'
                  ? `${profile.firstName} receives ${Math.floor(Number(donateAmount) * 0.9)} tokens (10% fee)`
                  : `${profile.firstName} получит ${Math.floor(Number(donateAmount) * 0.9)} токенов (комиссия 10%)`}
              </div>
            )}
            <input type="text" value={donateMsg} onChange={e => setDonateMsg(e.target.value)}
              placeholder={getLang() === 'en' ? 'Message (optional)' : 'Сообщение (необязательно)'}
              className="setting-text-input" style={{ marginBottom: 10 }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-outline" style={{ flex: 1 }} onClick={() => setShowDonate(false)}>
                {getLang() === 'en' ? 'Cancel' : 'Отмена'}
              </button>
              <button className="btn-primary" style={{ flex: 1 }} onClick={handleDonate}
                disabled={!donateAmount || Number(donateAmount) < profile.minDonate || sending}>
                {sending ? '...' : getLang() === 'en' ? 'Send' : 'Отправить'}
              </button>
            </div>
          </div>
        )}

        {/* Generations grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
          {items.map(item => (
            <div key={item.id} onClick={() => navigate(`/generation/${item.id}`)}
              style={{ aspectRatio: '1', overflow: 'hidden', cursor: 'pointer', background: 'var(--surface2)' }}>
              {item.resultUrl ? (
                item.type === 'VIDEO' || item.type === 'MOTION'
                  ? <video src={(item as any).thumbnailUrl ?? item.resultUrl} muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <img src={(item as any).thumbnailUrl ?? item.resultUrl} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth={1.5}>
                    <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/>
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>

        {items.length === 0 && !loading && (
          <div style={{ padding: 30, textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>
            {getLang() === 'en' ? 'No public works yet' : 'Пока нет публичных работ'}
          </div>
        )}
      </div>
    </>
  )
}
