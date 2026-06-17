import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api'

export default function Dashboard() {
  const [stats, setStats] = useState({ products: 0, carousel: 0 })

  useEffect(() => {
    Promise.all([
      api.get('/products/all'),
      api.get('/carousel/all'),
    ]).then(([products, carousel]) => {
      setStats({
        products: products.data.length,
        carousel: carousel.data.length,
      })
    }).catch(() => {})
  }, [])

  const cards = [
    { label: '商品數量', value: stats.products, to: '/admin/products', color: 'bg-blue-500' },
    { label: '輪播張數', value: stats.carousel, to: '/admin/carousel', color: 'bg-purple-500' },
  ]

  const quickLinks = [
    { to: '/admin/products', label: '管理商品', desc: '新增、修改、刪除商品' },
    { to: '/admin/carousel', label: '管理輪播圖', desc: '上傳首頁輪播圖片' },
    { to: '/admin/settings', label: '網站設定', desc: '修改公告、SEO 關鍵字' },
  ]

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-6">歡迎使用後台管理系統</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {cards.map((card) => (
          <Link
            key={card.label}
            to={card.to}
            className="bg-white rounded shadow-sm p-4 flex items-center gap-3 hover:shadow-md transition-shadow"
          >
            <div className={`${card.color} rounded-full w-10 h-10 flex items-center justify-center text-white font-bold text-lg`}>
              {card.value}
            </div>
            <div className="text-sm text-gray-600">{card.label}</div>
          </Link>
        ))}
      </div>

      <div className="bg-white rounded shadow-sm p-5">
        <h3 className="font-medium text-gray-700 mb-4">快速操作</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {quickLinks.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="p-3 border border-gray-200 rounded hover:border-blue-300 hover:bg-blue-50/30 transition-colors"
            >
              <div className="text-sm font-medium text-gray-700">{item.label}</div>
              <div className="text-xs text-gray-400 mt-1">{item.desc}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
