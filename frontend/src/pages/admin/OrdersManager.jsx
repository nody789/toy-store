import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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

const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })

export default function OrdersManager() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [toast, setToast] = useState({ message: '', type: 'success' })

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast({ message: '' }), 3000)
  }

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders', activeTab],
    queryFn: () => api.get('/orders', { params: activeTab ? { status: activeTab } : {} }).then(r => r.data),
  })

  // 訂單詳情獨立快取，避免每次開 Modal 都重新打 API
  const { data: orderDetail, isLoading: detailLoading } = useQuery({
    queryKey: ['order-detail', selectedOrder?.id],
    queryFn: () => api.get(`/orders/${selectedOrder.id}`).then(r => r.data),
    enabled: !!selectedOrder?.id,
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => api.put(`/orders/${id}`, { status }),
    onSuccess: (_, { id, status }) => {
      showToast('狀態已更新')
      // 同步更新列表快取（不用重新打 API）
      queryClient.setQueryData(['orders', activeTab], (old) =>
        old?.map(o => o.id === id ? { ...o, status } : o)
      )
      queryClient.setQueryData(['order-detail', id], (old) =>
        old ? { ...old, status } : old
      )
    },
    onError: () => showToast('狀態更新失敗', 'error'),
  })

  return (
    <div>
      <AdminToast message={toast.message} type={toast.type} onClose={() => setToast({ message: '' })} />

      <h2 className="text-xl font-bold text-gray-800 mb-6">訂單管理</h2>

      <div className="flex gap-1 mb-4 bg-white rounded shadow-sm p-1 w-fit">
        {TABS.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-1.5 rounded text-sm transition-colors ${
              activeTab === tab.key ? 'bg-blue-500 text-white font-medium' : 'text-gray-600 hover:bg-gray-50'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="space-y-3 p-4">
            {[1, 2, 3].map(i => <div key={i} className="h-14 bg-gray-100 rounded animate-pulse" />)}
          </div>
        ) : orders.length === 0 ? (
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
                      <button onClick={() => setSelectedOrder(order)} className="text-blue-500 hover:text-blue-700 text-xs">查看</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-5 border-b">
              <h3 className="font-bold text-gray-800">
                訂單詳情
                {orderDetail?.order_number && <span className="ml-2 font-mono text-sm text-gray-500">#{orderDetail.order_number}</span>}
              </h3>
              <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>

            {detailLoading ? (
              <div className="p-8 space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />)}
              </div>
            ) : orderDetail ? (
              <div className="p-5 space-y-5">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">顧客資訊</h4>
                  <div className="bg-gray-50 rounded p-3 text-sm space-y-1">
                    <div><span className="text-gray-500">姓名：</span>{orderDetail.customer_name}</div>
                    <div><span className="text-gray-500">Email：</span>{orderDetail.customer_email}</div>
                    {orderDetail.customer_phone && <div><span className="text-gray-500">電話：</span>{orderDetail.customer_phone}</div>}
                  </div>
                </div>

                {orderDetail.items?.length > 0 && (
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
                          {orderDetail.items.map(item => (
                            <tr key={item.id}>
                              <td className="px-3 py-2 flex items-center gap-2">
                                {item.product_image && <img src={item.product_image} alt="" className="w-8 h-8 rounded object-cover" />}
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
                            <td className="px-3 py-2 text-right font-bold text-gray-800">NT$ {orderDetail.total_amount?.toLocaleString()}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">更新狀態</h4>
                  <div className="flex gap-2 flex-wrap">
                    {Object.entries(STATUS_MAP).map(([key, val]) => (
                      <button key={key}
                        disabled={updateStatusMutation.isPending || orderDetail.status === key}
                        onClick={() => updateStatusMutation.mutate({ id: orderDetail.id, status: key })}
                        className={`px-3 py-1.5 rounded text-xs transition-colors ${
                          orderDetail.status === key
                            ? `${val.color} cursor-default font-medium`
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50'
                        }`}>
                        {val.label}
                      </button>
                    ))}
                  </div>
                </div>

                {orderDetail.transactions?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">金流記錄</h4>
                    <div className="space-y-2">
                      {orderDetail.transactions.map(t => (
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
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}
