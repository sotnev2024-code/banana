#!/usr/bin/env node
/**
 * seed-ideas.js
 *
 * For each of the 20 prompts (defined below), uploads the matching reference
 * image to KIE.ai, generates an image via gpt-image-2-image-to-image, downloads
 * the result, compresses to WebP, stores under /opt/banana/uploads/featured/,
 * and creates an Idea row in the DB.
 *
 * Usage on server:
 *   cd /opt/banana/aibot/aibot
 *   KIE_API_KEY=xxxxxxx node scripts/seed-ideas.js
 *
 * Idempotency: if the script is re-run, idea rows whose modelId+promptRu pair
 * already exists are skipped. Categories are upsert by slug.
 *
 * Reference files are read from /opt/banana/reference/<file>. The script will
 * auto-upload them to /opt/banana/uploads/featured/ first so KIE has a public
 * URL to fetch.
 */

const path = require('path')
const fs = require('fs')
const { execSync } = require('child_process')
const crypto = require('crypto')

// ─── Config ────────────────────────────────────────────────────────────

const KIE_BASE   = 'https://api.kie.ai/api/v1'
const API_KEY    = process.env.KIE_API_KEY
const PUBLIC_URL = process.env.PUBLIC_URL || 'https://picpulse.fun'
const UPLOAD_DIR = '/opt/banana/uploads/featured'
const REF_DIR    = process.env.REF_DIR || '/opt/banana/reference'
const MODEL      = 'gpt-image-2-image-to-image'

if (!API_KEY) {
  console.error('Missing KIE_API_KEY env var')
  process.exit(1)
}

// Ensure upload dir exists
execSync(`mkdir -p ${UPLOAD_DIR}`)

// Lazy load Prisma client from the api app (already installed there)
const { PrismaClient } = require(path.join(process.cwd(), 'node_modules/@prisma/client'))
const prisma = new PrismaClient()

// ─── Categories ────────────────────────────────────────────────────────

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

// ─── Ideas (20) ────────────────────────────────────────────────────────

const REF = (n) => `photo_${n}_2026-04-27_14-00-25.jpg`

const IDEAS = [
  {
    catSlug: 'concept', refFile: REF(3),
    promptEn: `Wide angle photo of Michelangelo's Moses marble statue wearing a red classic Nike Tracksuit and Sneakers looking at a mobile phone, prominent NIKE logo, in the style of Michael Cheval and Leonardo Da Vinci, Caravaggio, surrounded by a studio of beautiful flowers, dark white, light yellow, soft orange and black, orange and blue gradient background, conceptual tracksuit, William Adolphe Bouguereau, digitally enhanced, cinematic, wide angle.`,
    promptRu: `Широкоугольное фото мраморной статуи Моисея Микеланджело в красном классическом спортивном костюме и кроссовках Nike, статуя смотрит в мобильный телефон, заметный логотип NIKE. Стиль Майкла Чеваля и Леонардо да Винчи, Караваджо. Окружена студией с прекрасными цветами. Палитра: тёмно-белый, светло-жёлтый, мягкий оранжевый и чёрный, градиент оранжевый-синий. Концептуальный костюм, в духе Уильяма-Адольфа Бугро. Digitally enhanced, cinematic, широкий угол.`,
    badge: 'NEW',
  },
  {
    catSlug: 'adventure', refFile: REF(6),
    promptEn: `From above, fisheye lens, strong motion blur, camera shake, iridescent chromatic aberration, light leaks, hard flash, the same young man from the reference photo wearing a green The North Face rain jacket and a hoodie, in a rainy forest, rain scattered around his body, purple lighting from the left and pink lighting on the right, in the style of a marketing campaign, adventure aesthetics. Preserve facial identity exactly.`,
    promptRu: `Сверху, объектив рыбий глаз, сильный motion blur, тряска камеры, переливающаяся хроматическая аберрация, световые блики, жёсткая вспышка. Тот же парень с референсного фото в зелёной дождевой куртке The North Face и худи, в дождевом лесу, капли дождя вокруг тела. Фиолетовый свет слева, розовый свет справа. Стиль маркетинговой кампании, эстетика приключений. Сохранить лицо в точности.`,
    badge: null,
  },
  {
    catSlug: 'editorial', refFile: REF(5),
    promptEn: `Low-angle full-body fashion editorial shot, futuristic sportswear campaign aesthetic, the confident male model from the reference photo standing on wind-shaped desert dunes, wearing a long oversized technical puffer coat, layered utility clothing, cargo-style pants, high-performance sneakers, strong heroic posture with one leg forward, chin slightly raised, looking down toward the camera with a dominant and calm expression, monochromatic green styling, vast desert landscape, dramatic oversized hand-painted brushstroke graphic behind the subject, warm directional sunlight with sharp shadows, high contrast, green monochrome palette with tonal variation from deep emerald to neon lime, slight wind movement in coat, shot with Arri Alexa Mini LF, 35mm lens, cinematic depth, ultra-detailed, 8K. Preserve face identity from reference.`,
    promptRu: `Полнокадровый ракурс снизу, fashion-editorial, эстетика футуристической спортивки. Уверенный мужчина-модель с референсного фото стоит на ветреных дюнах пустыни, в длинном оверсайз техническом пуховике, многослойном утилитарном комплекте, штанах в стиле карго, перформативных кроссовках. Героическая стойка с выставленной вперёд ногой, подбородок слегка поднят, смотрит в камеру властно и спокойно. Монохромный зелёный стайлинг от одежды до обуви. Огромный пейзаж пустыни. Драматичный нарисованный мазок за моделью. Тёплый направленный свет с резкими тенями, высокий контраст. Снято на Arri Alexa Mini LF, 35мм, ultra-detailed, 8K. Сохранить лицо с референса.`,
    badge: 'HOT',
  },
  {
    catSlug: 'concept', refFile: REF(3),
    promptEn: `A magazine ad for Adidas featuring an elderly woman with tattoos wearing the classic three stripes. She is wearing a gold and red Adidas sweatshirt and hat that says "to me always". She has one hand up in front of her face, making gang signs like in a typical bank album photo of elderly people doing gang sign hand gestures. The background color is brown. At the top there is text reading "always original".`,
    promptRu: `Журнальная реклама Adidas с пожилой женщиной в татуировках, одетой в классические три полоски. На ней золотисто-красный свитшот Adidas и кепка с надписью "to me always". Одна рука у лица, изображая бандитский жест в стиле фото пожилых рэп-альбомов. Фон коричневый. Сверху текст "always original".`,
    badge: null,
  },
  {
    catSlug: 'streetwear', refFile: REF(5),
    promptEn: `High-impact streetwear fashion poster, mixed-media editorial campaign, central portrait of the fashion subject from the reference photo in bold urban styling, oversized jacket, layered accessories, strong direct attitude, dramatic studio-meets-street lighting, dark textured background, graphic composition mixing fashion photography with graffiti tags, paint strokes, spray mist, chips, collage fragments, brutal typography blocks, poster tears, print texture, street luxury energy, deliberate chaos with strong visual hierarchy, black background with bold orange, acid green, white or violet accents, premium campaign design, sharp face rendering, detailed fabric gloss and texture, photographed with a 35mm lens, poster-ready framing, ultra-detailed, editorial realism. Preserve face identity exactly.`,
    promptRu: `Постер streetwear с эффектным визуалом, mixed-media editorial кампания. Центральный портрет субъекта с референсного фото в дерзкой городской стилистике: оверсайз куртка, многослойные аксессуары, прямой напор. Драматичный свет, который смешивает студию с улицей. Тёмный текстурный фон. Композиция как коллаж: фэшн-съёмка + граффити-теги, мазки краски, спрей, чипсы, обрывки, брутальные типографические блоки, разрывы постеров. Энергия street luxury. Чёрный фон с акцентами оранжевого, кислотно-зелёного, белого или фиолетового. 35мм объектив, ultra-detailed. Сохранить лицо.`,
    badge: 'TOP',
  },
  {
    catSlug: 'editorial', refFile: REF(2),
    promptEn: `Low-angle full-body fashion editorial shot, futuristic sportswear campaign aesthetic, confident male model from the reference photo standing on wind-shaped desert dunes, wearing a long oversized technical puffer coat, layered utility clothing, cargo-style pants, high-performance sneakers, strong heroic posture with one leg forward, monochromatic green styling, vast desert landscape, dramatic oversized hand-painted brushstroke graphic behind the subject, warm directional sunlight, sharp shadows, high contrast, green monochrome palette with tonal variation from deep emerald to neon lime, shot on Arri Alexa Mini LF, 35mm, cinematic depth, ultra-detailed, 8K. Preserve face identity.`,
    promptRu: `Ракурс снизу, в полный рост, fashion editorial кампания, эстетика футуристической спортивки. Уверенная мужская модель с референса стоит на ветреных дюнах пустыни. Длинный оверсайз технический пуховик, многослойная утилитарная одежда, карго-штаны, перформативные кроссовки. Героическая стойка, нога вперёд. Монохромный зелёный стайлинг. Дюны до горизонта. Огромный мазок за моделью. Тёплый направленный свет, резкие тени, высокий контраст. Снято на Arri Alexa Mini LF, 35мм, 8K. Сохранить лицо.`,
    badge: null,
  },
  {
    catSlug: 'streetwear', refFile: REF(3),
    promptEn: `High-impact streetwear fashion poster, mixed-media editorial campaign, central portrait of the subject from the reference photo, bold urban styling, oversized jacket, layered accessories, strong direct attitude, dramatic studio-meets-street lighting, dark textured background, graphic composition mixing fashion photography with graffiti tags, paint strokes, spray mist, brutal typography blocks, poster tears, street luxury energy, black background with bold orange, acid green, white or violet accents, premium campaign design, sharp face rendering, 35mm lens, ultra-detailed, editorial realism. Preserve face identity exactly.`,
    promptRu: `Эффектный постер streetwear, mixed-media editorial. Центральный портрет субъекта с референса в дерзкой городской стилистике, оверсайз куртка, многослойные аксессуары, прямой напор. Драматичный свет: студия + улица. Тёмный текстурный фон. Композиция-коллаж: фэшн + граффити, мазки, спрей, обрывки, брутальная типографика. Энергия street luxury. Чёрный фон, акценты оранжевого, кислотно-зелёного, белого, фиолетового. 35мм, ultra-detailed. Сохранить лицо.`,
    badge: null,
  },
  {
    catSlug: 'bw-portrait', refFile: REF(1),
    promptEn: `Cinematic ultra-realistic black & white portrait of the young man from the reference photo with sharp features, medium skin tone, stylish medium wavy black hair. Pose: head slightly tilted downward, chin lowered, eyes looking camera, relaxed yet intense expression. 24-28mm mild wide-angle, slightly above eye level, medium close-up. Outfit: red collared shirt (top buttons open) + silver chain necklace. Cigarette in lips with subtle smoke. Color: selective — only shirt in vibrant red, rest monochrome. Bold white outline (sticker effect). Background: detailed red & orange grunge collage (paint splashes, arrows, spider, torn paper, cassette, X marks, abstract textures). Lighting: high contrast cinematic, soft shadows. Style: grunge street art, hip-hop aesthetic, 8K. Aspect 4:5.`,
    promptRu: `Кинематографичный ультрареалистичный ч/б портрет молодого мужчины с референса. Чёткие черты лица, средний тон кожи, стильные средние волнистые тёмные волосы. Голова слегка наклонена вниз, расслабленное но интенсивное выражение. 24-28мм мягкий ширик. Красная рубашка с воротником (верхние пуговицы расстёгнуты) + серебряная цепочка. Сигарета в губах. Селективный цвет — только рубашка ярко-красная, остальное монохром. Жирный белый контур. Фон: красно-оранжевый grunge-коллаж. Высокий контраст, hip-hop эстетика, 8K. Соотношение 4:5.`,
    badge: 'PRO',
  },
  {
    catSlug: 'concept', refFile: REF(3),
    promptEn: `Create a cinematic age progression composite portrait of the same male individual shown across 5 stages of life: young child (age 6), teenager (age 15), young adult (age 25), middle-aged man (age 45), and elderly man (age 70+). All five faces must look like the same person aging naturally over time, maintaining consistent facial features, bone structure, and eye color. Arrange the five faces side by side in diagonal split panels from left to right, going from youngest to oldest. Each face cropped as a close-up portrait. Lighting: dramatic and cinematic with dark moody background, soft spotlight from above, dark charcoal and black tones. All subjects wearing dark/black clothing. Photo-realistic, ultra high detail, sharp focus, professional studio. Use this person's face as the reference for the youngest stage and age progression. Aspect 4:5.`,
    promptRu: `Кинематографичный композитный портрет возрастной прогрессии: один и тот же мужчина в 5 этапах жизни — ребёнок (6), подросток (15), молодой взрослый (25), средних лет (45), пожилой (70+). Все пять лиц — один человек, естественно стареющий, единые черты, костная структура, цвет глаз. Расположение: пять лиц в диагональных панелях слева направо, от младшего к старшему. Свет: драматичный, тёмный moody фон, мягкий софит сверху. Все в тёмной одежде. Фотореалистично, ультра-детально. Соотношение 4:5.`,
    badge: null,
  },
  {
    catSlug: 'music', refFile: REF(3),
    promptEn: `Predominantly monochromatic palette (black, gray, and white) with subtle neon pink accents for premium visual contrast. Subject: the man from the reference photo wearing premium headphones. Soft, directional lighting with a sharp rim light on the face and metallic highlights on the headphones. Extremely realistic skin texture: visible pores, micro-imperfections, a slight natural glow. Elegant composition with a futuristic music editorial poster or album cover aesthetic. Atmosphere: futuristic, artistic, technological. Aspect ratio 4:5. Pure extreme photographic realism. Preserve face identity.`,
    promptRu: `Преимущественно монохромная палитра (чёрный, серый, белый) с тонкими неон-розовыми акцентами для premium-контраста. Субъект: парень с референса в премиальных наушниках. Мягкий направленный свет с резким контровиком на лице и металлическими бликами на наушниках. Экстремально реалистичная текстура кожи. Элегантная композиция в стиле постера футуристического музыкального издания. Атмосфера: футуристическая, художественная, технологическая. 4:5. Сохранить лицо.`,
    badge: null,
  },
  {
    catSlug: 'surreal', refFile: REF(5),
    promptEn: `A surreal urban scene where the subject from the reference photo appears gigantic, leaning forward with hands framing the face, gazing curiously over a modern city intersection below. Extreme scale contrast with tiny cars, pedestrians, and a passing train, rendered in bright daytime light with hyper-real, believable perspective and a dreamy, editorial feel.`,
    promptRu: `Сюрреалистичная городская сцена: субъект с референса огромного размера, наклонился вперёд, обрамляя лицо ладонями, с любопытством смотрит на современный городской перекрёсток внизу. Экстремальный контраст масштабов с крошечными машинами, пешеходами, поездом. Яркий дневной свет, гиперреалистичная перспектива, мечтательный editorial feel.`,
    badge: 'VIRAL',
  },
  {
    catSlug: 'editorial', refFile: REF(3),
    promptEn: `Use the uploaded photo as the reflected subject. An extreme close-up macro of sunglasses filling the frame, with realistic curvature and distortion, showing the subject's phone selfie outside naturally warped in the lens reflection. Bright outdoor sunlight, detailed skin texture and highlights, with a vintage film / early-digital look, slight grain, and candid summer editorial realism.`,
    promptRu: `Используй загруженное фото как отражённый субъект. Экстремально крупное макро солнечных очков на весь кадр, с реалистичной кривизной и искажениями, показывающее селфи на телефон субъекта снаружи, естественно искажённое в отражении. Яркий солнечный свет, детализированная кожа и блики, винтажная плёнка / ранний цифровой вид, лёгкое зерно.`,
    badge: null,
  },
  {
    catSlug: 'cinematic', refFile: REF(4),
    promptEn: `Create an ultra-realistic, cinematic image with a dramatic editorial tone. On a narrow forest road, the man from the reference sits on top of a stylish silver sports car that is completely surrounded by a dense herd of cows. The man wears a worn black NIKE T-shirt with a slightly faded logo, black sweatpants with white side stripes, and white & black Nike basketball shoes. The car's chrome and bodywork reflect the matte paint texture of the cows realistically. The environment is a narrow asphalt road, surrounded by deep forest, slight mist, heavy fog. Lighting is soft and slightly diffused daylight, light coming from above-left highlights the metal & his face. Aesthetic: cinematic realism, editorial photography, surreal rural context, fusion of luxury and chaos.`,
    promptRu: `Ультрареалистичный кинематографичный кадр. На узкой лесной дороге парень с референса сидит на капоте серебристого спорткара, окружённого густым стадом коров. Поношенная чёрная футболка NIKE, чёрные спортивные штаны с белыми лампасами, баскетбольные кроссовки Nike. Хром и кузов отражают матовую текстуру кож. Глубокий лес, лёгкий туман. Мягкий рассеянный свет с верхне-левого подсвечивает металл и лицо. Эстетика: кинематографичный реализм, editorial.`,
    badge: 'HOT',
  },
  {
    catSlug: 'cinematic', refFile: REF(3),
    promptEn: `Create an ultra-realistic, cinematic, and minimal studio scene. The subject from the reference photo is illuminated with a completely dark background and a soft circular spotlight on the floor. He is kneeling on the floor, retains a dignified and strong posture, shoulders upright, back kept as straight as possible, torso slightly leaning forward. His head is tilted downward. The face is 100% identical to the uploaded reference photo (same structure, eyes, nose, lips, skin texture). A dragon tattoo crosses the front of the chest down to one shoulder. He is shirtless, holding a long sword across his shoulders. Aesthetic: cinematic realism, dramatic minimalism, dark atmosphere, strong character posture.`,
    promptRu: `Ультрареалистичная кинематографичная минималистичная студия. Субъект с референса в полностью тёмном фоне, мягкий круглый софит на полу. Стоит на коленях, сохраняет достойную сильную осанку, плечи прямые, корпус слегка вперёд. Голова наклонена вниз. Лицо на 100% идентично референсу. Через грудь до плеча — татуировка дракона. Без рубашки, держит длинный меч на плечах. Эстетика: кинематографичный реализм, драматичный минимализм, тёмная атмосфера.`,
    badge: null,
  },
  {
    catSlug: 'cinematic', refFile: REF(3),
    promptEn: `Create an ultra-realistic, cinematic image. Night scene: two men are seen from above looking down into a car through the sunroof. The driver looks directly up at the camera, while a second man in the back seat wearing a black ski mask (balaclava) also looks upward. The driver's face must be 100% identical to the uploaded reference photo (same structure, eyes, nose, lips, skin texture). The masked man's face must remain completely hidden. The framing is tight and vertical, with the sunroof frame forming a natural border. Lighting follows a night + direct flash aesthetic; a strong frontal flash sharply illuminates both characters, while a blue/teal ambient light remains in the interior. Color grading is teal/cyan dominant with slight magenta accents. 35mm equivalent f/2.8, 8K.`,
    promptRu: `Ультрареалистичный кинематографичный кадр. Ночная сцена: двое мужчин видны сверху через люк автомобиля. Водитель смотрит прямо в камеру, второй на заднем сидении в чёрной балаклаве тоже смотрит вверх. Лицо водителя на 100% совпадает с референсом. Лицо в маске полностью скрыто. Кадр плотный, вертикальный, рамка люка — естественная граница. Свет: ночной + прямая вспышка, сильная фронтальная вспышка, в салоне сине-бирюзовый ambient. Цветокор: бирюзово-синий доминант с лёгкими magenta-акцентами. 35мм f/2.8, 8K.`,
    badge: null,
  },
  {
    catSlug: 'streetwear', refFile: REF(5),
    promptEn: `Create an ultra-realistic, cinematic image with a young man (the subject from the reference photo) leaning his shoulder against the metal pole of a STOP sign at the beach. The white STOP sign is partially visible behind and above the man's head against the bright sky. The word "ART" is spray-painted in black over the STOP text. The face must be 100% identical to the reference photo. Camera at eye level, fairly close. Pose: relaxed, slightly rebellious, shoulder against pole, head slightly raised, cool distant gaze. Clothing: oversized black hoodie with white mesh layered, layered chain necklace, several rings on fingers. Lighting: night scene with direct flash aesthetic, hard light highlights skin texture. Color grading: dark navy night, neon-pop urban energy.`,
    promptRu: `Ультрареалистичный кинематографичный кадр. Молодой мужчина (субъект с референса) прислонился плечом к столбу знака STOP у моря. Белый знак виден за головой на фоне яркого неба. Поверх "STOP" чёрным спреем нарисовано "ART". Лицо на 100% совпадает с референсом. Камера на уровне глаз. Поза расслабленная, бунтарская. Оверсайз чёрный худи с белой сеткой, многослойная цепь, кольца. Свет: ночь + прямая вспышка. Цветокор: тёмно-синяя ночь, неон-поп.`,
    badge: null,
  },
  {
    catSlug: 'bw-portrait', refFile: REF(1),
    promptEn: `A RAW black-and-white street portrait generated from the input photo. VIBE: harsh noir, artistic rebellion, punk-chic style. ENVIRONMENT: plain, light-toned background. COMPOSITION: tight close-up shot. The person's hand makes a bold gesture over the eye using two fingers. LIGHTING: high-contrast black-and-white with dramatic shadows emphasizing intense eye contact. STYLE: black crew-neck T-shirt. Heavy silver rings (weapon-themed), silver bracelet, and a thick pearl necklace with silver details. EXPRESSION: harsh, piercing gaze with a defiant attitude. TECHNICAL: 35mm film aesthetic, heavy Kodak Tri-X grain, high contrast, sharp textures. Preserve face identity exactly.`,
    promptRu: `RAW чёрно-белый уличный портрет, сгенерированный из входного фото. ВАЙБ: жёсткий нуар, художественный бунт, панк-шик. СРЕДА: простой светлый фон. КОМПОЗИЦИЯ: плотный крупный план. Рука делает дерзкий жест над глазом двумя пальцами. СВЕТ: высококонтрастный ч/б с драматичными тенями. СТИЛЬ: чёрный crew-neck. Массивные серебряные кольца, серебряный браслет и толстая жемчужная цепь с серебряными деталями. ВЫРАЖЕНИЕ: жёсткий, пронзительный взгляд. ТЕХНИКА: 35мм плёнка, Kodak Tri-X. Сохранить лицо.`,
    badge: 'PRO',
  },
  {
    catSlug: 'editorial', refFile: REF(2),
    promptEn: `Avant-garde, cinematic editorial photograph. The subject is sitting inside a black car in the driver's seat, in a low position with the front door open. One hand confidently rests on the steering wheel, body slightly leaning forward, head tilted downward, calm introspective mood. The subject is wearing a dark-toned, oversized, multi-layered, textured outfit with wide-cut classic trousers and shiny leather boots. Dark sunglasses hide his eyes. The scene takes place in an open landscape covered with tall, wild grass extending toward an overexposed sky, creating a large negative space. The lighting is high-contrast yet controlled, with soft transitions and subtle highlights. The image has a matte cinematic finish with slight film grain, low color saturation, and the depth and sharpness typical of medium-format photography. The man must never have tattoos. Aesthetic: timeless, minimalist, fashion-focused, cinematic. 4K.`,
    promptRu: `Авангардная кинематографичная editorial-фотография. Субъект сидит в чёрной машине на водительском сиденье в низкой позе с открытой дверью. Одна рука уверенно на руле, тело чуть наклонено вперёд. Голова опущена. Тёмный оверсайз многослойный текстурированный комплект, широкие классические брюки и блестящие кожаные ботинки. Тёмные очки. Открытый пейзаж с высокой дикой травой, пересвеченное небо. Высококонтрастный, но контролируемый свет. Матовый кинематографичный финиш, лёгкое плёночное зерно. Без татуировок. Эстетика: вневременная, минималистичная. 4K.`,
    badge: null,
  },
  {
    catSlug: 'cinematic', refFile: REF(3),
    promptEn: `An ultra close-up cinematic portrait under heavy nighttime rainfall. The framing is a tight close-up covering the head and shoulders (85mm lens feel, f/1.8). Background is dark with low-level noise and subtle raindrop highlights. Main light: soft ambient moonlight from above and slightly upper-left, illuminating the upper face. Subtle bounce light from the lower right prevents the face from disappearing. No streetlights or warm tones. Colors are vivid: the red of a Spider-Man mask appears natural and saturated. Face is 100% identical to the reference image, hyper-realistic skin (micro pores, wetness). Hair is wet with strands sticking to the forehead. Wearing the upper part of the Spider-Man suit. Preserve identity from reference exactly.`,
    promptRu: `Ультра крупный план кинематографичного портрета под сильным ночным ливнем. Кадр плотный, голова и плечи (85мм, f/1.8). Фон тёмный, лёгкие капли в свете. Основной свет: мягкий лунный свет сверху и слева сверху. Тонкий отскок снизу-справа. Никаких уличных фонарей или тёплых тонов. Цвета насыщены: красный маски Spider-Man естественный и сочный. Лицо на 100% идентично референсу. Кожа гиперреалистичная (микропоры, влажность). Влажные волосы. Только верхняя часть костюма Spider-Man. Сохранить идентичность.`,
    badge: 'NEW',
  },
  {
    catSlug: 'editorial', refFile: REF(7),
    promptEn: `A realistic vertical mirror selfie of the same young man from the reference image, with his face and identity preserved exactly as in the source image. Hair is short, slightly messy, slightly damp. He is a bearded man. Focus on facial details, skin texture, and clothing textures. He is wearing a white shirt with the buttons open. There are realistic red marks and traces on his face, neck, chest, and arms. He wears a silver chain around his neck and is smoking a cigarette. He slightly tilts his head backward to emphasize the jawline. The photo is taken indoors with atmospheric (moody) lighting. The overall look is natural, realistic, and unprocessed, giving the feeling of a casual mirror selfie. The face must not be altered.`,
    promptRu: `Реалистичное вертикальное зеркальное селфи того же молодого мужчины с референса, лицо и идентичность сохранены точно. Волосы короткие, чуть растрёпанные, слегка влажные. Бородатый. Фокус на чертах лица, текстуре кожи и одежды. Белая рубашка с расстёгнутыми пуговицами. Реалистичные красные следы на лице, шее, груди и руках. Серебряная цепочка, курит сигарету. Слегка запрокидывает голову назад. В помещении с атмосферным светом. Естественный, необработанный вид — случайное зеркальное селфи. Лицо не должно быть изменено.`,
    badge: null,
  },
]

// ─── Helpers ───────────────────────────────────────────────────────────

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function publishReference(refFile) {
  // Copy reference into /uploads/featured/ so KIE can fetch it via picpulse.fun
  const src = path.join(REF_DIR, refFile)
  if (!fs.existsSync(src)) throw new Error(`Reference not found: ${src}`)
  const ext = path.extname(refFile)
  const stableName = `idea_ref_${path.basename(refFile, ext)}${ext}`
  const dst = path.join(UPLOAD_DIR, stableName)
  if (!fs.existsSync(dst)) {
    fs.copyFileSync(src, dst)
  }
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
    input: {
      prompt,
      input_urls: [refUrl],
      aspect_ratio: '4:5',
      resolution: '1K',
      nsfw_checker: true,
    },
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
        try {
          const parsed = JSON.parse(data.resultJson)
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
  // Download → compress with cwebp (q80, max 1024 width)
  const tmpRaw = path.join(UPLOAD_DIR, `_tmp_${ideaId}.bin`)
  const finalName = `idea_${ideaId}.webp`
  const finalPath = path.join(UPLOAD_DIR, finalName)
  execSync(`curl -s -L -o ${tmpRaw} "${srcUrl}"`, { timeout: 60000 })
  execSync(`cwebp -q 80 -resize 1024 0 ${tmpRaw} -o ${finalPath} 2>/dev/null`, { timeout: 30000 })
  try { fs.unlinkSync(tmpRaw) } catch {}
  return `${PUBLIC_URL}/uploads/featured/${finalName}`
}

// ─── Main ──────────────────────────────────────────────────────────────

async function main() {
  console.log('📁 Upserting categories…')
  const catBySlug = {}
  for (const c of CATEGORIES) {
    const row = await prisma.ideaCategory.upsert({
      where: { slug: c.slug },
      create: c,
      update: { nameRu: c.nameRu, nameEn: c.nameEn, position: c.position },
    })
    catBySlug[c.slug] = row
  }
  console.log(`   ${Object.keys(catBySlug).length} categories ready`)

  for (let i = 0; i < IDEAS.length; i++) {
    const idea = IDEAS[i]
    const num = i + 1
    const tag = `[${num}/${IDEAS.length}]`

    // Skip if already created (match on promptRu prefix)
    const existing = await prisma.idea.findFirst({
      where: { promptRu: idea.promptRu },
    })
    if (existing) {
      console.log(`${tag} ⏭  already exists, skipping (id=${existing.id})`)
      continue
    }

    try {
      console.log(`${tag} 📤 publishing reference ${idea.refFile}…`)
      const refUrl = await publishReference(idea.refFile)

      console.log(`${tag} 🧠 generating with ${MODEL}…`)
      const taskId = await generate(idea.promptEn, refUrl)
      console.log(`${tag}    taskId=${taskId}, polling…`)
      const resultUrl = await pollDone(taskId)
      console.log(`${tag} ✅ result: ${resultUrl}`)

      const ideaId = crypto.randomBytes(6).toString('hex')
      const localUrl = downloadAndCompress(resultUrl, ideaId)
      console.log(`${tag} 💾 saved as ${localUrl}`)

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
      console.log(`${tag} 💡 idea created in DB (id=${created.id})`)
    } catch (e) {
      console.error(`${tag} ❌ failed: ${e.message}`)
    }
  }

  await prisma.$disconnect()
  console.log('🎉 Done')
}

main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1) })
