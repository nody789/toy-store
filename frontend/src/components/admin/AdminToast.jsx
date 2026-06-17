// 簡易 Toast 通知元件，顯示操作成功或失敗訊息
export default function AdminToast({ message, type = 'success', onClose }) {
  if (!message) return null

  const colors = {
    success: 'bg-green-500',
    error: 'bg-red-500',
  }

  return (
    <div className={`fixed top-4 right-4 z-50 ${colors[type]} text-white px-5 py-3 rounded shadow-lg flex items-center gap-3`}>
      <span>{message}</span>
      <button onClick={onClose} className="text-white/80 hover:text-white text-lg leading-none">×</button>
    </div>
  )
}
