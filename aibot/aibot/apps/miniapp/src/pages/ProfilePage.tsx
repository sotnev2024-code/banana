// ProfilePage.tsx
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function ProfilePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  if (!user) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text2)' }}>Загрузка...</div>

  return (
    <>
      <div className="topbar"><div className="topbar-title">Профиль</div></div>
      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {user.photoUrl
            ? <img src={user.photoUrl} alt="" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover' }} />
            : <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, color: 'var(--accent-dark)', fontWeight: 600 }}>
                {user.firstName[0]}
              </div>
          }
          <div>
            <div style={{ fontSize: 18, fontWeight: 600 }}>{user.firstName} {user.lastName ?? ''}</div>
            {user.username && <div style={{ fontSize: 13, color: 'var(--text2)' }}>@{user.username}</div>}
          </div>
        </div>

        {/* Balance card */}
        <div className="card" style={{ padding: '20px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 4 }}>Баланс токенов</div>
          <div style={{ fontSize: 36, fontWeight: 700, color: 'var(--accent)' }}>{user.balance}</div>
          <div style={{ fontSize: 12, color: 'var(--text3)' }}>🪙 токенов</div>
          <button className="btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/plans')}>
            Пополнить
          </button>
        </div>
      </div>
    </>
  )
}
