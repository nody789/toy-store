// ============================================================
// 【檔案說明】db.js — 資料庫連線設定與初始化
//
// 這個檔案做了以下幾件事：
//   1. 建立 PostgreSQL 連線池（Pool）
//   2. 定義 initDb()：建立資料表、插入預設資料
//   3. 匯出 pool 和 initDb 給其他檔案使用
// ============================================================

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function initDb() {
  const client = await pool.connect();

  try {
    // ── 後台帳號 ──────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // ── 商品 ──────────────────────────────────────────────────
    // price 單位為元（整數），image_url 存 Cloudinary 網址
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        price INTEGER NOT NULL DEFAULT 0,
        image_url TEXT,
        active INTEGER DEFAULT 1,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // ── 輪播圖 ────────────────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS carousel (
        id SERIAL PRIMARY KEY,
        title TEXT,
        description TEXT,
        image_url TEXT NOT NULL,
        sort_order INTEGER DEFAULT 0,
        active INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // ── 網站設定（Key-Value）────────────────────────────────────
    // 用 key 區分不同設定，例如 announcement、seo_keywords
    await client.query(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    `);

    // ── 訂單主表 ──────────────────────────────────────────────
    // status: pending=待付款, paid=已付款, cancelled=已取消, refunded=已退款
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        order_number TEXT UNIQUE NOT NULL,
        customer_name TEXT NOT NULL,
        customer_email TEXT NOT NULL,
        customer_phone TEXT,
        total_amount INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        payment_method TEXT,
        ecpay_trade_no TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // ── 訂單明細 ──────────────────────────────────────────────
    // 商品資訊用快照（product_name/price），避免商品被刪後遺失紀錄
    await client.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
        product_id INTEGER,
        product_name TEXT NOT NULL,
        product_image TEXT,
        price INTEGER NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        subtotal INTEGER NOT NULL
      )
    `);

    // ── 金流交易紀錄 ──────────────────────────────────────────
    // 每次 ECPay Webhook 回呼都新增一筆，保留完整原始資料
    await client.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
        ecpay_trade_no TEXT,
        payment_type TEXT,
        amount INTEGER,
        rtn_code TEXT,
        rtn_msg TEXT,
        raw_data TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // ── 預設管理員帳號 ────────────────────────────────────────
    // 預設帳密：admin / admin123（上線前請務必修改）
    const hashed = await bcrypt.hash('admin123', 10);
    await client.query(
      'INSERT INTO admins (username, password) VALUES ($1, $2) ON CONFLICT (username) DO NOTHING',
      ['admin', hashed]
    );

    // ── 預設網站設定 ──────────────────────────────────────────
    const defaults = [
      ['announcement', '歡迎來到玩具店！'],
      ['seo_keywords', '玩具,兒童玩具,益智玩具'],
      ['seo_description', '提供各類優質玩具，適合各年齡層兒童。'],
    ];
    for (const [key, value] of defaults) {
      await client.query(
        'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING',
        [key, value]
      );
    }

    // ── 示範輪播圖（資料表為空時才插入）──────────────────────
    const { rows: carouselRows } = await client.query('SELECT COUNT(*) AS c FROM carousel');
    if (parseInt(carouselRows[0].c) === 0) {
      const slides = [
        ['新品上市', '最新玩具搶先看', 'https://picsum.photos/seed/toy1/1200/500', 1],
        ['特價優惠', '限時折扣活動中', 'https://picsum.photos/seed/toy2/1200/500', 2],
      ];
      for (const [title, description, image_url, sort_order] of slides) {
        await client.query(
          'INSERT INTO carousel (title, description, image_url, sort_order) VALUES ($1, $2, $3, $4)',
          [title, description, image_url, sort_order]
        );
      }
    }

    // ── 示範商品（資料表為空時才插入）────────────────────────
    const { rows: productRows } = await client.query('SELECT COUNT(*) AS c FROM products');
    if (parseInt(productRows[0].c) === 0) {
      const products = [
        ['積木組合', '適合 3 歲以上兒童，培養空間邏輯能力', 350, 'https://picsum.photos/seed/toy-p1/400/400', 1],
        ['遙控賽車', '高速遙控賽車，最高時速 20km/h', 980, 'https://picsum.photos/seed/toy-p2/400/400', 2],
        ['拼圖 100 片', '精美圖案拼圖，適合全家共樂', 220, 'https://picsum.photos/seed/toy-p3/400/400', 3],
      ];
      for (const [name, description, price, image_url, sort_order] of products) {
        await client.query(
          'INSERT INTO products (name, description, price, image_url, sort_order) VALUES ($1, $2, $3, $4, $5)',
          [name, description, price, image_url, sort_order]
        );
      }
    }

    console.log('✅ 資料庫初始化完成');

  } finally {
    client.release();
  }
}

module.exports = { pool, initDb };
