import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { t, getLang } from '../i18n'

type CategoryId = 'portrait' | 'landscape' | 'character' | 'food' | 'animal' | 'fantasy' | 'cyberpunk' | 'anime' | 'product' | 'abstract'

interface Idea {
  id: string
  category: CategoryId
  model?: string
  type?: 'IMAGE' | 'VIDEO' | 'MUSIC' | 'MOTION'
  prompt: string
  promptEn: string
  gradient: string
}

const categories: { id: CategoryId | 'all'; labelRu: string; labelEn: string }[] = [
  { id: 'all',       labelRu: 'Все',        labelEn: 'All' },
  { id: 'portrait',  labelRu: 'Портреты',   labelEn: 'Portraits' },
  { id: 'landscape', labelRu: 'Пейзажи',    labelEn: 'Landscapes' },
  { id: 'character', labelRu: 'Персонажи',  labelEn: 'Characters' },
  { id: 'food',      labelRu: 'Еда',        labelEn: 'Food' },
  { id: 'animal',    labelRu: 'Животные',   labelEn: 'Animals' },
  { id: 'fantasy',   labelRu: 'Фэнтези',    labelEn: 'Fantasy' },
  { id: 'cyberpunk', labelRu: 'Киберпанк',  labelEn: 'Cyberpunk' },
  { id: 'anime',     labelRu: 'Аниме',      labelEn: 'Anime' },
  { id: 'product',   labelRu: 'Продукты',   labelEn: 'Product' },
  { id: 'abstract',  labelRu: 'Абстракция', labelEn: 'Abstract' },
]

const ideas: Idea[] = [
  // Portraits
  { id: 'p1', category: 'portrait',
    prompt: 'Портрет молодой девушки с рыжими волосами, мягкое солнечное освещение у окна, тёплые тона, кинематографичный фокус, плёночная фотография, детализированная кожа',
    promptEn: 'Portrait of a young woman with red hair, soft sunlight through the window, warm tones, cinematic focus, film photography, detailed skin',
    gradient: 'linear-gradient(135deg,#ffd3a5,#fd6585)' },
  { id: 'p2', category: 'portrait',
    prompt: 'Монохромный портрет пожилого моряка с глубокими морщинами, седой бородой, шляпой с широкими полями, штормовое море на заднем плане, высокий контраст',
    promptEn: 'Monochrome portrait of an old sailor with deep wrinkles, grey beard, wide-brimmed hat, stormy sea background, high contrast',
    gradient: 'linear-gradient(135deg,#667eea,#2c3e50)' },
  { id: 'p3', category: 'portrait',
    prompt: 'Стилизованный портрет в стиле cyberpunk: девушка с голографическими очками, неоновые отражения на лице, фиолетово-розовые блики, футуристичная одежда',
    promptEn: 'Cyberpunk stylized portrait: woman with holographic glasses, neon reflections on face, purple-pink highlights, futuristic outfit',
    gradient: 'linear-gradient(135deg,#9f7aea,#ed64a6)' },

  // Landscapes
  { id: 'l1', category: 'landscape',
    prompt: 'Альпийская долина на рассвете, туман между горами, хрустальное озеро с отражением, пурпурное небо, деревянный домик у воды, реалистичная детализация 4K',
    promptEn: 'Alpine valley at dawn, mist between mountains, crystal lake with reflection, purple sky, wooden cabin by the water, realistic 4K detail',
    gradient: 'linear-gradient(135deg,#74b9ff,#0984e3)' },
  { id: 'l2', category: 'landscape',
    prompt: 'Марокканская пустыня, дюны на закате, одинокий караван верблюдов, золотой час, длинные тени, широкий угол, эпический ландшафт',
    promptEn: 'Moroccan desert, dunes at sunset, lone camel caravan, golden hour, long shadows, wide angle, epic landscape',
    gradient: 'linear-gradient(135deg,#f6d365,#fda085)' },
  { id: 'l3', category: 'landscape',
    prompt: 'Ночной Токио с высоты птичьего полёта, дождь, неоновые вывески, отражения в лужах, фуражировка, размытие движения машин',
    promptEn: 'Tokyo at night from a bird-eye view, rain, neon signs, puddle reflections, motion blur of cars',
    gradient: 'linear-gradient(135deg,#ff9a9e,#fad0c4)' },

  // Characters
  { id: 'c1', category: 'character',
    prompt: 'Фэнтези-лучница в кожаной броне, длинные серебряные волосы, волшебный лук со светящимися рунами, мистический лес, объёмное освещение, Unreal Engine стиль',
    promptEn: 'Fantasy archer in leather armor, long silver hair, magical bow with glowing runes, mystical forest, volumetric lighting, Unreal Engine style',
    gradient: 'linear-gradient(135deg,#a18cd1,#fbc2eb)' },
  { id: 'c2', category: 'character',
    prompt: 'Космонавт на чужой планете, инопланетная флора, две луны в небе, мягкие пурпурные тона, реалистичный скафандр с отражениями, кинематографичный кадр',
    promptEn: 'Astronaut on alien planet, exotic flora, two moons in sky, soft purple tones, realistic spacesuit with reflections, cinematic frame',
    gradient: 'linear-gradient(135deg,#5ee7df,#b490ca)' },

  // Food
  { id: 'f1', category: 'food', model: 'nano-banana-pro',
    prompt: 'Клубничный чизкейк крупным планом, капли конденсата на ягодах, мятный листик, мягкое окно-освещение, food-photography, высокая детализация',
    promptEn: 'Strawberry cheesecake close-up, condensation drops on berries, mint leaf, soft window lighting, food photography, high detail',
    gradient: 'linear-gradient(135deg,#fccb90,#d57eeb)' },
  { id: 'f2', category: 'food',
    prompt: 'Японский рамен в керамической пиале, пар поднимается, яйцо итамаго в разрезе, зелёный лук, минималистичная композиция, тёплое освещение',
    promptEn: 'Japanese ramen in ceramic bowl, steam rising, soft-boiled egg cross-section, green onion, minimalist composition, warm lighting',
    gradient: 'linear-gradient(135deg,#ffecd2,#fcb69f)' },

  // Animals
  { id: 'a1', category: 'animal',
    prompt: 'Белый бенгальский тигр в прыжке через водную гладь, брызги воды замерли в воздухе, тропический фон, макросъёмка, высокая скорость затвора',
    promptEn: 'White Bengal tiger leaping through water, frozen splashes mid-air, tropical background, macro shot, high shutter speed',
    gradient: 'linear-gradient(135deg,#e0c3fc,#8ec5fc)' },
  { id: 'a2', category: 'animal',
    prompt: 'Милый рыжий корги в вязаном свитере у камина, плед, кружка какао рядом, тёплое уютное освещение, акварельный стиль',
    promptEn: 'Cute corgi in a knitted sweater by fireplace, blanket, cocoa mug nearby, warm cozy lighting, watercolor style',
    gradient: 'linear-gradient(135deg,#fad0c4,#ffd1ff)' },

  // Fantasy
  { id: 'fa1', category: 'fantasy',
    prompt: 'Плавающий замок в облаках при закате, водопады стекают с его основания, радуги сквозь туман, драконы кружат вокруг башен, эпичный вид',
    promptEn: 'Floating castle in clouds at sunset, waterfalls from its base, rainbows through mist, dragons circling towers, epic view',
    gradient: 'linear-gradient(135deg,#ff6e7f,#bfe9ff)' },
  { id: 'fa2', category: 'fantasy',
    prompt: 'Лесной портал светящихся рун, магические искры, древние каменные колонны, туманная атмосфера, мистический синий свет',
    promptEn: 'Forest portal of glowing runes, magical sparks, ancient stone columns, foggy atmosphere, mystical blue light',
    gradient: 'linear-gradient(135deg,#30cfd0,#330867)' },

  // Cyberpunk
  { id: 'cy1', category: 'cyberpunk',
    prompt: 'Хакер за терминалом, голографические экраны вокруг, неоновая подсветка клавиатуры, дождь за окном, neon noir, ретрофутуризм',
    promptEn: 'Hacker at terminal, holographic screens around, neon keyboard backlight, rain outside, neon noir, retrofuturism',
    gradient: 'linear-gradient(135deg,#f093fb,#f5576c)' },
  { id: 'cy2', category: 'cyberpunk',
    prompt: 'Мегаполис 2099, летающие авто между небоскрёбами, гигантские голограммы рекламы, густой дождь, синхи и магенты, широкий кадр',
    promptEn: 'Megacity 2099, flying cars between skyscrapers, giant ad holograms, heavy rain, cyans and magentas, wide frame',
    gradient: 'linear-gradient(135deg,#4facfe,#00f2fe)' },

  // Anime
  { id: 'an1', category: 'anime',
    prompt: 'Аниме-девушка с длинными розовыми волосами на фоне цветущей сакуры, школьная форма, лёгкий ветер, Studio Ghibli стиль, мягкая прорисовка',
    promptEn: 'Anime girl with long pink hair against cherry blossoms, school uniform, light breeze, Studio Ghibli style, soft rendering',
    gradient: 'linear-gradient(135deg,#fbc2eb,#a6c1ee)' },
  { id: 'an2', category: 'anime',
    prompt: 'Аниме-воин с катаной на фоне полной луны, развевающийся плащ, вишнёвые лепестки в воздухе, динамичный ракурс, cel-shading',
    promptEn: 'Anime warrior with katana against full moon, flowing cape, cherry petals in air, dynamic angle, cel-shading',
    gradient: 'linear-gradient(135deg,#ffecd2,#fcb69f)' },

  // Product
  { id: 'pr1', category: 'product',
    prompt: 'Студийное фото кожаного кошелька на мраморной поверхности, мягкий верхний свет, минималистичная композиция, высокая детализация текстуры, коммерческая фотография',
    promptEn: 'Studio photo of leather wallet on marble surface, soft top light, minimalist composition, high texture detail, commercial photography',
    gradient: 'linear-gradient(135deg,#a8edea,#fed6e3)' },
  { id: 'pr2', category: 'product',
    prompt: 'Духи в стеклянном флаконе на чёрном фоне, капли воды на бутылке, драматическое освещение сбоку, глубокие тени, премиум-стиль',
    promptEn: 'Perfume in glass bottle on black background, water drops on bottle, dramatic side lighting, deep shadows, premium style',
    gradient: 'linear-gradient(135deg,#434343,#000000)' },

  // Abstract
  { id: 'ab1', category: 'abstract',
    prompt: 'Жидкая металлическая скульптура в движении, переливы фиолетового и бирюзового, отражения, 3D render, Cinema 4D стиль, абстрактная композиция',
    promptEn: 'Liquid metal sculpture in motion, purple and turquoise reflections, 3D render, Cinema 4D style, abstract composition',
    gradient: 'linear-gradient(135deg,#667eea,#764ba2)' },
  { id: 'ab2', category: 'abstract',
    prompt: 'Взрыв цветного порошка в замедленной съёмке, радужные частицы в воздухе, чёрный фон, высокая скорость затвора, энергичная динамика',
    promptEn: 'Colour powder explosion in slow motion, rainbow particles in air, black background, high shutter speed, energetic dynamic',
    gradient: 'linear-gradient(135deg,#f093fb,#f5576c)' },
]

const catIcon: Record<CategoryId | 'all', string> = {
  all:       'M4 6h16M4 12h16M4 18h16',
  portrait:  'M12 12c2.2 0 4-1.8 4-4s-1.8-4-4-4-4 1.8-4 4 1.8 4 4 4zm0 2c-3 0-8 1.5-8 4.5V20h16v-1.5c0-3-5-4.5-8-4.5z',
  landscape: 'M3 18l5-6 4 5 3-3 6 8H3zm3-9a2 2 0 100-4 2 2 0 000 4z',
  character: 'M12 2a5 5 0 015 5v1a5 5 0 01-10 0V7a5 5 0 015-5zm-7 20v-2a7 7 0 0114 0v2',
  food:      'M8 2v10m-4 0h16v2c0 4-3 8-8 8s-8-4-8-8v-2zm12 0V2',
  animal:    'M12 21a8 8 0 01-8-8c0-5 4-9 8-9s8 4 8 9a8 8 0 01-8 8zm-3-12a1 1 0 110-2 1 1 0 010 2zm6 0a1 1 0 110-2 1 1 0 010 2z',
  fantasy:   'M12 2l2 5 5 1-4 3 1 5-4-3-4 3 1-5-4-3 5-1z',
  cyberpunk: 'M8 4l-4 8 4 8M16 4l4 8-4 8M14 4l-4 16',
  anime:     'M12 3l3 7h7l-5.5 4 2 7-6.5-4.5-6.5 4.5 2-7L2 10h7z',
  product:   'M20 7H4l2-4h12zM4 7v13h16V7M10 11h4',
  abstract:  'M12 3l9 9-9 9-9-9z',
}

function IdeaCard({ idea, lang, onUse }: { idea: Idea; lang: string; onUse: () => void }) {
  const text = lang === 'en' ? idea.promptEn : idea.prompt
  return (
    <div className="card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        height: 120, background: idea.gradient, position: 'relative',
        display: 'flex', alignItems: 'flex-end', padding: 12,
      }}>
        <div style={{
          position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.3)',
          borderRadius: 6, padding: '3px 8px', fontSize: 10, color: '#fff', fontWeight: 500,
          textTransform: 'uppercase', letterSpacing: 0.5, backdropFilter: 'blur(4px)',
        }}>
          {categories.find(c => c.id === idea.category)?.[lang === 'en' ? 'labelEn' : 'labelRu']}
        </div>
      </div>
      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
        <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.45, flex: 1 }}>
          {text}
        </div>
        <button
          className="btn-outline"
          style={{ padding: '8px 0', fontSize: 13, borderRadius: 10 }}
          onClick={onUse}
        >
          {lang === 'en' ? 'Use this prompt' : 'Использовать промпт'}
        </button>
      </div>
    </div>
  )
}

export default function IdeasPage() {
  const navigate = useNavigate()
  const [activeCat, setActiveCat] = useState<CategoryId | 'all'>('all')
  const lang = getLang()

  const filtered = activeCat === 'all' ? ideas : ideas.filter(i => i.category === activeCat)

  const handleUse = (idea: Idea) => {
    navigate('/create', { state: { prompt: lang === 'en' ? idea.promptEn : idea.prompt, model: idea.model } })
  }

  return (
    <>
      <div className="topbar">
        <div className="topbar-title">{lang === 'en' ? 'Ideas' : 'Идеи для генерации'}</div>
      </div>

      {/* Category chips */}
      <div style={{
        display: 'flex', gap: 8, overflowX: 'auto', padding: '12px 16px 4px',
        scrollbarWidth: 'none',
      }}>
        {categories.map(c => {
          const active = c.id === activeCat
          return (
            <button
              key={c.id}
              onClick={() => setActiveCat(c.id)}
              style={{
                flexShrink: 0,
                padding: '7px 14px',
                borderRadius: 18,
                fontSize: 13,
                fontWeight: 500,
                background: active ? 'var(--accent)' : 'var(--surface2)',
                color: active ? '#fff' : 'var(--text2)',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s',
              }}
            >
              {lang === 'en' ? c.labelEn : c.labelRu}
            </button>
          )
        })}
      </div>

      {/* Subtitle / hint */}
      <div style={{ padding: '6px 16px 14px', fontSize: 12, color: 'var(--text3)' }}>
        {lang === 'en'
          ? 'Tap a card to use the prompt in the generator'
          : 'Нажмите на карточку, чтобы использовать промпт в генераторе'}
      </div>

      {/* Grid */}
      <div style={{
        padding: '0 16px 100px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: 12,
      }}>
        {filtered.map(idea => (
          <IdeaCard key={idea.id} idea={idea} lang={lang} onUse={() => handleUse(idea)} />
        ))}
      </div>
    </>
  )
}
