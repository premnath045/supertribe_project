import { Routes, Route } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { AuthProvider } from './contexts/AuthContext'
import NotificationProvider from './components/Layout/NotificationProvider'
import Layout from './components/Layout/Layout'
import HomePage from './pages/HomePage'
import DiscoverPage from './pages/DiscoverPage'
import CreatePostPage from './pages/CreatePostPage'
import NotificationsPage from './pages/NotificationsPage'
import ProfilePage from './pages/ProfilePage'
import MessagesPage from './pages/MessagesPage'
import ProfileView from './pages/ProfileView'
import PostView from './pages/PostView'
import ResetPasswordPage from './pages/ResetPasswordPage'
import CreatorVerificationPage from './pages/CreatorVerificationPage'
import CreatorDashboardPage from './pages/CreatorDashboardPage'
import StorageDebugPage from './pages/StorageDebugPage'
import ProtectedRoute from './components/Auth/ProtectedRoute'
import ErrorBoundary from './components/ErrorBoundary'

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <NotificationProvider>
          <div className="min-h-screen bg-gray-50">
            <AnimatePresence mode="wait">
              <Routes>
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/storage-debug" element={<StorageDebugPage />} />
                <Route path="/creator-verification" element={
                  <ProtectedRoute>
                    <CreatorVerificationPage />
                  </ProtectedRoute>
                } />
                <Route path="/creator-dashboard" element={
                  <ProtectedRoute requiredRole="creator">
                    <CreatorDashboardPage />
                  </ProtectedRoute>
                } />
                <Route path="/" element={<Layout />}>
                  <Route index element={
                    <ProtectedRoute requireAuth={false}>
                      <HomePage />
                    </ProtectedRoute>
                  } />
                  <Route path="discover" element={
                    <ProtectedRoute requireAuth={false}>
                      <DiscoverPage />
                    </ProtectedRoute>
                  } />
                  <Route path="create" element={
                    <ProtectedRoute requiredRole="creator">
                      <CreatePostPage />
                    </ProtectedRoute>
                  } />
                  <Route path="notifications" element={
                    <ProtectedRoute>
                      <NotificationsPage />
                    </ProtectedRoute>
                  } />
                  <Route path="profile/:username" element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  } />
                  <Route path="post/:postId" element={
                    <ProtectedRoute requireAuth={false}>
                      <PostView />
                    </ProtectedRoute>
                  } />
                  <Route path="user/:username" element={
                    <ProtectedRoute requireAuth={false}>
                      <ProfileView />
                    </ProtectedRoute>
                  } />
                  <Route path="messages" element={
                    <ProtectedRoute>
                      <MessagesPage />
                    </ProtectedRoute>
                  } />
                </Route>
              </Routes>
            </AnimatePresence>
          </div>
        </NotificationProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App