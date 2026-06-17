import { useEffect, useState } from 'react'
import api from '../../api'
import AdminToast from '../../components/admin/AdminToast'

export default function SiteSettings() {
  const [settings, setSettings] = useState({ announcement: '', seo_keywords: '', seo_description: '' })
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState({ message: '', type: 'success' })

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast({ message: '' }), 3000)
  }

  useEffect(() => {
    api.get('/settings').then(res => setSettings(prev => ({ ...prev, ...res.data }))).catch(() => {})
  }, [])

  const handleSave = async (key) => {
    setLoading(true)
    try {
      await api.put(`/settings/${key}`, { value: settings[key] })
      showToast('儲存成功')
    } catch {
      showToast('儲存失敗', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <AdminToast message={toast.message} type={toast.type} onClose={() => setToast({ message: '' })} />

      <h2 className="text-xl font-bold text-gray-800 mb-6">網站設定</h2>

      <div className="space-y-6 max-w-2xl">
        {/* 公告 */}
        <div className="bg-white rounded shadow-sm p-5">
          <h3 className="font-medium text-gray-700 mb-3">網站公告</h3>
          <textarea
            value={settings.announcement}
            onChange={e => setSettings(s => ({ ...s, announcement: e.target.value }))}
            rows={3}
            className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            placeholder="輸入公告內容..."
          />
          <button
            onClick={() => handleSave('announcement')}
            disabled={loading}
            className="mt-3 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded text-sm transition-colors"
          >
            {loading ? '儲存中...' : '儲存公告'}
          </button>
        </div>

        {/* SEO 關鍵字 */}
        <div className="bg-white rounded shadow-sm p-5">
          <h3 className="font-medium text-gray-700 mb-1">SEO 關鍵字</h3>
          <p className="text-xs text-gray-400 mb-3">多個關鍵字用逗號分隔，例如：玩具,兒童玩具,益智玩具</p>
          <input
            type="text"
            value={settings.seo_keywords}
            onChange={e => setSettings(s => ({ ...s, seo_keywords: e.target.value }))}
            className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            placeholder="玩具,兒童玩具,益智玩具"
          />
          <button
            onClick={() => handleSave('seo_keywords')}
            disabled={loading}
            className="mt-3 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded text-sm transition-colors"
          >
            {loading ? '儲存中...' : '儲存關鍵字'}
          </button>
        </div>

        {/* SEO 描述 */}
        <div className="bg-white rounded shadow-sm p-5">
          <h3 className="font-medium text-gray-700 mb-1">SEO 描述</h3>
          <p className="text-xs text-gray-400 mb-3">顯示在搜尋結果的網站描述，建議 50-160 字</p>
          <textarea
            value={settings.seo_description}
            onChange={e => setSettings(s => ({ ...s, seo_description: e.target.value }))}
            rows={2}
            className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            placeholder="提供各類優質玩具，適合各年齡層兒童。"
          />
          <button
            onClick={() => handleSave('seo_description')}
            disabled={loading}
            className="mt-3 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded text-sm transition-colors"
          >
            {loading ? '儲存中...' : '儲存描述'}
          </button>
        </div>
      </div>
    </div>
  )
}
