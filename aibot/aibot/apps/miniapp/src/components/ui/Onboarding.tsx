import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getLang } from '../../i18n'

interface Slide {
  icon: string
  title: string
  text: string
  mockup: 'welcome' | 'create' | 'feed' | 'achievements' | 'profile' | 'start'
  route?: string
}

const slides: Record<string, Slide[]> = {
  ru: [
    {
      icon: 'M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z',
      title: 'Добро пожаловать в PicPulse',
      text: 'AI-студия для создания фото, видео, музыки и анимации',
      mockup: 'welcome',
    },
    {
      icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
      title: 'Создавайте контент',
      text: 'Выберите модель, напишите промпт — результат за минуты',
      mockup: 'create',
      route: '/create',
    },
    {
      icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
      title: 'Лента генераций',
      text: 'Смотрите работы других, ставьте лайки, комментируйте',
      mockup: 'feed',
      route: '/feed',
    },
    {
      icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
      title: 'Достижения',
      text: 'Выполняйте задания, открывайте награды и получайте токены',
      mockup: 'achievements',
      route: '/achievements',
    },
    {
      icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      title: 'Профиль и бонусы',
      text: 'Ежедневные бонусы, рефералы, промокоды и настройки',
      mockup: 'profile',
      route: '/profile',
    },
    {
      icon: 'M13 10V3L4 14h7v7l9-11h-7z',
      title: 'Начнём!',
      text: 'Вам начислены приветственные токены. Создайте первую генерацию!',
      mockup: 'start',
    },
  ],
  en: [
    {
      icon: 'M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z',
      title: 'Welcome to PicPulse',
      text: 'AI studio for creating photos, videos, music and animation',
      mockup: 'welcome',
    },
    {
      icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
      title: 'Create content',
      text: 'Choose a model, write a prompt — get results in minutes',
      mockup: 'create',
      route: '/create',
    },
    {
      icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
      title: 'Generation feed',
      text: 'Browse other users\' work, like and comment',
      mockup: 'feed',
      route: '/feed',
    },
    {
      icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
      title: 'Achievements',
      text: 'Complete tasks, unlock rewards and earn tokens',
      mockup: 'achievements',
      route: '/achievements',
    },
    {
      icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      title: 'Profile & bonuses',
      text: 'Daily bonuses, referrals, promo codes and settings',
      mockup: 'profile',
      route: '/profile',
    },
    {
      icon: 'M13 10V3L4 14h7v7l9-11h-7z',
      title: 'Let\'s go!',
      text: 'Welcome tokens credited. Create your first generation!',
      mockup: 'start',
    },
  ],
}

// ─── Mockup components ──────────────────────────────────────────────

function MockupWelcome({ lang }: { lang: string }) {
  const models = ['Nano Banana', 'Veo 3', 'Kling 3', 'Seedance', 'Grok', 'Suno']
  return (
    <div style={mockupContainer}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
        {models.map((m, i) => (
          <div key={m} className="onb-model-chip" style={{
            ...chipStyle,
            animationDelay: `${i * 0.12}s`,
          }}>{m}</div>
        ))}
      </div>
      <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text3)', textAlign: 'center' }}>
        {lang === 'en' ? '20+ AI models' : '20+ AI моделей'}
      </div>
    </div>
  )
}

function MockupCreate({ lang }: { lang: string }) {
  return (
    <div style={mockupContainer}>
      {/* Mini model selector */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        <div style={{ ...miniCardStyle, background: 'var(--accent)', color: '#fff' }}>
          {lang === 'en' ? 'Photo' : 'Фото'}
        </div>
        <div style={miniCardStyle}>{lang === 'en' ? 'Video' : 'Видео'}</div>
        <div style={miniCardStyle}>{lang === 'en' ? 'Music' : 'Музыка'}</div>
      </div>
      {/* Prompt mockup */}
      <div style={{
        background: 'var(--surface2)', borderRadius: 10, padding: '10px 12px',
        fontSize: 12, color: 'var(--text2)', marginBottom: 10, width: '100%',
      }}>
        <span className="onb-typing">{lang === 'en' ? 'A cat astronaut on Mars...' : 'Кот-астронавт на Марсе...'}</span>
      </div>
      {/* Generate button mockup */}
      <div style={{
        background: 'var(--accent)', color: '#fff', borderRadius: 10,
        padding: '8px 20px', fontSize: 13, fontWeight: 600, textAlign: 'center',
      }}>
        {lang === 'en' ? 'Generate' : 'Сгенерировать'}
      </div>
    </div>
  )
}

function MockupFeed() {
  return (
    <div style={mockupContainer}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, width: '100%' }}>
        {[1,2,3,4].map(i => (
          <div key={i} className="onb-feed-card" style={{
            background: `linear-gradient(${45 + i * 30}deg, var(--accent-light), var(--surface2))`,
            borderRadius: 10, height: 70, position: 'relative', overflow: 'hidden',
            animationDelay: `${i * 0.15}s`,
          }}>
            <div style={{
              position: 'absolute', bottom: 4, left: 6, display: 'flex', gap: 4, alignItems: 'center',
            }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="var(--danger)" stroke="none">
                <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
              </svg>
              <span style={{ fontSize: 9, color: 'var(--text2)' }}>{10 + i * 3}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function MockupAchievements({ lang }: { lang: string }) {
  const items = lang === 'en'
    ? ['First generation', '10 generations', '5 likes received']
    : ['Первая генерация', '10 генераций', '5 лайков получено']
  return (
    <div style={mockupContainer}>
      {items.map((item, i) => (
        <div key={i} className="onb-ach-row" style={{
          display: 'flex', alignItems: 'center', gap: 8, width: '100%',
          padding: '6px 10px', background: 'var(--surface2)', borderRadius: 10, marginBottom: 6,
          animationDelay: `${i * 0.2}s`,
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: i < 2 ? 'var(--accent)' : 'var(--surface)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            {i < 2 ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5}>
                <path d="M5 13l4 4L19 7"/>
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth={2}>
                <circle cx="12" cy="12" r="9"/>
              </svg>
            )}
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)' }}>{item}</div>
            <div style={{ fontSize: 9, color: 'var(--accent)' }}>+{(i + 1) * 5} tokens</div>
          </div>
        </div>
      ))}
    </div>
  )
}

function MockupProfile({ lang }: { lang: string }) {
  const menuItems = lang === 'en'
    ? ['Daily bonus', 'Achievements', 'Invite friends', 'Settings']
    : ['Ежедневный бонус', 'Достижения', 'Пригласить друзей', 'Настройки']
  return (
    <div style={mockupContainer}>
      {/* Balance */}
      <div style={{
        background: 'var(--accent-light)', borderRadius: 12, padding: '8px 16px',
        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, width: '100%',
      }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent)' }}>150</div>
        <div style={{ fontSize: 11, color: 'var(--text2)' }}>{lang === 'en' ? 'tokens' : 'токенов'}</div>
      </div>
      {/* Menu items */}
      {menuItems.map((item, i) => (
        <div key={i} className="onb-menu-row" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', padding: '6px 10px', borderBottom: '0.5px solid var(--border)',
          animationDelay: `${i * 0.1}s`,
        }}>
          <span style={{ fontSize: 12, color: 'var(--text)' }}>{item}</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth={2}>
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </div>
      ))}
    </div>
  )
}

function MockupStart({ lang }: { lang: string }) {
  return (
    <div style={{ ...mockupContainer, justifyContent: 'center' }}>
      <div className="onb-pulse-ring" style={{
        width: 70, height: 70, borderRadius: '50%', background: 'var(--accent)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round">
          <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
        </svg>
      </div>
      <div style={{ marginTop: 12, fontSize: 13, fontWeight: 600, color: 'var(--accent)', textAlign: 'center' }}>
        {lang === 'en' ? 'Ready to create!' : 'Готовы создавать!'}
      </div>
    </div>
  )
}

// ─── Styles ─────────────────────────────────────────────────────────

const mockupContainer: React.CSSProperties = {
  width: '100%', maxWidth: 260, padding: 16,
  background: 'var(--surface)', borderRadius: 16,
  border: '0.5px solid var(--border)',
  display: 'flex', flexDirection: 'column', alignItems: 'center',
}

const chipStyle: React.CSSProperties = {
  padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 500,
  background: 'var(--surface2)', color: 'var(--text)',
}

const miniCardStyle: React.CSSProperties = {
  padding: '5px 12px', borderRadius: 8, fontSize: 11, fontWeight: 500,
  background: 'var(--surface2)', color: 'var(--text2)',
}

// ─── Mockup renderer ────────────────────────────────────────────────

function Mockup({ type, lang }: { type: Slide['mockup']; lang: string }) {
  switch (type) {
    case 'welcome': return <MockupWelcome lang={lang} />
    case 'create': return <MockupCreate lang={lang} />
    case 'feed': return <MockupFeed />
    case 'achievements': return <MockupAchievements lang={lang} />
    case 'profile': return <MockupProfile lang={lang} />
    case 'start': return <MockupStart lang={lang} />
  }
}

// ─── Main component ─────────────────────────────────────────────────

export function Onboarding({ onComplete }: { onComplete: () => void }) {
  const [current, setCurrent] = useState(0)
  const [direction, setDirection] = useState<'left' | 'right' | null>(null)
  const touchRef = useRef<number>(0)
  const navigate = useNavigate()
  const lang = getLang() === 'en' ? 'en' : 'ru'
  const items = slides[lang]
  const slide = items[current]
  const isLast = current === items.length - 1

  const goTo = (idx: number, dir: 'left' | 'right') => {
    setDirection(dir)
    setTimeout(() => {
      setCurrent(idx)
      setDirection(null)
    }, 200)
  }

  const next = () => {
    if (isLast) {
      localStorage.setItem('onboarding_done', '1')
      onComplete()
      navigate('/create')
    } else {
      goTo(current + 1, 'left')
    }
  }

  const prev = () => {
    if (current > 0) goTo(current - 1, 'right')
  }

  // Swipe support
  const onTouchStart = (e: React.TouchEvent) => {
    touchRef.current = e.touches[0].clientX
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    const diff = touchRef.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) {
      if (diff > 0 && !isLast) next()
      else if (diff < 0 && current > 0) prev()
    }
  }

  // Keyboard support
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next()
      if (e.key === 'ArrowLeft') prev()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  })

  const finish = () => {
    localStorage.setItem('onboarding_done', '1')
    onComplete()
  }

  const tryRoute = () => {
    if (slide.route) {
      localStorage.setItem('onboarding_done', '1')
      onComplete()
      navigate(slide.route)
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 300, background: 'var(--bg)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'space-between', padding: '40px 24px 32px',
        overflow: 'hidden',
      }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* CSS animations */}
      <style>{`
        @keyframes onb-slide-in-left {
          from { opacity: 0; transform: translateX(60px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes onb-slide-in-right {
          from { opacity: 0; transform: translateX(-60px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes onb-slide-out-left {
          from { opacity: 1; transform: translateX(0); }
          to { opacity: 0; transform: translateX(-60px); }
        }
        @keyframes onb-slide-out-right {
          from { opacity: 1; transform: translateX(0); }
          to { opacity: 0; transform: translateX(60px); }
        }
        @keyframes onb-fade-up {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes onb-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(127,119,221,0.4); }
          50% { box-shadow: 0 0 0 14px rgba(127,119,221,0); }
        }
        @keyframes onb-typing-cursor {
          0%, 100% { border-right-color: var(--accent); }
          50% { border-right-color: transparent; }
        }
        .onb-model-chip {
          animation: onb-fade-up 0.4s ease both;
        }
        .onb-feed-card {
          animation: onb-fade-up 0.4s ease both;
        }
        .onb-ach-row {
          animation: onb-fade-up 0.4s ease both;
        }
        .onb-menu-row {
          animation: onb-fade-up 0.3s ease both;
        }
        .onb-pulse-ring {
          animation: onb-pulse 2s ease-in-out infinite;
        }
        .onb-typing {
          border-right: 2px solid var(--accent);
          padding-right: 2px;
          animation: onb-typing-cursor 0.8s step-end infinite;
        }
        .onb-content {
          animation: onb-slide-in-left 0.3s ease;
        }
        .onb-content.dir-right {
          animation: onb-slide-in-right 0.3s ease;
        }
        .onb-content.leaving-left {
          animation: onb-slide-out-left 0.2s ease forwards;
        }
        .onb-content.leaving-right {
          animation: onb-slide-out-right 0.2s ease forwards;
        }
      `}</style>

      {/* Top: step counter */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        width: '100%', maxWidth: 320,
      }}>
        <div style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 500 }}>
          {current + 1} / {items.length}
        </div>
        {!isLast && (
          <button onClick={finish}
            style={{ fontSize: 13, color: 'var(--text3)', fontWeight: 500 }}>
            {lang === 'en' ? 'Skip' : 'Пропустить'}
          </button>
        )}
      </div>

      {/* Middle: content */}
      <div
        key={current}
        className={`onb-content${direction === 'left' ? ' leaving-left' : direction === 'right' ? ' leaving-right' : ''}`}
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          flex: 1, justifyContent: 'center', maxWidth: 320, width: '100%',
        }}
      >
        {/* Icon */}
        <div style={{
          width: 56, height: 56, borderRadius: '50%', background: 'var(--accent-light)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
        }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
            <path d={slide.icon} />
          </svg>
        </div>

        {/* Title */}
        <div style={{ fontSize: 20, fontWeight: 700, textAlign: 'center', marginBottom: 6, color: 'var(--text)' }}>
          {slide.title}
        </div>

        {/* Text */}
        <div style={{ fontSize: 14, color: 'var(--text2)', textAlign: 'center', lineHeight: 1.5, marginBottom: 20 }}>
          {slide.text}
        </div>

        {/* Interactive mockup */}
        <Mockup type={slide.mockup} lang={lang} />

        {/* "Try" link for middle slides */}
        {slide.route && (
          <button onClick={tryRoute} style={{
            marginTop: 12, fontSize: 12, color: 'var(--accent)', fontWeight: 500,
            textDecoration: 'underline', textUnderlineOffset: 3,
          }}>
            {lang === 'en' ? 'Try it now' : 'Попробовать сейчас'}
          </button>
        )}
      </div>

      {/* Bottom: dots + buttons */}
      <div style={{ width: '100%', maxWidth: 320 }}>
        {/* Progress dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 20 }}>
          {items.map((_, i) => (
            <div key={i} style={{
              width: i === current ? 20 : 6, height: 6, borderRadius: 3,
              background: i === current ? 'var(--accent)' : 'var(--surface2)',
              transition: 'all 0.3s ease',
            }} />
          ))}
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          {current > 0 && (
            <button className="btn-outline" style={{ flex: 1, padding: '12px 0', borderRadius: 12, fontSize: 14 }} onClick={prev}>
              {lang === 'en' ? 'Back' : 'Назад'}
            </button>
          )}
          <button className="btn-primary" style={{
            flex: current > 0 ? 2 : 1, padding: '12px 0', borderRadius: 12, fontSize: 14, fontWeight: 600,
          }} onClick={next}>
            {isLast
              ? (lang === 'en' ? 'Create first generation' : 'Создать первую генерацию')
              : (lang === 'en' ? 'Next' : 'Далее')
            }
          </button>
        </div>
      </div>
    </div>
  )
}
