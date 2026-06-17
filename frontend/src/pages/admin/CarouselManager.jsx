import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../api'
import AdminToast from '../../components/admin/AdminToast'

const emptyForm = { title: '', description: '', image_url: '', sort_order: 0, active: 1 }

export default function CarouselManager() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [toast, setToast] = useState({ message: '', type: 'success' })

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast({ message: '' }), 3000)
  }

  const { data: slides = [], isLoading } = useQuery({
    queryKey: ['carousel-all'],
    queryFn: () => api.get('/carousel/all').then(r => r.data),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['carousel-all'] })

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/carousel', data),
    onSuccess: () => { showToast('新增成功'); setForm(emptyForm); setShowForm(false); invalidate() },
    onError: (err) => showToast(err.response?.data?.message || '新增失敗', 'error'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.put(`/carousel/${id}`, data),
    onSuccess: () => { showToast('更新成功'); setForm(emptyForm); setEditingId(null); setShowForm(false); invalidate() },
    onError: (err) => showToast(err.response?.data?.message || '更新失敗', 'error'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/carousel/${id}`),
    onSuccess: () => { showToast('刪除成功'); invalidate() },
    onError: () => showToast('刪除失敗', 'error'),
  })

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

  const handleEdit = (slide) => {
    setForm({ title: slide.title || '', description: slide.description || '', image_url: slide.image_url, sort_order: slide.sort_order, active: slide.active })
    setEditingId(slide.id)
    setShowForm(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.image_url) return showToast('請上傳圖片', 'error')
    if (editingId) updateMutation.mutate({ id: editingId, data: form })
    else createMutation.mutate(form)
  }

  const isSaving = createMutation.isPending || updateMutation.isPending

  return (
    <div>
      <AdminToast message={toast.message} type={toast.type} onClose={() => setToast({ message: '' })} />

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">輪播圖管理</h2>
        <button onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(true) }}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm transition-colors">
          + 新增輪播圖
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded shadow-sm p-6 mb-6">
          <h3 className="font-medium text-gray-700 mb-4">{editingId ? '編輯輪播圖' : '新增輪播圖'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">圖片 *</label>
              <div className="flex items-center gap-3">
                <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-2 rounded text-sm transition-colors">
                  {uploading ? '上傳中...' : '選擇圖片'}
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                </label>
                {form.image_url && <img src={form.image_url} alt="預覽" className="h-16 rounded border object-cover" />}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">標題</label>
                <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">排序</label>
                <input type="number" min="0" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: Number(e.target.value) }))}
                  className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">說明文字</label>
              <input type="text" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
            </div>
            <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600">
              <input type="checkbox" checked={form.active === 1} onChange={e => setForm(f => ({ ...f, active: e.target.checked ? 1 : 0 }))} className="w-4 h-4" />
              啟用顯示
            </label>
            <div className="flex gap-2">
              <button type="submit" disabled={isSaving || uploading}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded text-sm transition-colors">
                {isSaving ? '儲存中...' : '儲存'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-600 px-4 py-2 rounded text-sm transition-colors">
                取消
              </button>
            </div>
          </form>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-52 bg-gray-100 rounded animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {slides.length === 0 ? (
            <p className="text-gray-400 text-sm col-span-full py-8 text-center">目前沒有輪播圖</p>
          ) : slides.map((slide) => (
            <div key={slide.id} className="bg-white rounded shadow-sm overflow-hidden">
              <img src={slide.image_url} alt={slide.title} className="w-full h-40 object-cover" />
              <div className="p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{slide.title || '（無標題）'}</p>
                    <p className="text-xs text-gray-400">排序：{slide.sort_order}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${slide.active ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                    {slide.active ? '啟用' : '停用'}
                  </span>
                </div>
                <div className="flex gap-2 mt-2">
                  <button onClick={() => handleEdit(slide)} className="text-blue-500 hover:text-blue-700 text-xs">編輯</button>
                  <button onClick={() => { if (confirm('確定要刪除這張輪播圖嗎？')) deleteMutation.mutate(slide.id) }} className="text-red-400 hover:text-red-600 text-xs">刪除</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
