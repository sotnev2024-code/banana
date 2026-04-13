import { useState } from 'react'
import { getLang } from '../../i18n'

const slides = {
  ru: [
    {
      icon: 'M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z',
      title: 'Добро пожаловать в PicPulse',
      text: 'AI-студия для создания фото, видео, музыки и анимации. 20+ моделей на выбор.',
    },
    {
      icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
      title: 'Создавайте контент',
      text: 'Выберите модель, напишите промпт и получите результат за минуты. Загружайте референсы для точного результата.',
    },
    {
      icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
      title: 'Социальная лента',
      text: 'Публикуйте работы, ставьте лайки, комментируйте, подписывайтесь на авторов и отправляйте донаты.',
    },
    {
      icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      title: 'Токены и бонусы',
      text: 'Получайте ежедневные бонусы, выполняйте достижения, приглашайте друзей и зарабатывайте токены.',
    },
  ],
  en: [
    {
      icon: 'M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z',
      title: 'Welcome to PicPulse',
      text: 'AI studio for creating photos, videos, music and animation. 20+ models to choose from.',
    },
    {
      icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
      title: 'Create content',
      text: 'Choose a model, write a prompt and get results in minutes. Upload references for precise results.',
    },
    {
      icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
      title: 'Social feed',
      text: 'Publish your work, like, comment, follow creators and send donations.',
    },
    {
      icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      title: 'Tokens & bonuses',
      text: 'Earn daily bonuses, complete achievements, invite friends and earn tokens.',
    },
  ],
}

export function Onboarding({ onComplete }: { onComplete: () => void }) {
  const [current, setCurrent] = useState(0)
  const lang = getLang() === 'en' ? 'en' : 'ru'
  const items = slides[lang]
  const slide = items[current]
  const isLast = current === items.length - 1

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300, background: 'var(--bg)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '40px 24px',
    }}>
      {/* Icon */}
      <div style={{
        width: 100, height: 100, borderRadius: '50%', background: 'var(--accent-light)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 32,
      }}>
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
          <path d={slide.icon} />
        </svg>
      </div>

      {/* Title */}
      <div style={{ fontSize: 22, fontWeight: 700, textAlign: 'center', marginBottom: 12, color: 'var(--text)' }}>
        {slide.title}
      </div>

      {/* Text */}
      <div style={{ fontSize: 15, color: 'var(--text2)', textAlign: 'center', lineHeight: 1.5, maxWidth: 300, marginBottom: 40 }}>
        {slide.text}
      </div>

      {/* Dots */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
        {items.map((_, i) => (
          <div key={i} style={{
            width: i === current ? 24 : 8, height: 8, borderRadius: 4,
            background: i === current ? 'var(--accent)' : 'var(--surface2)',
            transition: 'width 0.3s',
          }} />
        ))}
      </div>

      {/* Buttons */}
      <div style={{ width: '100%', maxWidth: 300, display: 'flex', gap: 10 }}>
        {current > 0 && (
          <button className="btn-outline" style={{ flex: 1 }} onClick={() => setCurrent(current - 1)}>
            {lang === 'en' ? 'Back' : 'Назад'}
          </button>
        )}
        <button className="btn-primary" style={{ flex: 1 }} onClick={() => {
          if (isLast) {
            localStorage.setItem('onboarding_done', '1')
            onComplete()
          } else {
            setCurrent(current + 1)
          }
        }}>
          {isLast ? (lang === 'en' ? 'Get started' : 'Начать') : (lang === 'en' ? 'Next' : 'Далее')}
        </button>
      </div>

      {/* Skip */}
      {!isLast && (
        <button onClick={() => { localStorage.setItem('onboarding_done', '1'); onComplete() }}
          style={{ marginTop: 16, fontSize: 13, color: 'var(--text3)' }}>
          {lang === 'en' ? 'Skip' : 'Пропустить'}
        </button>
      )}
    </div>
  )
}
