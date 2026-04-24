import { type SettingOption, type SettingConstraint, getDisabledValues } from '@aibot/shared'
import { getLang } from '../../i18n'

interface Props {
  settings: SettingOption[]
  values: Record<string, string | number | boolean>
  onChange: (id: string, value: string | number | boolean) => void
  maxPromptLength?: number
  promptLength?: number
  constraints?: SettingConstraint[]
}

export function ModelSettings({ settings, values, onChange, maxPromptLength, promptLength, constraints }: Props) {
  const lang = getLang()

  if (settings.length === 0 && !maxPromptLength) return null

  return (
    <div className="model-settings">
      {settings.map(s => {
        const label = lang === 'en' ? s.labelEn : s.labelRu
        const value = values[s.id] ?? s.defaultValue

        if (s.type === 'select') {
          const { disabled, reasons } = getDisabledValues(s.id, values, constraints)
          return (
            <div key={s.id} className="setting-row">
              <div className="setting-label">{label}</div>
              <div className="setting-chips">
                {s.values!.map(v => {
                  const isDisabled = disabled.has(v)
                  const reason = reasons.get(v)
                  return (
                    <button
                      key={v}
                      title={isDisabled && reason ? reason : undefined}
                      className={`setting-chip ${value === v ? 'active' : ''}`}
                      onClick={() => !isDisabled && onChange(s.id, v)}
                      style={isDisabled ? {
                        opacity: 0.35, cursor: 'not-allowed',
                        textDecoration: 'line-through',
                      } : undefined}
                    >
                      {v}
                    </button>
                  )
                })}
              </div>
              {/* Show first reason as a hint underneath when something is disabled */}
              {disabled.size > 0 && (
                <div style={{
                  fontSize: 10, color: 'var(--text3)', marginTop: 4,
                  fontFamily: 'var(--font-mono)',
                }}>
                  ⓘ {Array.from(reasons.values())[0]}
                </div>
              )}
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
