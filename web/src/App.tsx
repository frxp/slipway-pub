import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth'
import ThemeToggle from './ThemeToggle'
import Account from './pages/Account'
import AuthForm from './pages/AuthForm'
import Design from './pages/Design'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ThemeToggle />
        <main>
          <Routes>
            <Route path="/login" element={<AuthForm mode="login" />} />
            <Route path="/register" element={<AuthForm mode="register" />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            {import.meta.env.DEV && <Route path="/_design" element={<Design />} />}
            <Route path="/account" element={<Account />} />
            <Route path="*" element={<Navigate to="/account" replace />} />
          </Routes>
        </main>
      </BrowserRouter>
    </AuthProvider>
  )
}
