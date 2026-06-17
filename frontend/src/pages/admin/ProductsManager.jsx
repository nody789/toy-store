import { useEffect, useState } from 'react'
import api from '../../api'
import AdminToast from '../../components/admin/AdminToast'

const emptyForm = { name: '', description: '', price: '', image_url: '', active: 1, sort_order: 0 }

export default function ProductsManager() {
  const [products, setProducts] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState({ message: '', type: 'success' })

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast({ message: '', type: 'success' }), 3000)
  }

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products/all')
      setProducts(res.data)
    } catch {
      showToast('載入失敗', 'error')
    }
  }

  useEffect(() => { fetchProducts() }, [])

  const handleImageUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('image', file)
      const res = await api.post('/upload', formData)
      setForm(f => ({ ...f, image_url: res.data.url }))
      showToast('圖片上傳成功')
    } catch {
      showToast('圖片上傳失敗', 'error')
    } finally {
      setUploading(false)
    }
  }

  const handleEdit = (product) => {
    setForm({
      name: product.name,
      description: product.description || '',
      price: product.price,
      image_url: product.image_url || '',
      active: product.active,
      sort_order: product.sort_order,
    })
    setEditingId(product.id)
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return showToast('商品名稱為必填', 'error')
    setLoading(true)
    try {
      if (editingId) {
        await api.put(`/products/${editingId}`, { ...form, price: Number(form.price) })
        showToast('更新成功')
      } else {
        await api.post('/products', { ...form, price: Number(form.price) })
        showToast('新增成功')
      }
      setForm(emptyForm)
      setEditingId(null)
      setShowForm(false)
      fetchProducts()
    } catch (err) {
      showToast(err.response?.data?.message || '操作失敗', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('確定要刪除這個商品嗎？')) return
    try {
      await api.delete(`/products/${id}`)
      showToast('刪除成功')
      fetchProducts()
    } catch {
      showToast('刪除失敗', 'error')
    }
  }

  return (
    <div>
      <AdminToast message={toast.message} type={toast.type} onClose={() => setToast({ message: '' })} />

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">商品管理</h2>
        <button
          onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(true) }}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm transition-colors"
        >
          + 新增商品
        </button>
      </div>

      {/* 新增/編輯表單 */}
      {showForm && (
        <div className="bg-white rounded shadow-sm p-6 mb-6">
          <h3 className="font-medium text-gray-700 mb-4">{editingId ? '編輯商品' : '新增商品'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">商品名稱 *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">售價（元）*</label>
                <input
                  type="number"
                  min="0"
                  value={form.price}
                  onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                  className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">商品描述</label>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={3}
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">商品圖片</label>
              <div className="flex items-center gap-3">
                <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-2 rounded text-sm transition-colors">
                  {uploading ? '上傳中...' : '選擇圖片'}
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                </label>
                {form.image_url && (
                  <img src={form.image_url} alt="預覽" className="w-16 h-16 object-cover rounded border" />
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">排序</label>
                <input
                  type="number"
                  min="0"
                  value={form.sort_order}
                  onChange={e => setForm(f => ({ ...f, sort_order: Number(e.target.value) }))}
                  className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={form.active === 1}
                    onChange={e => setForm(f => ({ ...f, active: e.target.checked ? 1 : 0 }))}
                    className="w-4 h-4"
                  />
                  上架顯示
                </label>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading || uploading}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded text-sm transition-colors"
              >
                {loading ? '儲存中...' : '儲存'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-600 px-4 py-2 rounded text-sm transition-colors"
              >
                取消
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 商品列表 */}
      <div className="bg-white rounded shadow-sm overflow-hidden">
        {products.length === 0 ? (
          <div className="text-center text-gray-400 py-12">目前沒有商品，請點擊「新增商品」</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left">圖片</th>
                <th className="px-4 py-3 text-left">商品名稱</th>
                <th className="px-4 py-3 text-left">售價</th>
                <th className="px-4 py-3 text-left">排序</th>
                <th className="px-4 py-3 text-left">狀態</th>
                <th className="px-4 py-3 text-left">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-12 h-12 object-cover rounded" />
                    ) : (
                      <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center text-gray-300 text-xs">無圖</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800">{product.name}</div>
                    {product.description && (
                      <div className="text-xs text-gray-400 mt-0.5 line-clamp-1">{product.description}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-700">NT$ {product.price.toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-500">{product.sort_order}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${product.active ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                      {product.active ? '上架' : '下架'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(product)}
                        className="text-blue-500 hover:text-blue-700 text-xs"
                      >
                        編輯
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="text-red-400 hover:text-red-600 text-xs"
                      >
                        刪除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
