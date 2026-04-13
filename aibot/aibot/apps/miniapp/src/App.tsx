import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import { useBackButton } from './hooks/useBackButton'
import { useScrollRestore } from './hooks/useScrollRestore'
import { BottomNav } from './components/ui/BottomNav'
import FeedPage from './pages/FeedPage'
import CreatePage from './pages/CreatePage'
import HistoryPage from './pages/HistoryPage'
import ProfilePage from './pages/ProfilePage'
import PlansPage from './pages/PlansPage'
import PaymentSuccessPage from './pages/PaymentSuccessPage'
import TransactionsPage from './pages/TransactionsPage'
import ReferralPage from './pages/ReferralPage'
import AchievementsPage from './pages/AchievementsPage'
import FavoritesPage from './pages/FavoritesPage'
import SettingsPage from './pages/SettingsPage'
import PromoPage from './pages/PromoPage'
import { ToastProvider } from './components/ui/Toast'
import GenerationDetailPage from './pages/GenerationDetailPage'
import AdminPage from './pages/admin/AdminPage'
import UserProfilePage from './pages/UserProfilePage'
import NotificationsPage from './pages/NotificationsPage'

function AppContent() {
  useBackButton()
  const pageRef = useScrollRestore()
  return (
    <div className="layout">
        <div className="page" ref={pageRef}>
          <Routes>
            <Route path="/" element={<Navigate to="/feed" replace />} />
            <Route path="/feed" element={<FeedPage />} />
            <Route path="/create" element={<CreatePage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/plans" element={<PlansPage />} />
            <Route path="/payment/success" element={<PaymentSuccessPage />} />
            <Route path="/transactions" element={<TransactionsPage />} />
            <Route path="/referral" element={<ReferralPage />} />
            <Route path="/achievements" element={<AchievementsPage />} />
            <Route path="/favorites" element={<FavoritesPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/promo" element={<PromoPage />} />
            <Route path="/generation/:id" element={<GenerationDetailPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/user/:id" element={<UserProfilePage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
          </Routes>
        </div>
        <BottomNav />
        <ToastProvider />
      </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
