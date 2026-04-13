import { useState } from 'react'
import { broadcast } from './api'
import { toast } from '../../components/ui/Toast'

export function AdminBroadcast() {
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ sent: number; failed: number } | null>(null)

  const handleSend = async () => {
    if (!message.trim() || sending) return
    if (!confirm(`Отправить всем пользователям?\n\n${message.slice(0, 100)}...`)) return
    setSending(true)
    try {
      const res = await broadcast(message)
      setResult(res)
      toast(`Отправлено: ${res.sent}, ошибок: ${res.failed}`)
      setMessage('')
    } catch (e: any) {
      toast(e.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="card" style={{ padding: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Массовая рассылка</div>
        <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 8 }}>Поддерживает HTML: жирный, курсив, ссылки</div>
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Текст сообщения..."
          className="prompt-area"
          rows={5}
        />
        <button onClick={handleSend} className="btn-primary" disabled={!message.trim() || sending}
          style={{ marginTop: 10 }}>
          {sending ? 'Отправка...' : 'Отправить всем'}
        </button>
      </div>

      {result && (
        <div className="card" style={{ padding: 14 }}>
          <div style={{ fontSize: 13 }}>Отправлено: {result.sent}</div>
          <div style={{ fontSize: 13, color: 'var(--danger)' }}>Ошибок: {result.failed}</div>
        </div>
      )}
    </div>
  )
}
