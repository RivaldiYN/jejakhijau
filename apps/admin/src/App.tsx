import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAdminAuth } from './stores/adminAuth.store'
import AdminLayout from './components/AdminLayout'
import Login from './pages/Login'
import AdminDashboard from './pages/AdminDashboard'
import Users from './pages/Users'
import Badges from './pages/Badges'
import EmissionFactors from './pages/EmissionFactors'
import Tips from './pages/Tips'
import Announcements from './pages/Announcements'

const qc = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30_000 } } })

function AdminGuard({ children }: { children: React.ReactNode }) {
  const { token, user } = useAdminAuth()
  if (!token || user?.role !== 'admin') return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <AdminGuard>
                <AdminLayout />
              </AdminGuard>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard"        element={<AdminDashboard />} />
            <Route path="users"            element={<Users />} />
            <Route path="badges"           element={<Badges />} />
            <Route path="emission-factors" element={<EmissionFactors />} />
            <Route path="tips"             element={<Tips />} />
            <Route path="announcements"    element={<Announcements />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
