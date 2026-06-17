import { useEffect, useState } from 'react'
import api from '../../api'
import AdminToast from '../../components/admin/AdminToast'

const STATUS_MAP = {
  pending:   { label: '待付款', color: 'bg-yellow-100 text-yellow-700' },
  paid:      { label: '已付款', color: 'bg-green-100 text-green-600' },
  cancelled: { label: '已取消', color: 'bg-gray-100 text-gray-500' },
  refunded:  { label: '已退款', color: 'bg-red-100 text-red-500' },
}

const TABS = [
  { key: '', label: '全部' },
  { key: 'pending', label: '待付款' },
  { key: 'paid', label: '已付款' },
  { key: 'cancelled', label: '已取消' },
  { key: 'refunded', label: '已退款' },
]

export default function OrdersManager() {
  const [orders, setOrders] = useState([])
  const [activeTab, setActiveTab] = useState('')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [toast, setToast] = useState({ message: '', type: 'success' })
  const [statusUpdating, setStatusUpdating] = useState(false)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast({ message: '' }), 3000)
  }

  const fetchOrders = async (status = '') => {
    try {
      const res = await api.get('/orders', { params: status ? { status } : {} })
      setOrders(res.data)
    } catch {
      showToast('載入訂單失敗', 'error')
    }
  }

  useEffect(() => { fetchOrders(activeTab) }, [activeTab])

  const openDetail = async (orderId) => {
    setDetailLoading(true)
    setSelectedOrder({ id: orderId })
    try {
      const res = await api.get(`/orders/${orderId}`)
      setSelectedOrder(res.data)
    } catch {
      showToast('載入訂單詳情失敗', 'error')
      setSelectedOrder(null)
    } finally {
      setDetailLoading(false)
    }
  }

  const handleStatusChange = async (orderId, newStatus) => {
    setStatusUpdating(true)
    try {
      await api.put(`/orders/${orderId}`, { status: newStatus })
      showToast('狀態已更新')
      // 同步更新列表和詳情
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => ({ ...prev, status: newStatus }))
      }
    } catch {
      showToast('狀態更新失敗', 'error')
    } finally {
      setStatusUpdating(false)
    }
  }

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })

  return (
    <div>
      <AdminToast message={toast.message} type={toast.type} onClose={() => setToast({ message: '' })} />

      <h2 className="text-xl font-bold text-gray-800 mb-6">訂單管理</h2>

      {/* 狀態篩選 Tab */}
      <div className="flex gap-1 mb-4 bg-white rounded shadow-sm p-1 w-fit">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-1.5 rounded text-sm transition-colors ${
              activeTab === tab.key
                ? 'bg-blue-500 text-white font-medium'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 訂單列表 */}
      <div className="bg-white rounded shadow-sm overflow-hidden">
        {orders.length === 0 ? (
          <div className="text-center text-gray-400 py-12 text-sm">目前沒有訂單</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left">訂單編號</th>
                <th className="px-4 py-3 text-left">顧客</th>
                <th className="px-4 py-3 text-left">金額</th>
                <th className="px-4 py-3 text-left">狀態</th>
                <th className="px-4 py-3 text-left">建立時間</th>
                <th className="px-4 py-3 text-left">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map(order => {
                const s = STATUS_MAP[order.status] || STATUS_MAP.pending
                return (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-700">{order.order_number}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800">{order.customer_name}</div>
                      <div className="text-xs text-gray-400">{order.customer_email}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">NT$ {order.total_amount.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${s.color}`}>{s.label}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">{formatDate(order.created_at)}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openDetail(order.id)}
                        className="text-blue-500 hover:text-blue-700 text-xs"
                      >
                        查看
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* 訂單詳情 Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-5 border-b">
              <h3 className="font-bold text-gray-800">
                訂單詳情
                {selectedOrder.order_number && (
                  <span className="ml-2 font-mono text-sm text-gray-500">#{selectedOrder.order_number}</span>
                )}
              </h3>
              <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>

            {detailLoading ? (
              <div className="p-8 text-center text-gray-400 text-sm">載入中...</div>
            ) : (
              <div className="p-5 space-y-5">
                {/* 顧客資訊 */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">顧客資訊</h4>
                  <div className="bg-gray-50 rounded p-3 text-sm space-y-1">
                    <div><span className="text-gray-500">姓名：</span>{selectedOrder.customer_name}</div>
                    <div><span className="text-gray-500">Email：</span>{selectedOrder.customer_email}</div>
                    {selectedOrder.customer_phone && (
                      <div><span className="text-gray-500">電話：</span>{selectedOrder.customer_phone}</div>
                    )}
                  </div>
                </div>

                {/* 商品明細 */}
                {selectedOrder.items?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">商品明細</h4>
                    <div className="border rounded overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-gray-500 text-xs">
                          <tr>
                            <th className="px-3 py-2 text-left">商品</th>
                            <th className="px-3 py-2 text-right">單價</th>
                            <th className="px-3 py-2 text-right">數量</th>
                            <th className="px-3 py-2 text-right">小計</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {selectedOrder.items.map(item => (
                            <tr key={item.id}>
                              <td className="px-3 py-2 flex items-center gap-2">
                                {item.product_image && (
                                  <img src={item.product_image} alt="" className="w-8 h-8 rounded object-cover" />
                                )}
                                {item.product_name}
                              </td>
                              <td className="px-3 py-2 text-right">NT$ {item.price.toLocaleString()}</td>
                              <td className="px-3 py-2 text-right">{item.quantity}</td>
                              <td className="px-3 py-2 text-right font-medium">NT$ {item.subtotal.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-gray-50">
                          <tr>
                            <td colSpan={3} className="px-3 py-2 text-right text-gray-600 text-sm">總計</td>
                            <td className="px-3 py-2 text-right font-bold text-gray-800">
                              NT$ {selectedOrder.total_amount?.toLocaleString()}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}

                {/* 更新狀態 */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">更新狀態</h4>
                  <div className="flex gap-2 flex-wrap">
                    {Object.entries(STATUS_MAP).map(([key, val]) => (
                      <button
                        key={key}
                        disabled={statusUpdating || selectedOrder.status === key}
                        onClick={() => handleStatusChange(selectedOrder.id, key)}
                        className={`px-3 py-1.5 rounded text-xs transition-colors ${
                          selectedOrder.status === key
                            ? `${val.color} cursor-default font-medium`
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50'
                        }`}
                      >
                        {val.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 金流記錄 */}
                {selectedOrder.transactions?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">金流記錄</h4>
                    <div className="space-y-2">
                      {selectedOrder.transactions.map(t => (
                        <div key={t.id} className="bg-gray-50 rounded p-3 text-xs text-gray-600 space-y-0.5">
                          <div className="flex justify-between">
                            <span>交易編號：{t.ecpay_trade_no || '—'}</span>
                            <span>{formatDate(t.created_at)}</span>
                          </div>
                          <div>付款方式：{t.payment_type || '—'}</div>
                          <div className={t.rtn_code === '1' ? 'text-green-600' : 'text-red-500'}>
                            {t.rtn_code === '1' ? '✓ 付款成功' : `✗ ${t.rtn_msg || '失敗'}`}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
