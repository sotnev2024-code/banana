import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { updateSettings } from '../api/client'

export default function SettingsPage() {
  const navigate = useNavigate()
  const { user, refresh } = useAuth()
  const [lang, setLang] = useState(user?.lang ?? 'ru')
  const [theme, setTheme] = useState(user?.theme ?? 'auto')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateSettings({ lang, theme })
      refresh()
      navigate(-1)
    } catch (e: any) {
      alert(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="topbar" style={{ gap: 12 }}>
        <button className="back-btn" onClick={() => navigate(-1)}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><path d="M11 4L6 9l5 5"/></svg>
        </button>
        <div className="topbar-title">Настройки</div>
      </div>

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Language */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 10 }}>Язык</div>
          <div className="card" style={{ overflow: 'hidden' }}>
            {[
              { id: 'ru', label: '🇷🇺 Русский' },
              { id: 'en', label: '🇬🇧 English' },
            ].map((l, i) => (
              <div
                key={l.id}
                className="menu-item"
                onClick={() => setLang(l.id)}
                style={i === 0 ? { borderBottom: '0.5px solid var(--border)' } : undefined}
              >
                <span style={{ fontSize: 15, flex: 1 }}>{l.label}</span>
                <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${lang === l.id ? 'var(--accent)' : 'var(--border)'}`, background: lang === l.id ? 'var(--accent)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {lang === l.id && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Theme */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 10 }}>Тема</div>
          <div className="card" style={{ overflow: 'hidden' }}>
            {[
              { id: 'auto', label: '📱 Авто (системная)' },
              { id: 'light', label: '☀️ Светлая' },
              { id: 'dark', label: '🌙 Тёмная' },
            ].map((t, i, arr) => (
              <div
                key={t.id}
                className="menu-item"
                onClick={() => setTheme(t.id)}
                style={i < arr.length - 1 ? { borderBottom: '0.5px solid var(--border)' } : undefined}
              >
                <span style={{ fontSize: 15, flex: 1 }}>{t.label}</span>
                <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${theme === t.id ? 'var(--accent)' : 'var(--border)'}`, background: theme === t.id ? 'var(--accent)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {theme === t.id && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />}
                </div>
              </div>
            ))}
          </div>
        </div>

        <button className="btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Сохраняю...' : 'Сохранить'}
        </button>

        {/* App info */}
        <div style={{ textAlign: 'center', color: 'var(--text3)', fontSize: 12, marginTop: 20 }}>
          PicPulse AI Studio v1.0
        </div>
      </div>
    </>
  )
}
