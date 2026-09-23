/**
 * 卡密生成器：node scripts/gen-cards.js [数量] [天数]
 * 示例：
 *   node scripts/gen-cards.js 50 30     生成50张30天卡
 *   node scripts/gen-cards.js 10 365    生成10张年卡
 * 卡密写入 data/cards.json，可直接发放给用户。
 */
'use strict';

const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, '..', 'data');
const CARDS_FILE = path.join(DATA_DIR, 'cards.json');

const count = parseInt(process.argv[2], 10) || 10;
const days = parseInt(process.argv[3], 10) || 30;

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
const store = fs.existsSync(CARDS_FILE) ? JSON.parse(fs.readFileSync(CARDS_FILE, 'utf8')) : { cards: [] };

function nowStr() { const d = new Date(); return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`; }
function randCode(len) {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

let seq = 1000 + store.cards.length;
const out = [];
for (let i = 0; i < count; i++) {
  seq += 1;
  const key = `QM${nowStr()}${String(seq).padStart(6, '0')}${randCode(4)}`;
  store.cards.push({ key, days, status: 'active', from: 'gen', createdAt: Date.now() });
  out.push(key);
}
fs.writeFileSync(CARDS_FILE, JSON.stringify(store, null, 2), 'utf8');
console.log(`已生成 ${count} 张 ${days} 天卡密，写入 ${CARDS_FILE}`);
console.log(out.join('\n'));
