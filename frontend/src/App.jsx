import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/admin/Login'
import Dashboard from './pages/admin/Dashboard'
import ProductsManager from './pages/admin/ProductsManager'
import CarouselManager from './pages/admin/CarouselManager'
import SiteSettings from './pages/admin/SiteSettings'
import AdminLayout from './components/admin/AdminLayout'
import ProtectedRoute from './components/admin/ProtectedRoute'

export default function App() {
  return (
    <Routes>
      <Route path="/admin/login" element={<Login />} />

      {/* 所有後台頁面都需要登入 */}
      <Route path="/admin" element={
        <ProtectedRoute>
          <AdminLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Dashboard />} />
        <Route path="products" element={<ProductsManager />} />
        <Route path="carousel" element={<CarouselManager />} />
        <Route path="settings" element={<SiteSettings />} />
      </Route>

      {/* 預設導向後台 */}
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  )
}
