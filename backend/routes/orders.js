// ============================================================
// 【檔案說明】routes/orders.js — 訂單管理 API
//
// 端點：
//   GET  /api/orders          → 後台：取得所有訂單，可用 status 篩選（需登入）
//   GET  /api/orders/:id      → 後台：取得單筆訂單含商品明細（需登入）
//   PUT  /api/orders/:id      → 後台：更新訂單狀態或備註（需登入）
//   POST /api/orders          → 前台：建立訂單（公開，供購物車結帳用）
// ============================================================

const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const auth = require('../middleware/auth');

// ── 後台：取得所有訂單 ─────────────────────────────────────
// 支援 ?status=pending|paid|cancelled|refunded 篩選
router.get('/', auth, async (req, res) => {
  try {
    const { status } = req.query;
    let query = `
      SELECT id, order_number, customer_name, customer_email, customer_phone,
             total_amount, status, payment_method, ecpay_trade_no, created_at, updated_at
      FROM orders
    `;
    const params = [];
    if (status) {
      query += ' WHERE status = $1';
      params.push(status);
    }
    query += ' ORDER BY created_at DESC';

    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error('取得訂單列表失敗:', err);
    res.status(500).json({ success: false, message: '伺服器錯誤' });
  }
});

// ── 後台：取得單筆訂單（含商品明細與交易記錄）────────────────
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const { rows: orders } = await pool.query(
      'SELECT * FROM orders WHERE id = $1',
      [id]
    );
    if (orders.length === 0) return res.status(404).json({ success: false, message: '訂單不存在' });

    const { rows: items } = await pool.query(
      'SELECT * FROM order_items WHERE order_id = $1 ORDER BY id',
      [id]
    );

    const { rows: transactions } = await pool.query(
      'SELECT id, ecpay_trade_no, payment_type, amount, rtn_code, rtn_msg, created_at FROM transactions WHERE order_id = $1 ORDER BY created_at DESC',
      [id]
    );

    res.json({ ...orders[0], items, transactions });
  } catch (err) {
    console.error('取得訂單詳情失敗:', err);
    res.status(500).json({ success: false, message: '伺服器錯誤' });
  }
});

// ── 後台：更新訂單狀態或備註 ───────────────────────────────
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const validStatuses = ['pending', 'paid', 'cancelled', 'refunded'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: '無效的訂單狀態' });
    }

    const fields = [];
    const params = [];
    let idx = 1;

    if (status !== undefined) { fields.push(`status = $${idx++}`); params.push(status); }
    if (notes !== undefined)  { fields.push(`notes = $${idx++}`); params.push(notes); }
    fields.push(`updated_at = NOW()`);

    params.push(id);
    const { rows } = await pool.query(
      `UPDATE orders SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      params
    );

    if (rows.length === 0) return res.status(404).json({ success: false, message: '訂單不存在' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('更新訂單失敗:', err);
    res.status(500).json({ success: false, message: '伺服器錯誤' });
  }
});

// ── 前台：建立訂單（購物車結帳時呼叫）───────────────────────
// 此端點公開，前台結帳流程使用
// customer: { name, email, phone }
// items: [{ product_id, product_name, product_image, price, quantity }]
router.post('/', async (req, res) => {
  const client = await pool.connect();
  try {
    const { customer, items } = req.body;

    if (!customer?.name || !customer?.email) {
      return res.status(400).json({ success: false, message: '姓名與 Email 為必填' });
    }
    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: '訂單不得為空' });
    }

    const total_amount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // 產生訂單編號：TS + 日期 + 4碼流水號
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const { rows: countRows } = await client.query(
      "SELECT COUNT(*) AS c FROM orders WHERE created_at::date = CURRENT_DATE"
    );
    const seq = String(parseInt(countRows[0].c) + 1).padStart(4, '0');
    const order_number = `TS${dateStr}${seq}`;

    await client.query('BEGIN');

    const { rows: orderRows } = await client.query(
      `INSERT INTO orders (order_number, customer_name, customer_email, customer_phone, total_amount)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [order_number, customer.name, customer.email, customer.phone || null, total_amount]
    );
    const order = orderRows[0];

    for (const item of items) {
      const subtotal = item.price * item.quantity;
      await client.query(
        `INSERT INTO order_items (order_id, product_id, product_name, product_image, price, quantity, subtotal)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [order.id, item.product_id || null, item.product_name, item.product_image || null, item.price, item.quantity, subtotal]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ success: true, data: { order_id: order.id, order_number } });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('建立訂單失敗:', err);
    res.status(500).json({ success: false, message: '伺服器錯誤' });
  } finally {
    client.release();
  }
});

module.exports = router;
