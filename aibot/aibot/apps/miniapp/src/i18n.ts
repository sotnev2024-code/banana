const translations = {
  ru: {
    // Nav
    'nav.feed': 'Лента',
    'nav.create': 'Создать',
    'nav.history': 'История',
    'nav.profile': 'Профиль',

    // Feed
    'feed.title': 'AI Студия',
    'feed.subtitle': 'лента генераций',
    'feed.all': 'Все',
    'feed.photo': 'Фото',
    'feed.video': 'Видео',
    'feed.music': 'Музыка',
    'feed.motion': 'Motion',

    // Create
    'create.title': 'Создать',
    'create.uploadRef': 'Загрузить референс',
    'create.uploadOptional': 'необязательно',
    'create.promptPlaceholder': 'Опишите что хотите создать...',
    'create.quickStyle': 'Быстрый стиль',
    'create.generate': 'Сгенерировать',
    'create.generating': 'Генерирую...',
    'create.generatingTime': 'Это займёт 1-3 минуты',
    'create.generatingHint': 'Можешь закрыть — пришлю в бот когда будет готово',
    'create.done': 'Готово!',
    'create.download': 'Скачать',
    'create.createMore': 'Создать ещё',
    'create.selectModel': 'Сначала выберите модель.',
    'create.insufficientTokens': 'Недостаточно токенов. Нужно {required}, есть {balance}',
    'create.genError': 'Ошибка генерации. Токены возвращены.',
    'create.publishToFeed': 'Опубликовать в ленту',
    'create.publishDesc': 'Другие пользователи увидят ваш результат',
    'create.styles.realism': 'реализм',
    'create.styles.anime': 'аниме',
    'create.styles.art': 'арт',
    'create.styles.3d': '3D',
    'create.styles.cinema': 'кино',
    'create.styles.minimal': 'минимализм',
    'create.styles.watercolor': 'акварель',

    // Detail
    'detail.prompt': 'Промпт',
    'detail.model': 'Модель',
    'detail.type': 'Тип',
    'detail.settings': 'Настройки',
    'detail.reference': 'Референс',
    'detail.author': 'Автор',
    'detail.date': 'Дата',
    'detail.cost': 'Стоимость',
    'detail.download': 'Скачать',
    'detail.tryPrompt': 'Попробовать промпт',
    'detail.addFavorite': 'В избранное',
    'detail.removeFavorite': 'Из избранного',
    'detail.comments': 'Комментарии',
    'detail.commentPlaceholder': 'Написать комментарий...',
    'detail.send': 'Отправить',
    'detail.noComments': 'Пока нет комментариев',
    'detail.report': 'Пожаловаться',
    'detail.reported': 'Жалоба отправлена',
    'detail.moderationBlock': 'Контент не прошёл модерацию',

    // History
    'history.title': 'История',
    'history.empty': 'Генераций пока нет. Создайте первую!',
    'history.status.done': 'готово',
    'history.status.pending': 'ожидание',
    'history.status.processing': 'генерация',
    'history.status.failed': 'ошибка',
    'history.status.refunded': 'возврат',

    // Profile
    'profile.title': 'Профиль',
    'profile.balance': 'Баланс',
    'profile.topUp': 'Пополнить',
    'profile.dailyBonus': 'Ежедневный бонус',
    'profile.dailyDay': 'День {day}',
    'profile.dailyGet': 'получите {tokens} токенов',
    'profile.dailyClaim': 'Забрать',
    'profile.dailyClaimed': 'токенов!',
    'profile.dailySeries': 'Серия: {streak} дней',
    'profile.dailyComeBack': 'Возвращайтесь завтра!',
    'profile.dailyStreak': 'Серия: {streak} дн.',
    'profile.generations': 'Генераций',
    'profile.spent': 'Потрачено',
    'profile.daysInRow': 'Дней подряд',
    'profile.favorites': 'Избранное',
    'profile.achievements': 'Достижения',
    'profile.inviteFriends': 'Пригласить друзей',
    'profile.inviteBonus': 'Получайте бонусы',
    'profile.transactions': 'История транзакций',
    'profile.promoCode': 'Промокод',
    'profile.settings': 'Настройки',
    'profile.loading': 'Загрузка...',
    'profile.since': 'с {date}',
    'profile.tokens': 'токенов',

    // Plans
    'plans.title': 'Пополнение',
    'plans.balance': 'Баланс: {balance}',
    'plans.tokens': 'токенов',
    'plans.bonus': '+{bonus} бонус',
    'plans.popular': 'Хит продаж',
    'plans.payMethod': 'Способ оплаты',
    'plans.card': 'Банковская карта (ЮKassa)',
    'plans.stars': 'Telegram Stars',
    'plans.pay': 'Оплатить {price} руб.',
    'plans.paying': 'Открываю оплату...',

    // Transactions
    'tx.title': 'Транзакции',
    'tx.empty': 'Транзакций пока нет',
    'tx.purchase': 'Покупка',
    'tx.spend': 'Генерация',
    'tx.bonus': 'Бонус',
    'tx.refund': 'Возврат',
    'tx.referral': 'Реферал',
    'tx.daily': 'Ежедневный',
    'tx.promo': 'Промокод',
    'tx.achievement': 'Достижение',

    // Referral
    'ref.title': 'Пригласить друзей',
    'ref.hero': 'Приглашайте друзей',
    'ref.heroDesc': 'Получайте {bonus} токенов за каждого друга, который сделает первую покупку',
    'ref.invited': 'Приглашено',
    'ref.earned': 'Заработано',
    'ref.yourLink': 'Ваша ссылка',
    'ref.copy': 'Копировать',
    'ref.copied': 'Скопировано',
    'ref.share': 'Поделиться',
    'ref.shareText': 'Попробуй AI генерацию! Фото, видео, музыка — всё в одном боте',
    'ref.invitedList': 'Приглашённые ({count})',

    // Achievements
    'ach.title': 'Достижения',
    'ach.unlocked': '{unlocked} / {total} открыто',
    'ach.reward': '+{reward} токенов награда',
    'ach.cat.generation': 'Генерации',
    'ach.cat.social': 'Социальные',
    'ach.cat.spending': 'Траты',
    'ach.cat.streak': 'Серии',

    // Favorites
    'fav.title': 'Избранное',
    'fav.empty': 'Пока пусто',
    'fav.emptyDesc': 'Добавляйте лучшие генерации в избранное',

    // Settings
    'settings.title': 'Настройки',
    'settings.language': 'Язык',
    'settings.theme': 'Тема',
    'settings.themeAuto': 'Авто (системная)',
    'settings.themeLight': 'Светлая',
    'settings.themeDark': 'Тёмная',
    'settings.save': 'Сохранить',
    'settings.saving': 'Сохраняю...',
    'settings.version': 'PicPulse AI Studio v1.0',

    // Promo
    'promo.title': 'Промокод',
    'promo.hero': 'Активировать промокод',
    'promo.heroDesc': 'Введите код и получите бонусные токены',
    'promo.placeholder': 'ВВЕДИТЕ КОД',
    'promo.activate': 'Активировать',
    'promo.checking': 'Проверяю...',
    'promo.activated': 'Промокод активирован!',
  },

  en: {
    // Nav
    'nav.feed': 'Feed',
    'nav.create': 'Create',
    'nav.history': 'History',
    'nav.profile': 'Profile',

    // Feed
    'feed.title': 'AI Studio',
    'feed.subtitle': 'generation feed',
    'feed.all': 'All',
    'feed.photo': 'Photo',
    'feed.video': 'Video',
    'feed.music': 'Music',
    'feed.motion': 'Motion',

    // Create
    'create.title': 'Create',
    'create.uploadRef': 'Upload reference',
    'create.uploadOptional': 'optional',
    'create.promptPlaceholder': 'Describe what you want to create...',
    'create.quickStyle': 'Quick style',
    'create.generate': 'Generate',
    'create.generating': 'Generating...',
    'create.generatingTime': 'This will take 1-3 minutes',
    'create.generatingHint': 'You can close — we\'ll notify you in bot when ready',
    'create.done': 'Done!',
    'create.download': 'Download',
    'create.createMore': 'Create more',
    'create.selectModel': 'Select a model first.',
    'create.insufficientTokens': 'Not enough tokens. Need {required}, have {balance}',
    'create.genError': 'Generation error. Tokens refunded.',
    'create.publishToFeed': 'Publish to feed',
    'create.publishDesc': 'Other users will see your result',
    'create.styles.realism': 'realism',
    'create.styles.anime': 'anime',
    'create.styles.art': 'art',
    'create.styles.3d': '3D',
    'create.styles.cinema': 'cinema',
    'create.styles.minimal': 'minimal',
    'create.styles.watercolor': 'watercolor',

    // Detail
    'detail.prompt': 'Prompt',
    'detail.model': 'Model',
    'detail.type': 'Type',
    'detail.settings': 'Settings',
    'detail.reference': 'Reference',
    'detail.author': 'Author',
    'detail.date': 'Date',
    'detail.cost': 'Cost',
    'detail.download': 'Download',
    'detail.tryPrompt': 'Try this prompt',
    'detail.addFavorite': 'Add to favorites',
    'detail.removeFavorite': 'Remove from favorites',
    'detail.comments': 'Comments',
    'detail.commentPlaceholder': 'Write a comment...',
    'detail.send': 'Send',
    'detail.noComments': 'No comments yet',
    'detail.report': 'Report',
    'detail.reported': 'Report sent',
    'detail.moderationBlock': 'Content did not pass moderation',

    // History
    'history.title': 'History',
    'history.empty': 'No generations yet. Create your first!',
    'history.status.done': 'done',
    'history.status.pending': 'pending',
    'history.status.processing': 'processing',
    'history.status.failed': 'failed',
    'history.status.refunded': 'refunded',

    // Profile
    'profile.title': 'Profile',
    'profile.balance': 'Balance',
    'profile.topUp': 'Top up',
    'profile.dailyBonus': 'Daily bonus',
    'profile.dailyDay': 'Day {day}',
    'profile.dailyGet': 'get {tokens} tokens',
    'profile.dailyClaim': 'Claim',
    'profile.dailyClaimed': 'tokens!',
    'profile.dailySeries': 'Streak: {streak} days',
    'profile.dailyComeBack': 'Come back tomorrow!',
    'profile.dailyStreak': 'Streak: {streak} d.',
    'profile.generations': 'Generations',
    'profile.spent': 'Spent',
    'profile.daysInRow': 'Days in row',
    'profile.favorites': 'Favorites',
    'profile.achievements': 'Achievements',
    'profile.inviteFriends': 'Invite friends',
    'profile.inviteBonus': 'Get bonuses',
    'profile.transactions': 'Transaction history',
    'profile.promoCode': 'Promo code',
    'profile.settings': 'Settings',
    'profile.loading': 'Loading...',
    'profile.since': 'since {date}',
    'profile.tokens': 'tokens',

    // Plans
    'plans.title': 'Top up',
    'plans.balance': 'Balance: {balance}',
    'plans.tokens': 'tokens',
    'plans.bonus': '+{bonus} bonus',
    'plans.popular': 'Best seller',
    'plans.payMethod': 'Payment method',
    'plans.card': 'Bank card (YooKassa)',
    'plans.stars': 'Telegram Stars',
    'plans.pay': 'Pay {price} RUB',
    'plans.paying': 'Opening payment...',

    // Transactions
    'tx.title': 'Transactions',
    'tx.empty': 'No transactions yet',
    'tx.purchase': 'Purchase',
    'tx.spend': 'Generation',
    'tx.bonus': 'Bonus',
    'tx.refund': 'Refund',
    'tx.referral': 'Referral',
    'tx.daily': 'Daily',
    'tx.promo': 'Promo code',
    'tx.achievement': 'Achievement',

    // Referral
    'ref.title': 'Invite friends',
    'ref.hero': 'Invite friends',
    'ref.heroDesc': 'Get {bonus} tokens for each friend who makes their first purchase',
    'ref.invited': 'Invited',
    'ref.earned': 'Earned',
    'ref.yourLink': 'Your link',
    'ref.copy': 'Copy',
    'ref.copied': 'Copied',
    'ref.share': 'Share',
    'ref.shareText': 'Try AI generation! Photos, videos, music — all in one bot',
    'ref.invitedList': 'Invited ({count})',

    // Achievements
    'ach.title': 'Achievements',
    'ach.unlocked': '{unlocked} / {total} unlocked',
    'ach.reward': '+{reward} tokens reward',
    'ach.cat.generation': 'Generations',
    'ach.cat.social': 'Social',
    'ach.cat.spending': 'Spending',
    'ach.cat.streak': 'Streaks',

    // Favorites
    'fav.title': 'Favorites',
    'fav.empty': 'Nothing yet',
    'fav.emptyDesc': 'Add your best generations to favorites',

    // Settings
    'settings.title': 'Settings',
    'settings.language': 'Language',
    'settings.theme': 'Theme',
    'settings.themeAuto': 'Auto (system)',
    'settings.themeLight': 'Light',
    'settings.themeDark': 'Dark',
    'settings.save': 'Save',
    'settings.saving': 'Saving...',
    'settings.version': 'PicPulse AI Studio v1.0',

    // Promo
    'promo.title': 'Promo code',
    'promo.hero': 'Activate promo code',
    'promo.heroDesc': 'Enter a code and get bonus tokens',
    'promo.placeholder': 'ENTER CODE',
    'promo.activate': 'Activate',
    'promo.checking': 'Checking...',
    'promo.activated': 'Promo code activated!',
  },
} as const

type Lang = keyof typeof translations
type Key = keyof typeof translations['ru']

let currentLang: Lang = 'ru'

export function setLang(lang: string) {
  currentLang = (lang === 'en' ? 'en' : 'ru') as Lang
}

export function getLang(): string {
  return currentLang
}

export function t(key: Key, params?: Record<string, string | number>): string {
  let text = translations[currentLang][key] ?? translations['ru'][key] ?? key
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(`{${k}}`, String(v))
    }
  }
  return text
}

export function detectLang(): string {
  const tgLang = window.Telegram?.WebApp?.initDataUnsafe?.user?.language_code
  if (tgLang && tgLang.startsWith('en')) return 'en'
  return 'ru'
}

export function detectTheme(): string {
  return window.Telegram?.WebApp?.colorScheme ?? 'auto'
}
