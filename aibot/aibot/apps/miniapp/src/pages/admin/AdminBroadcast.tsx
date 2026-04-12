import { useState } from 'react'
import { broadcast } from './api'
import { toast } from '../../components/ui/Toast'

export function AdminBroadcast() {
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ sent: number; failed: number } | null>(null)

  const handleSend = async () => {
    if (!message.trim() || sending) return
    if (!confirm(`Send to all users?\n\n${message.slice(0, 100)}...`)) return
    setSending(true)
    try {
      const res = await broadcast(message)
      setResult(res)
      toast(`Sent: ${res.sent}, Failed: ${res.failed}`)
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
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Broadcast message</div>
        <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 8 }}>Supports HTML: bold, italic, links</div>
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Message text..."
          className="prompt-area"
          rows={5}
        />
        <button onClick={handleSend} className="btn-primary" disabled={!message.trim() || sending}
          style={{ marginTop: 10 }}>
          {sending ? 'Sending...' : 'Send to all users'}
        </button>
      </div>

      {result && (
        <div className="card" style={{ padding: 14 }}>
          <div style={{ fontSize: 13 }}>Sent: {result.sent}</div>
          <div style={{ fontSize: 13, color: 'var(--danger)' }}>Failed: {result.failed}</div>
        </div>
      )}
    </div>
  )
}
