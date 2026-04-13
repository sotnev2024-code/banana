import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { updateSettings } from '../api/client'
import { t, getLang } from '../i18n'

export default function SettingsPage() {
  const navigate = useNavigate()
  const { user, refresh } = useAuth()
  const [lang, setLang] = useState(user?.lang ?? 'ru')
  const [theme, setTheme] = useState(user?.theme ?? 'auto')
  const [minDonate, setMinDonate] = useState(String(user?.minDonate ?? 1))
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateSettings({ lang, theme, minDonate: Number(minDonate) || 1 })
      await refresh()
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
        <div className="topbar-title">{t('settings.title')}</div>
      </div>

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 10 }}>{t('settings.language')}</div>
          <div className="card" style={{ overflow: 'hidden' }}>
            {[
              { id: 'ru', label: 'Русский' },
              { id: 'en', label: 'English' },
            ].map((l, i) => (
              <div key={l.id} className="menu-item" onClick={() => setLang(l.id)}
                style={i === 0 ? { borderBottom: '0.5px solid var(--border)' } : undefined}>
                <span style={{ fontSize: 15, flex: 1 }}>{l.label}</span>
                <RadioDot selected={lang === l.id} />
              </div>
            ))}
          </div>
        </div>

        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 10 }}>{t('settings.theme')}</div>
          <div className="card" style={{ overflow: 'hidden' }}>
            {[
              { id: 'auto', label: t('settings.themeAuto') },
              { id: 'light', label: t('settings.themeLight') },
              { id: 'dark', label: t('settings.themeDark') },
            ].map((item, i, arr) => (
              <div key={item.id} className="menu-item" onClick={() => setTheme(item.id)}
                style={i < arr.length - 1 ? { borderBottom: '0.5px solid var(--border)' } : undefined}>
                <span style={{ fontSize: 15, flex: 1 }}>{item.label}</span>
                <RadioDot selected={theme === item.id} />
              </div>
            ))}
          </div>
        </div>

        {/* Min donate */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 10 }}>
            {getLang() === 'en' ? 'Minimum donation' : 'Минимальный донат'}
          </div>
          <div className="card" style={{ padding: 14 }}>
            <input type="number" value={minDonate} onChange={e => setMinDonate(e.target.value)}
              min="1" max="10000" className="setting-text-input"
              placeholder={getLang() === 'en' ? 'Min tokens' : 'Мин. токенов'} />
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 6 }}>
              {getLang() === 'en' ? 'Users cannot donate less than this amount' : 'Пользователи не смогут отправить меньше этой суммы'}
            </div>
          </div>
        </div>

        <button className="btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? t('settings.saving') : t('settings.save')}
        </button>

        <div style={{ textAlign: 'center', color: 'var(--text3)', fontSize: 12, marginTop: 20 }}>
          {t('settings.version')}
        </div>
      </div>
    </>
  )
}

function RadioDot({ selected }: { selected: boolean }) {
  return (
    <div style={{
      width: 20, height: 20, borderRadius: '50%',
      border: `2px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
      background: selected ? 'var(--accent)' : 'transparent',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {selected && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />}
    </div>
  )
}
