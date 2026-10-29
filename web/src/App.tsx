import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth'
import Account from './pages/Account'
import AuthForm from './pages/AuthForm'
import Design from './pages/Design'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <main>
          <Routes>
            <Route path="/login" element={<AuthForm mode="login" />} />
            <Route path="/register" element={<AuthForm mode="register" />} />
            <Route path="/_design" element={<Design />} />
            <Route path="/account" element={<Account />} />
            <Route path="*" element={<Navigate to="/account" replace />} />
          </Routes>
        </main>
      </BrowserRouter>
    </AuthProvider>
  )
}
