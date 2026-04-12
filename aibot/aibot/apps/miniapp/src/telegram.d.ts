interface TelegramWebAppUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  photo_url?: string
  language_code?: string
}

interface TelegramWebApp {
  initData: string
  initDataUnsafe: {
    user?: TelegramWebAppUser
    query_id?: string
    auth_date: number
    hash: string
  }
  version: string
  platform: string
  colorScheme: 'light' | 'dark'
  themeParams: Record<string, string>
  isExpanded: boolean
  viewportHeight: number
  viewportStableHeight: number
  ready(): void
  expand(): void
  close(): void
  setHeaderColor(color: string): void
  setBackgroundColor(color: string): void
  openLink(url: string): void
  openTelegramLink(url: string): void
  showAlert(message: string, callback?: () => void): void
  showConfirm(message: string, callback: (confirmed: boolean) => void): void
  HapticFeedback: {
    impactOccurred(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'): void
    notificationOccurred(type: 'error' | 'success' | 'warning'): void
    selectionChanged(): void
  }
  MainButton: {
    text: string
    color: string
    textColor: string
    isVisible: boolean
    isActive: boolean
    isProgressVisible: boolean
    setText(text: string): void
    onClick(callback: () => void): void
    offClick(callback: () => void): void
    show(): void
    hide(): void
    enable(): void
    disable(): void
    showProgress(leaveActive?: boolean): void
    hideProgress(): void
  }
  BackButton: {
    isVisible: boolean
    onClick(callback: () => void): void
    offClick(callback: () => void): void
    show(): void
    hide(): void
  }
}

interface Window {
  Telegram?: {
    WebApp: TelegramWebApp
  }
}
