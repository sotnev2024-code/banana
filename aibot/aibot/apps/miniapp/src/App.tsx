import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import { BottomNav } from './components/ui/BottomNav'
import FeedPage from './pages/FeedPage'
import CreatePage from './pages/CreatePage'
import HistoryPage from './pages/HistoryPage'
import ProfilePage from './pages/ProfilePage'
import PlansPage from './pages/PlansPage'
import PaymentSuccessPage from './pages/PaymentSuccessPage'

export default function App() {
  return (
    <AuthProvider>
      <div className="layout">
        <div className="page">
          <Routes>
            <Route path="/" element={<Navigate to="/feed" replace />} />
            <Route path="/feed" element={<FeedPage />} />
            <Route path="/create" element={<CreatePage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/plans" element={<PlansPage />} />
            <Route path="/payment/success" element={<PaymentSuccessPage />} />
          </Routes>
        </div>
        <BottomNav />
      </div>
    </AuthProvider>
  )
}
