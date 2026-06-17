import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const navItems = [
  { to: '/admin', label: '總覽', end: true },
  { to: '/admin/products', label: '商品管理' },
  { to: '/admin/carousel', label: '輪播圖' },
  { to: '/admin/settings', label: '網站設定' },
]

export default function AdminLayout() {
  const { username, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/admin/login')
  }

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* 側邊欄 */}
      <aside className="w-52 bg-white shadow-sm flex flex-col">
        <div className="p-4 border-b">
          <h1 className="font-bold text-gray-800">玩具店後台</h1>
          <p className="text-xs text-gray-400 mt-1">{username}</p>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `block px-3 py-2 rounded text-sm transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t">
          <button
            onClick={handleLogout}
            className="w-full text-sm text-gray-500 hover:text-red-500 py-2 transition-colors"
          >
            登出
          </button>
        </div>
      </aside>

      {/* 主內容區 */}
      <main className="flex-1 p-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
