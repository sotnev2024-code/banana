import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function PaymentSuccessPage() {
  const navigate = useNavigate()
  const { refresh } = useAuth()

  useEffect(() => {
    // Refresh balance and redirect after 3s
    refresh()
    const t = setTimeout(() => navigate('/profile'), 3000)
    return () => clearTimeout(t)
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', gap: 16, padding: 32, textAlign: 'center' }}>
      <div style={{ fontSize: 64 }}>✅</div>
      <div style={{ fontSize: 22, fontWeight: 700 }}>Оплата прошла!</div>
      <div style={{ fontSize: 15, color: 'var(--text2)' }}>Токены уже зачислены на ваш счёт</div>
      <button className="btn-primary" style={{ marginTop: 8 }} onClick={() => navigate('/create')}>
        Начать генерировать
      </button>
    </div>
  )
}
