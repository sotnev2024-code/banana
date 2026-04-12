import { type SettingOption } from '@aibot/shared'
import { getLang } from '../../i18n'

interface Props {
  settings: SettingOption[]
  values: Record<string, string | number | boolean>
  onChange: (id: string, value: string | number | boolean) => void
  maxPromptLength?: number
  promptLength?: number
}

export function ModelSettings({ settings, values, onChange, maxPromptLength, promptLength }: Props) {
  const lang = getLang()

  if (settings.length === 0 && !maxPromptLength) return null

  return (
    <div className="model-settings">
      {settings.map(s => {
        const label = lang === 'en' ? s.labelEn : s.labelRu
        const value = values[s.id] ?? s.defaultValue

        if (s.type === 'select') {
          return (
            <div key={s.id} className="setting-row">
              <div className="setting-label">{label}</div>
              <div className="setting-chips">
                {s.values!.map(v => (
                  <button
                    key={v}
                    className={`setting-chip ${value === v ? 'active' : ''}`}
                    onClick={() => onChange(s.id, v)}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          )
        }

        if (s.type === 'toggle') {
          const isOn = value === true || value === 'true'
          return (
            <div key={s.id} className="setting-row setting-toggle-row" onClick={() => onChange(s.id, !isOn)}>
              <div className="setting-label">{label}</div>
              <div className={`setting-toggle ${isOn ? 'on' : ''}`}>
                <div className="setting-toggle-knob" />
              </div>
            </div>
          )
        }

        if (s.type === 'slider') {
          const numVal = typeof value === 'number' ? value : Number(value)
          return (
            <div key={s.id} className="setting-row">
              <div className="setting-label">
                {label}: <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{numVal}</span>
              </div>
              <input
                type="range"
                className="setting-slider"
                min={s.min}
                max={s.max}
                step={s.step ?? 1}
                value={numVal}
                onChange={e => onChange(s.id, Number(e.target.value))}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text3)' }}>
                <span>{s.min}</span>
                <span>{s.max}</span>
              </div>
            </div>
          )
        }

        if (s.type === 'text') {
          return (
            <div key={s.id} className="setting-row">
              <div className="setting-label">{label}</div>
              <input
                type="text"
                className="setting-text-input"
                value={String(value ?? '')}
                onChange={e => onChange(s.id, e.target.value)}
                placeholder={label}
              />
            </div>
          )
        }

        return null
      })}

      {maxPromptLength && (
        <div className="setting-row" style={{ opacity: 0.6 }}>
          <div className="setting-label" style={{ fontSize: 11 }}>
            {lang === 'en' ? 'Prompt limit' : 'Лимит промпта'}: {promptLength ?? 0} / {maxPromptLength}
          </div>
          <div style={{ height: 3, background: 'var(--surface2)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${Math.min(100, ((promptLength ?? 0) / maxPromptLength) * 100)}%`,
              background: (promptLength ?? 0) > maxPromptLength * 0.9 ? 'var(--danger)' : 'var(--accent)',
              borderRadius: 2,
              transition: 'width 0.2s',
            }} />
          </div>
        </div>
      )}
    </div>
  )
}
