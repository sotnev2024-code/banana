#!/usr/bin/env node
/**
 * Retry the 3 ideas that hit OpenAI content policy in the main seed:
 *   1. Michelangelo + Nike  → swap to "ancient Greek marble statue + Adidas"
 *   8. B&W portrait + cigarette  → drop cigarette, replace with toothpick & cool gesture
 *  19. Spider-Man  → swap to "generic red-and-black masked vigilante"
 *
 * Idempotent — uses promptRu match to skip already-created.
 *
 * Usage:
 *   KIE_API_KEY=xxxx node scripts/seed-ideas-retry.js
 */

const path = require('path')
const fs = require('fs')
const { execSync } = require('child_process')
const crypto = require('crypto')

const KIE_BASE   = 'https://api.kie.ai/api/v1'
const API_KEY    = process.env.KIE_API_KEY
const PUBLIC_URL = process.env.PUBLIC_URL || 'https://picpulse.fun'
const UPLOAD_DIR = '/opt/banana/uploads/featured'
const REF_DIR    = process.env.REF_DIR || '/opt/banana/reference'
const MODEL      = 'gpt-image-2-image-to-image'

if (!API_KEY) { console.error('Missing KIE_API_KEY'); process.exit(1) }
execSync(`mkdir -p ${UPLOAD_DIR}`)

const { PrismaClient } = require(path.join(process.cwd(), 'node_modules/@prisma/client'))
const prisma = new PrismaClient()

const REF = (n) => `photo_${n}_2026-04-27_14-00-25.jpg`

const RETRY_IDEAS = [
  {
    catSlug: 'concept', refFile: REF(3),
    promptEn: `Wide angle photo of an ancient Greek marble statue (David-like, anonymous) wearing a red classic Adidas tracksuit and sneakers, looking down at a smartphone, prominent Adidas three-stripe logo. Renaissance painting style — Caravaggio chiaroscuro, surrounded by a studio bouquet of beautiful flowers. Palette: dark white, light yellow, soft orange and black, orange-blue gradient background. Conceptual sportswear, in the spirit of William Adolphe Bouguereau. Digitally enhanced, cinematic, wide angle, museum-quality.`,
    promptRu: `Широкоугольное фото древнегреческой мраморной статуи (типа Давида, анонимной) в красном классическом спортивном костюме и кроссовках Adidas, смотрит вниз на смартфон, заметные три полоски Adidas. Стиль ренессансной живописи — светотень Караваджо, окружена студийным букетом красивых цветов. Палитра: тёмно-белый, светло-жёлтый, мягкий оранжевый и чёрный, градиент оранжевый-синий фон. Концептуальная спортивная одежда в духе Уильяма-Адольфа Бугро. Digitally enhanced, cinematic, широкий угол, музейное качество.`,
    badge: 'NEW',
  },
  {
    catSlug: 'bw-portrait', refFile: REF(1),
    promptEn: `Cinematic ultra-realistic black & white portrait of the young man from the reference photo with sharp features, medium skin tone, stylish medium wavy black hair. Pose: head slightly tilted downward, chin lowered, eyes looking at camera, intense yet calm expression. Hand making a peace sign over the lower face. 24-28mm mild wide-angle, slightly above eye level, medium close-up. Outfit: red collared shirt (top buttons open) + silver chain necklace. Color: selective — only shirt in vibrant red, rest monochrome. Bold white outline (sticker effect). Background: detailed red & orange grunge collage (paint splashes, arrows, torn paper, cassette, X marks, abstract textures). Lighting: high contrast cinematic, soft shadows. Style: grunge street art, hip-hop aesthetic, 8K. Aspect 4:5.`,
    promptRu: `Кинематографичный ультрареалистичный ч/б портрет молодого мужчины с референса. Чёткие черты лица, средний тон кожи, стильные средние волнистые тёмные волосы. Голова слегка наклонена вниз, интенсивное но спокойное выражение. Рука делает жест мира над нижней частью лица. 24-28мм мягкий ширик. Красная рубашка с воротником (верхние пуговицы расстёгнуты) + серебряная цепочка. Селективный цвет — только рубашка ярко-красная, остальное монохром. Жирный белый контур. Фон: красно-оранжевый grunge-коллаж. Высокий контраст, hip-hop эстетика, 8K. Соотношение 4:5.`,
    badge: 'PRO',
  },
  {
    catSlug: 'cinematic', refFile: REF(3),
    promptEn: `An ultra close-up cinematic portrait under heavy nighttime rainfall. Tight close-up covering head and shoulders (85mm lens feel, f/1.8). Background dark with low-level noise and subtle raindrop highlights. Main light: soft ambient moonlight from above and slightly upper-left, illuminating the upper face. Subtle bounce light from the lower right. No streetlights or warm tones. The young man from the reference photo wearing a custom red and black geometric superhero-style mask and matching textured suit (original design, NOT any branded character) — the mask covers the upper part of his face but the lower jaw and chin remain visible and 100% identical to the reference. Hyper-realistic skin (micro pores, wetness). Hair wet with strands sticking to the forehead. Cinematic colors, vivid red on the costume. Preserve facial identity exactly.`,
    promptRu: `Ультра крупный план кинематографичного портрета под сильным ночным ливнем. Кадр плотный, голова и плечи (85мм, f/1.8). Фон тёмный, лёгкие капли в свете. Основной свет: мягкий лунный свет сверху и слева сверху. Тонкий отскок снизу-справа. Никаких уличных фонарей или тёплых тонов. Молодой мужчина с референса в кастомной красно-чёрной геометрической маске супергероя и подобранном текстурированном костюме (оригинальный дизайн, НЕ брендовый персонаж) — маска закрывает верхнюю часть лица, нижняя челюсть и подбородок видны и на 100% совпадают с референсом. Гиперреалистичная кожа (микропоры, влажность). Влажные волосы. Кинематографичные цвета, насыщенный красный на костюме. Сохранить идентичность лица.`,
    badge: 'NEW',
  },
]

const CATEGORIES = [
  { slug: 'streetwear',  nameRu: 'Стритвир',     nameEn: 'Streetwear',    position: 0 },
  { slug: 'editorial',   nameRu: 'Editorial',    nameEn: 'Editorial',     position: 1 },
  { slug: 'cinematic',   nameRu: 'Кинематика',   nameEn: 'Cinematic',     position: 2 },
  { slug: 'surreal',     nameRu: 'Сюрреализм',   nameEn: 'Surreal',       position: 3 },
  { slug: 'bw-portrait', nameRu: 'Ч/Б портрет',  nameEn: 'B&W Portrait',  position: 4 },
  { slug: 'concept',     nameRu: 'Концепт-арт',  nameEn: 'Concept Art',   position: 5 },
  { slug: 'music',       nameRu: 'Музыка',       nameEn: 'Music',         position: 6 },
  { slug: 'adventure',   nameRu: 'Приключения',  nameEn: 'Adventure',     position: 7 },
]

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function publishReference(refFile) {
  const src = path.join(REF_DIR, refFile)
  if (!fs.existsSync(src)) throw new Error(`Reference not found: ${src}`)
  const ext = path.extname(refFile)
  const stableName = `idea_ref_${path.basename(refFile, ext)}${ext}`
  const dst = path.join(UPLOAD_DIR, stableName)
  if (!fs.existsSync(dst)) fs.copyFileSync(src, dst)
  return `${PUBLIC_URL}/uploads/featured/${stableName}`
}

async function kiePost(p, body) {
  const res = await fetch(`${KIE_BASE}${p}`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const text = await res.text()
  let json; try { json = JSON.parse(text) } catch { throw new Error(`KIE non-JSON: ${text.slice(0,200)}`) }
  if (json.code !== 200) throw new Error(`KIE ${p} → code=${json.code} msg=${json.msg}`)
  return json
}

async function kieGet(p) {
  const res = await fetch(`${KIE_BASE}${p}`, { headers: { 'Authorization': `Bearer ${API_KEY}` } })
  const text = await res.text()
  let json; try { json = JSON.parse(text) } catch { throw new Error(`KIE non-JSON: ${text.slice(0,200)}`) }
  return json
}

async function generate(prompt, refUrl) {
  const r = await kiePost('/jobs/createTask', {
    model: MODEL,
    input: { prompt, input_urls: [refUrl], aspect_ratio: '4:5', resolution: '1K', nsfw_checker: true },
  })
  return r.data.taskId
}

async function pollDone(taskId, timeoutMs = 8 * 60 * 1000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    await sleep(5000)
    const r = await kieGet(`/jobs/recordInfo?taskId=${taskId}`)
    if (r.code !== 200) continue
    const data = r.data
    const state = String(data?.state ?? data?.status ?? '').toLowerCase()
    if (state === 'success' || state === 'done') {
      let resultUrl
      if (typeof data.resultJson === 'string') {
        try { const parsed = JSON.parse(data.resultJson)
          if (Array.isArray(parsed.resultUrls) && parsed.resultUrls.length) resultUrl = parsed.resultUrls[0]
        } catch {}
      }
      if (!resultUrl && Array.isArray(data?.response?.resultUrls)) resultUrl = data.response.resultUrls[0]
      if (resultUrl) return resultUrl
    }
    if (state === 'fail' || state === 'failed' || state === 'error') {
      throw new Error(`KIE task ${taskId} failed: ${data?.failMsg || 'unknown'}`)
    }
  }
  throw new Error(`KIE task ${taskId} timeout`)
}

function downloadAndCompress(srcUrl, ideaId) {
  const tmpRaw = path.join(UPLOAD_DIR, `_tmp_${ideaId}.bin`)
  const finalName = `idea_${ideaId}.webp`
  const finalPath = path.join(UPLOAD_DIR, finalName)
  execSync(`curl -s -L -o ${tmpRaw} "${srcUrl}"`, { timeout: 60000 })
  execSync(`cwebp -q 80 -resize 1024 0 ${tmpRaw} -o ${finalPath} 2>/dev/null`, { timeout: 30000 })
  try { fs.unlinkSync(tmpRaw) } catch {}
  return `${PUBLIC_URL}/uploads/featured/${finalName}`
}

async function main() {
  // Make sure categories exist (idempotent)
  const catBySlug = {}
  for (const c of CATEGORIES) {
    const row = await prisma.ideaCategory.upsert({
      where: { slug: c.slug }, create: c,
      update: { nameRu: c.nameRu, nameEn: c.nameEn, position: c.position },
    })
    catBySlug[c.slug] = row
  }

  for (let i = 0; i < RETRY_IDEAS.length; i++) {
    const idea = RETRY_IDEAS[i]
    const tag = `[${i+1}/${RETRY_IDEAS.length}]`

    const existing = await prisma.idea.findFirst({ where: { promptRu: idea.promptRu } })
    if (existing) { console.log(`${tag} ⏭  already exists, skip`); continue }

    try {
      console.log(`${tag} 📤 reference ${idea.refFile}…`)
      const refUrl = await publishReference(idea.refFile)

      console.log(`${tag} 🧠 generating…`)
      const taskId = await generate(idea.promptEn, refUrl)
      const resultUrl = await pollDone(taskId)
      console.log(`${tag} ✅ ${resultUrl}`)

      const ideaId = crypto.randomBytes(6).toString('hex')
      const localUrl = downloadAndCompress(resultUrl, ideaId)
      console.log(`${tag} 💾 ${localUrl}`)

      const cat = catBySlug[idea.catSlug]
      const created = await prisma.idea.create({
        data: {
          categoryId: cat.id,
          modelId: 'gpt-image-2-edit',
          promptRu: idea.promptRu,
          promptEn: idea.promptEn,
          mediaUrl: localUrl,
          mediaType: 'image',
          badge: idea.badge,
          enabled: true,
        },
      })
      console.log(`${tag} 💡 idea created (id=${created.id})`)
    } catch (e) {
      console.error(`${tag} ❌ ${e.message}`)
    }
  }

  await prisma.$disconnect()
  console.log('🎉 Retry done')
}

main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1) })
