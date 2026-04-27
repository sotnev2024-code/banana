#!/usr/bin/env node
// Final retry for the rainy-night portrait — completely reframed
// without any superhero/costume cues that trigger OpenAI's filters.

const path = require('path')
const fs = require('fs')
const { execSync } = require('child_process')
const crypto = require('crypto')

const KIE_BASE = 'https://api.kie.ai/api/v1'
const API_KEY = process.env.KIE_API_KEY
const PUBLIC_URL = process.env.PUBLIC_URL || 'https://picpulse.fun'
const UPLOAD_DIR = '/opt/banana/uploads/featured'
const REF_DIR = process.env.REF_DIR || '/opt/banana/reference'
const MODEL = 'gpt-image-2-image-to-image'

if (!API_KEY) { console.error('Missing KIE_API_KEY'); process.exit(1) }
execSync(`mkdir -p ${UPLOAD_DIR}`)

const { PrismaClient } = require(path.join(process.cwd(), 'node_modules/@prisma/client'))
const prisma = new PrismaClient()

const IDEA = {
  catSlug: 'cinematic',
  refFile: 'photo_3_2026-04-27_14-00-25.jpg',
  promptEn: `An ultra close-up cinematic portrait of the young man from the reference photo standing under heavy nighttime rain. Tight close-up covering head and shoulders, 85mm lens feel, f/1.8, natural portrait compression. Background completely dark with low-level noise and tiny raindrop highlights catching light. Main light: soft ambient moonlight from above and slightly upper-left, illuminating the upper half of the face. Subtle bounce light from lower right prevents the lower face from fading. No streetlights, no warm tones — purely cool moonlit aesthetic. He wears a plain dark hoodie pulled up over the head, the hood casting a soft shadow over the brow. Hyper-realistic skin: visible micro-pores, beads of water, subtle wetness. Hair wet with a few strands sticking to the forehead. Calm, intense gaze directly into camera. Shallow depth of field, cinematic editorial photography, 8K. Preserve facial identity exactly from the reference.`,
  promptRu: `Ультра крупный план кинематографичного портрета молодого мужчины с референса под сильным ночным дождём. Кадр плотный, голова и плечи, 85мм, f/1.8, естественная портретная компрессия. Фон полностью тёмный, лёгкие капли в свете. Основной свет: мягкий лунный свет сверху и слева сверху, освещает верхнюю часть лица. Тонкий отскок снизу-справа. Никаких уличных фонарей, никаких тёплых тонов — холодная лунная эстетика. На нём простой тёмный худи с накинутым капюшоном, мягкая тень от капюшона на бровях. Гиперреалистичная кожа: микропоры, капли воды. Влажные волосы. Спокойный, пристальный взгляд прямо в камеру. Малая глубина резкости, кинематографичная editorial-фотография, 8K. Сохранить идентичность лица с референса.`,
  badge: 'NEW',
}

const CATS = { cinematic: 'Кинематика' }

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function main() {
  const cat = await prisma.ideaCategory.findUnique({ where: { slug: IDEA.catSlug } })
  if (!cat) { console.error('Category cinematic missing'); process.exit(1) }

  const exists = await prisma.idea.findFirst({ where: { promptRu: IDEA.promptRu } })
  if (exists) { console.log('⏭ already exists'); await prisma.$disconnect(); return }

  const refSrc = path.join(REF_DIR, IDEA.refFile)
  const refDst = path.join(UPLOAD_DIR, `idea_ref_${path.basename(IDEA.refFile, '.jpg')}.jpg`)
  if (!fs.existsSync(refDst)) fs.copyFileSync(refSrc, refDst)
  const refUrl = `${PUBLIC_URL}/uploads/featured/${path.basename(refDst)}`

  console.log('🧠 generating…')
  const createRes = await fetch(`${KIE_BASE}/jobs/createTask`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      input: { prompt: IDEA.promptEn, input_urls: [refUrl], aspect_ratio: '4:5', resolution: '1K', nsfw_checker: true },
    }),
  }).then(r => r.json())
  if (createRes.code !== 200) { console.error('create failed:', createRes); process.exit(1) }
  const taskId = createRes.data.taskId
  console.log('   taskId=', taskId)

  let resultUrl
  for (let i = 0; i < 100; i++) {
    await sleep(5000)
    const r = await fetch(`${KIE_BASE}/jobs/recordInfo?taskId=${taskId}`, {
      headers: { 'Authorization': `Bearer ${API_KEY}` },
    }).then(x => x.json())
    if (r.code !== 200) continue
    const state = String(r.data?.state ?? '').toLowerCase()
    if (state === 'success' || state === 'done') {
      const parsed = typeof r.data.resultJson === 'string' ? JSON.parse(r.data.resultJson) : r.data.response || {}
      resultUrl = parsed.resultUrls?.[0]
      break
    }
    if (state === 'fail' || state === 'failed' || state === 'error') {
      console.error('❌', r.data?.failMsg || 'failed')
      process.exit(1)
    }
  }
  if (!resultUrl) { console.error('timeout'); process.exit(1) }
  console.log('✅', resultUrl)

  const ideaId = crypto.randomBytes(6).toString('hex')
  const tmp = path.join(UPLOAD_DIR, `_tmp_${ideaId}.bin`)
  const finalName = `idea_${ideaId}.webp`
  const finalPath = path.join(UPLOAD_DIR, finalName)
  execSync(`curl -s -L -o ${tmp} "${resultUrl}"`, { timeout: 60000 })
  execSync(`cwebp -q 80 -resize 1024 0 ${tmp} -o ${finalPath} 2>/dev/null`, { timeout: 30000 })
  try { fs.unlinkSync(tmp) } catch {}
  const localUrl = `${PUBLIC_URL}/uploads/featured/${finalName}`
  console.log('💾', localUrl)

  const created = await prisma.idea.create({
    data: {
      categoryId: cat.id,
      modelId: 'gpt-image-2-edit',
      promptRu: IDEA.promptRu,
      promptEn: IDEA.promptEn,
      mediaUrl: localUrl,
      mediaType: 'image',
      badge: IDEA.badge,
      enabled: true,
    },
  })
  console.log('💡 created id=', created.id)
  await prisma.$disconnect()
}

main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1) })
