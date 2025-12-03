import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './contexts/auth-context'
import './styles.css'

// Import pages
import IndexPage from './routes/index'
import LoginPage from './routes/login'
import RegisterPage from './routes/register'
import AdminLayout from './routes/admin'
import ApiKeysPage from './routes/admin/api-keys'
import GoogleAccountsPage from './routes/admin/google-accounts'
import GeminiPage from './routes/admin/gemini'
import KimiPage from './routes/admin/kimi'

// Render the app
const rootElement = document.getElementById('app')
if (rootElement && !rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <StrictMode>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<IndexPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<div>Dashboard</div>} />
              <Route path="api-keys" element={<ApiKeysPage />} />
              <Route path="google-accounts" element={<GoogleAccountsPage />} />
              <Route path="gemini" element={<GeminiPage />} />
              <Route path="kimi" element={<KimiPage />} />
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </StrictMode>,
  )
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
