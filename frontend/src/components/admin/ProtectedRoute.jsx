import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

// 未登入時自動導向登入頁
export default function ProtectedRoute({ children }) {
  const { isLoggedIn } = useAuth()
  if (!isLoggedIn) return <Navigate to="/admin/login" replace />
  return children
}
